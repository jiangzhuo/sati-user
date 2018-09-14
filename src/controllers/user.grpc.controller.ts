import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { __ as t } from 'i18n';
import * as SMSClient from '@alicloud/sms-sdk';
import {ACCESS_KEY_ID,ACCESS_KEY_SECRET,REGISTER_TEMPLATE_CODE,LOGIN_TEMPLATE_CODE} from '../configurations/sms.config'

import { CreateUserInput, UpdateUserInput, UserData } from '../interfaces/user.interface';
import { UserService } from '../services/user.service';
import { AuthService } from "../auth/auth.service";

@Controller()
export class UserGrpcController {
    constructor(
        @Inject(UserService) private readonly userService: UserService,
        @Inject(AuthService) private readonly authService: AuthService
    ) { }

    @GrpcMethod('UserService')
    async loginByMobile(payload: { mobile: string, verificationCode: string }) {
        const userData = await this.userService.loginByMobile(payload.mobile, payload.verificationCode);
        const tokenInfo = await this.authService.createToken({ userId: userData.userId });
        return { code: 200, message: t('Login success'), data: { tokenInfo, userData } };
    }

    @GrpcMethod('UserService')
    async registerByMobile(payload: { registerUserInput: CreateUserInput }) {
        await this.userService.registerByMobile(payload.registerUserInput);
        return { code: 200, message: t('Registration success') };
    }

    @GrpcMethod('UserService')
    async getRegisterVerificationCode(payload: { mobile: string }) {
        let verificationCode = this.authService.generateRegisterVerificationCode(payload.mobile);
        let smsClient = new SMSClient({ ACCESS_KEY_ID, ACCESS_KEY_SECRET });
        await smsClient.sendSMS({
            PhoneNumbers: payload.mobile,
            SignName: '正念app测试',
            TemplateCode: REGISTER_TEMPLATE_CODE,
            TemplateParam: `{"code":"${verificationCode}"}`
        });
        //     .then(function (res) {
        //     let {Code}=res
        //     if (Code === 'OK') {
        //         //处理返回参数
        //         console.log(res)
        //     }
        // }, function (err) {
        //     console.log(err)
        // })
        return { code: 200, message: t('getRegisterVerificationCode success'), data: verificationCode };
    }

    @GrpcMethod('UserService')
    async getLoginVerificationCode(payload: { mobile: string }) {
        let verificationCode = this.authService.generateLoginVerificationCode(payload.mobile);
        let smsClient = new SMSClient({ ACCESS_KEY_ID, ACCESS_KEY_SECRET });
        await smsClient.sendSMS({
            PhoneNumbers: payload.mobile,
            SignName: '正念app测试',
            TemplateCode: REGISTER_TEMPLATE_CODE,
            TemplateParam: `{"code":"${verificationCode}"}`
        });
        return { code: 200, message: t('getLoginVerificationCode success'), data: verificationCode };
    }

    @GrpcMethod('UserService')
    async updateUserInfoById(payload: { userId: string, updateUserInput: UpdateUserInput }) {
        await this.userService.updateUserInfo(payload.userId, payload.updateUserInput);
        return { code: 200, message: t('Update user information successfully') };
    }

    @GrpcMethod('UserService')
    async findUserInfoByIds(payload: { userIds: string[] }) {
        const data = await this.userService.findUserInfoById(payload.userIds) as UserData[];
        return { code: 200, message: t('Query the specified users information successfully'), data };
    }
}
