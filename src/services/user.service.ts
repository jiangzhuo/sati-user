import { forwardRef, HttpException, Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Model } from "mongoose";
import { InjectModel } from '@nestjs/mongoose';
import { __ as t } from 'i18n';

import { AuthService } from '../auth/auth.service';
import { User, CreateUserInput, UpdateUserInput } from '../interfaces/user.interface';
import { CryptoUtil } from '../utils/crypto.util';

@Injectable()
export class UserService {
    constructor(
        @InjectModel('User') private readonly userModel: Model<User>,
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
        if (!user) throw new RpcException({ code: 404, message: t('User does not exist') });
        console.log(updateUserInput)
        if (updateUserInput.nickname) {
            user = await this.userModel.findOneAndUpdate({ _id: id }, { nickname: updateUserInput.nickname }).exec();
        }
        if (updateUserInput.avatar) {
            user = await this.userModel.findOneAndUpdate({ _id: id }, { avatar: updateUserInput.avatar }).exec();
        }
        if (updateUserInput.password) {
            const newPassword = await this.cryptoUtil.encryptPassword(updateUserInput.password);
            user = await this.userModel.findOneAndUpdate({ _id: id }, { password: newPassword }).exec();
        }
        if (updateUserInput.status) {
            user = await this.userModel.findOneAndUpdate({ _id: id }, { status: updateUserInput.status }).exec();
        }
        return user;
    }

    async loginByMobile(mobile: string): Promise<User> {
        const user = await this.userModel.findOne({ mobile }).exec();
        return user;
    }

    async loginByMobileAndPassword(mobile: string, password: string) {
        const user = await this.userModel.findOne({ mobile }).exec();
        if (!user) throw new RpcException({ code: 404, message: t('User does not exist') });
        if (!await this.cryptoUtil.checkPassword(password, user.password)) {
            throw new RpcException({ code: 406, message: t('invalid password') });
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
}
