import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { __ as t } from 'i18n';

import { CreateUserInput, UpdateUserInput, UserInfoData } from '../interfaces/user.interface';
import { UserService } from '../services/user.service';

@Controller()
export class UserGrpcController {
    constructor(
        @Inject(UserService) private readonly userService: UserService
    ) { }

    @GrpcMethod('UserService')
    async loginByMobile(payload: { mobile: string, verificationCode: string }) {
        const data = await this.userService.loginByMobile(payload.mobile, payload.verificationCode);
        return { code: 200, message: t('Login success'), data };
    }

    @GrpcMethod('UserService')
    async registerByMobile(payload: { registerUserInput: CreateUserInput }) {
        await this.userService.register(payload.registerUserInput);
        return { code: 200, message: t('Registration success') };
    }

    @GrpcMethod('UserService')
    async updateUserInfoById(payload: { userId: string, updateUserInput: UpdateUserInput }) {
        await this.userService.updateUserInfo(payload.userId, payload.updateUserInput);
        return { code: 200, message: t('Update user information successfully') };
    }

    @GrpcMethod('UserService')
    async findUserInfoByIds(payload: { userIds: string[] }) {
        const data = await this.userService.findUserInfoById(payload.userIds) as UserInfoData[];
        return { code: 200, message: t('Query the specified users information successfully'), data };
    }
}
