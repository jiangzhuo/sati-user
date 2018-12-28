import { Inject, Injectable } from '@nestjs/common';
import { Connection, Model } from "mongoose";
import { InjectModel, InjectConnection } from '@nestjs/mongoose';

import * as cc from 'coupon-code';

// import { ObjectId } from 'bson';
import * as mongoose from 'mongoose';
import * as moment from 'moment';
import { Errors } from 'moleculer';
import MoleculerError = Errors.MoleculerError;
import { Coupon } from '../interfaces/coupon.interface';
import { UserService } from "./user.service";
import { User } from '../interfaces/user.interface';
import { Account } from '../interfaces/account.interface';

@Injectable()
export class CouponService {
    constructor(
        @InjectModel('Coupon') private readonly couponModel: Model<Coupon>,
        @InjectModel('Account') private readonly accountModel: Model<Account>,
        @InjectModel('User') private readonly userModel: Model<User>,
        @InjectConnection('sati') private readonly resourceClient: Connection,
        @Inject(UserService) private readonly userService: UserService,
    ) { }

    async generate(count: number = 1, value: number = 0, status: number = 0, userId: string = '000000000000000000000000', validTime: number = moment().unix(), expireTime: number = moment().unix()): Promise<Coupon[]> {
        if (count > 100) {
            throw new MoleculerError('generate too many', 429);
        }
        let createTime = moment().unix();
        let docs = [];
        for (let i = 1; i <= count; i++) {
            docs.push({
                couponCode: cc.generate(),
                value: value,
                status: status,
                userId: userId,
                createTime: createTime,
                usedTime: 0,
                validTime: validTime,
                expireTime: expireTime,
                whoUse: {}
            });
        }
        return await this.couponModel.insertMany(docs);
    }

    async getCoupon(first = 20, after?: number, before?: number, status = 0) {
        const condition = {};
        if (after) {
            condition['createTime'] = { $gt: after }
        }
        if (before) {
            if (condition['createTime']) {
                condition['createTime']['$lt'] = before
            } else {
                condition['createTime'] = { $lt: before }
            }
        }
        if (status !== 0) {
            condition['status'] = { $bitsAllClear: status }
        }
        let sort = { createTime: 1 };
        if (first < 0) {
            sort = { createTime: -1 }
        }
        let result = await this.couponModel.find(
            condition,
            null,
            { sort: sort }
        ).limit(Math.abs(first)).exec();
        return result

    }

    async getCouponByCode(couponCode: string): Promise<Coupon> {
        return this.couponModel.findOne({ couponCode: couponCode }).exec();
    }

    async getCouponById(couponId: string): Promise<Coupon> {
        return this.couponModel.findOne({ _id: couponId }).exec();
    }

    async changeStatus(couponId: string, bitModifier): Promise<Coupon> {
        return this.couponModel.findOneAndUpdate({ _id: couponId }, {
            usedTime: moment().unix(),
            $bit: { status: bitModifier }
        }, { new: true }).exec();
    }

    async use(coupon: Coupon, whoUse: any) {
        const session = await this.resourceClient.startSession();
        session.startTransaction();
        try {
            const user = await this.userModel.findOneAndUpdate({ _id: whoUse.userId },
                { $inc: { balance: coupon.value } }, { new: true }).session(session).exec();
            if (!user) throw new MoleculerError('no user', 404);
            let usedCoupon = await this.couponModel.findOneAndUpdate({ _id: coupon._id }, {
                usedTime: moment().unix(),
                whoUse: whoUse,
                $bit: { status: { or: 0b000000000000000000000000000000001 } }
            }, { new: true }).exec();
            await this.accountModel.create([{
                userId: whoUse.userId,
                value: coupon.value,
                afterBalance: user.balance,
                type: 'coupon',
                createTime: moment().unix(),
                extraInfo: JSON.stringify(usedCoupon),
            }], { session: session });
            await session.commitTransaction();
            session.endSession();

            // 发送队列已经使用了coupon
            // try {
            //     await this.producer.send(JSON.stringify({
            //         type: 'mindfulness',
            //         userId: userId,
            //         mindfulnessId: mindfulnessId
            //     }), ['buy'])
            // } catch (e) {
            //     Sentry.captureException(e)
            // }
            return usedCoupon;
        } catch (error) {
            // If an error occurred, abort the whole transaction and
            // undo any changes that might have happened
            await session.abortTransaction();
            session.endSession();
            throw error; // Rethrow so calling function sees error
        }
    }
}
