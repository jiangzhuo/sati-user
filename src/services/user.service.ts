import { forwardRef, HttpException, Inject, Injectable } from '@nestjs/common';
// import { RpcException } from '@nestjs/microservices';
import { Model } from "mongoose";
import { InjectModel } from '@nestjs/mongoose';
// import { __ as t } from 'i18n';

import { AuthService } from '../auth/auth.service';
import { User, CreateUserInput, UpdateUserInput } from '../interfaces/user.interface';
import { Account } from '../interfaces/account.interface';
import { CryptoUtil } from '../utils/crypto.util';


import { ObjectId } from 'bson';
import * as moment from 'moment';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Errors } from 'moleculer';
import MoleculerError = Errors.MoleculerError;

@Injectable()
export class UserService {
    constructor(
        @Inject(ElasticsearchService) private readonly elasticsearchService: ElasticsearchService,
        @InjectModel('User') private readonly userModel: Model<User>,
        @InjectModel('Account') private readonly accountModel: Model<Account>,
        @Inject(CryptoUtil) private readonly cryptoUtil: CryptoUtil,
        @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService
    ) { }

    async createUser(createUserInput: CreateUserInput): Promise<User> {
        // await this.checkUsernameExist(createUserInput.username);
        createUserInput.password = await this.cryptoUtil.encryptPassword(createUserInput.password);
        return await this.userModel.create(createUserInput);
    }

    async updateUser(id: string, updateUserInput: UpdateUserInput): Promise<User> {
        let user = await this.userModel.findOne({ _id: id }).exec();
        // if (!user) throw new RpcException({ code: 404, message: t('User does not exist') });
        if (!user) throw new MoleculerError('User does not exist', 404);
        if (updateUserInput.nickname) {
            user = await this.userModel.findOneAndUpdate({ _id: id }, { nickname: updateUserInput.nickname }, { new: true }).exec();
        }
        if (updateUserInput.avatar) {
            user = await this.userModel.findOneAndUpdate({ _id: id }, { avatar: updateUserInput.avatar }, { new: true }).exec();
        }
        if (updateUserInput.password) {
            const newPassword = await this.cryptoUtil.encryptPassword(updateUserInput.password);
            user = await this.userModel.findOneAndUpdate({ _id: id }, { password: newPassword }, { new: true }).exec();
        }
        if (updateUserInput.status) {
            user = await this.userModel.findOneAndUpdate({ _id: id }, { status: updateUserInput.status }, { new: true }).exec();
        }
        return user;
    }

    async loginByMobile(mobile: string): Promise<User> {
        const user = await this.userModel.findOne({ mobile }).exec();
        return user;
    }

    async loginByMobileAndPassword(mobile: string, password: string) {
        const user = await this.userModel.findOne({ mobile }).exec();
        if (!user) throw new MoleculerError('User does not exist', 404);
        if (!await this.cryptoUtil.checkPassword(password, user.password)) {
            // throw new RpcException({ code: 406, message: t('invalid password') });
            throw new MoleculerError('invalid password', 406);
        }
        return user
    }

    async registerBySMSCode(createUserInput: CreateUserInput): Promise<User> {
        createUserInput.status = 1;
        return await this.createUser(createUserInput);
    }

    async getUserById(id: string): Promise<User> {
        const user = await this.userModel.findOne({ _id: id }).exec();
        return user;
    }

    async getUserByIds(ids: string[]): Promise<User[]> {
        const users = await this.userModel.find({ _id: { $in: ids } }).exec();
        return users
    }

    async getUserByMobile(id: string): Promise<User> {
        const user = await this.userModel.findOne({ mobile: id }).exec();
        return user;
    }

    async getUser(first = 20, after?: string): Promise<User[]> {
        if (after) {
            return await this.userModel.find({ _id: { $gte: after } }).limit(first).exec();
        } else {
            return await this.userModel.find().limit(first).exec();
        }
    }

    async searchUserAccount(userId = '', page, limit, type = ''): Promise<Account[]> {
        let conditions = {};
        if (userId !== '') {
            conditions['userId'] = userId
        }
        if (type !== '') {
            conditions['type'] = type
        }
        let userAccountDetails = await this.accountModel.find(
            conditions,
            null,
            { limit: limit, skip: (page - 1) * limit }).exec();
        return userAccountDetails
    }

    async countUserAccount(userId = '', type = ''): Promise<number> {
        let conditions = {};
        if (userId !== '') {
            conditions['userId'] = userId
        }
        if (type !== '') {
            conditions['type'] = type
        }
        let userAccountTotal = await this.accountModel.countDocuments(conditions).exec();
        return userAccountTotal
    }

    async changeBalance(id: string, changeValue: number, type: string, extraInfo: string): Promise<User> {
        const user = await this.userModel.findOneAndUpdate({
            _id: id,
            balance: { $gte: -1 * changeValue }
        }, { $inc: { balance: changeValue } }, { new: true }).exec();
        // if (!user) throw new RpcException({ code: 402, message: t('not enough balance') });
        if (!user) throw new MoleculerError('not enough balance', 402);
        await this.accountModel.create({
            userId: id,
            value: changeValue,
            afterBalance: user.balance,
            type: type,
            createTime: moment().unix(),
            extraInfo: extraInfo,
        });
        return user
    }

    getConditions(keyword: string, page?: number, limit?: number, sort?: string){
        const mobileReg = /^1[3|4|5|7|8][0-9]{9}$/; //验证规则
        let conditions = {}
        if (ObjectId.isValid(keyword)) {
            // 按照id查询
            conditions = { _id: keyword };
        } else if (mobileReg.test(keyword)) {
            // 按照手机号查询
            conditions = { mobile: keyword };
        } else {
            // 按照名字查询
            conditions = { nickname: new RegExp(keyword, 'i') }
        }
        return conditions
    }

    async searchUser(keyword: string, from: number, size: number): Promise<{ total: number, data: User[] }> {
        // let conditions = this.getConditions(keyword, page, limit, sort);
        // let user = await this.userModel.find(
        //     conditions,
        //     null,
        //     { sort: sort, limit: limit, skip: (page - 1) * limit }).exec();
        //
        // return user
        let res = await this.elasticsearchService.search({
            index: 'user',
            type: 'user',
            body: {
                from: from,
                size: size,
                query: {
                    bool: {
                        should: [
                            {
                                wildcard: {
                                    mobile: `${keyword}*`
                                }
                            },
                            {
                                wildcard: {
                                    nickname: `*${keyword}*`
                                }
                            },
                            {
                                wildcard: {
                                    username: `*${keyword}*`
                                }
                            }
                        ]
                    }
                },
                // sort: {
                //     createTime: { order: "desc" }
                // }
            }
        }).toPromise()

        const ids = res[0].hits.hits.map(hit=>hit._id)
        return { total: res[0].hits.total, data: await this.getUserByIds(ids) }
    }

    async countUser(keyword: string): Promise<number> {
        let conditions = this.getConditions(keyword);
        let total = await this.userModel.countDocuments(conditions).exec();
        return total
    }
}
