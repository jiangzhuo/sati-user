import { Controller, Inject, UseInterceptors } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { __ as t } from 'i18n';
import * as SMSClient from '@alicloud/sms-sdk';
import {
    ACCESS_KEY_ID,
    ACCESS_KEY_SECRET,
    REGISTER_TEMPLATE_CODE,
    LOGIN_TEMPLATE_CODE,
    SIGN_NAME
} from '../configurations/sms.config'

import { CreateUserInput, UpdateUserInput, UserData } from '../interfaces/user.interface';
import { UserService } from '../services/user.service';
import { AuthService } from "../auth/auth.service";
import { LoggingInterceptor } from "../interceptors/logging.interceptor";
import { ErrorsInterceptor } from "../interceptors/exception.interceptor";

@Controller()
@UseInterceptors(LoggingInterceptor, ErrorsInterceptor)
export class UserGrpcController {
    constructor(
        @Inject(UserService) private readonly userService: UserService,
        @Inject(AuthService) private readonly authService: AuthService
    ) { }

    @GrpcMethod('UserService')
    async loginBySMSCode(payload: { mobile: string, verificationCode: string }) {
        const checkResult = this.authService.checkLoginVerificationCode(payload.verificationCode, payload.mobile);
        if (!checkResult) {
            return { code: 406, message: t('Login by mobile failed'), data: {} };
        }
        const userData = await this.userService.loginByMobile(payload.mobile);
        const tokenInfo = await this.authService.createToken({ userId: userData.userId });
        return { code: 200, message: t('Login success'), data: { tokenInfo, userData } };
    }

    @GrpcMethod('UserService')
    async loginByMobileAndPassword(payload: { mobile: string, password: string }) {
        const userData = await this.userService.loginByMobileAndPassword(payload.mobile, payload.password);
        const tokenInfo = await this.authService.createToken({ userId: userData.userId });
        return { code: 200, message: t('Login success'), data: { tokenInfo, userData } };
    }

    @GrpcMethod('UserService')
    async registerBySMSCode(payload: { registerUserInput: CreateUserInput, verificationCode: string }) {
        const checkResult = this.authService.checkRegisterVerificationCode(payload.verificationCode, payload.registerUserInput.mobile);
        if (!checkResult) {
            return { code: 403, message: t('Registration by mobile failed') };
        }
        await this.userService.registerBySMSCode(payload.registerUserInput);
        return { code: 200, message: t('Registration success') };
    }

    @GrpcMethod('UserService')
    async getRegisterVerificationCode(payload: { mobile: string }) {
        let verificationCode = this.authService.generateRegisterVerificationCode(payload.mobile);
        let smsClient = new SMSClient({ accessKeyId: ACCESS_KEY_ID, secretAccessKey: ACCESS_KEY_SECRET });
        await smsClient.sendSMS({
            PhoneNumbers: payload.mobile,
            SignName: SIGN_NAME,
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
        let smsClient = new SMSClient({ accessKeyId: ACCESS_KEY_ID, secretAccessKey: ACCESS_KEY_SECRET });
        await smsClient.sendSMS({
            PhoneNumbers: payload.mobile,
            SignName: SIGN_NAME,
            TemplateCode: LOGIN_TEMPLATE_CODE,
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
    async findUserInfoById(payload: { userId: string }) {
        const data = await this.userService.findUserInfoById(payload.userId) as UserData;
        return { code: 200, message: t('Query the specified users information successfully'), data };
    }
}
