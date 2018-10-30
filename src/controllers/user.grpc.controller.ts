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

import { CreateUserInput, UpdateUserInput } from '../interfaces/user.interface';
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
            throw new RpcException({ code: 406, message: t('Login by mobile failed') });
        }
        const user = await this.userService.loginByMobile(payload.mobile);
        if (!user) throw new RpcException({ code: 406, message: t('Login by mobile failed no user') });
        const tokenInfo = this.authService.createToken({ userId: user.id });
        return { data: { tokenInfo, user } };
    }

    @GrpcMethod('UserService')
    async loginByMobileAndPassword(payload: { mobile: string, password: string }) {
        const userData = await this.userService.loginByMobileAndPassword(payload.mobile, payload.password);
        const tokenInfo = this.authService.createToken({ userId: userData.id });
        return { data: { tokenInfo, userData } };
    }

    @GrpcMethod('UserService')
    async renewToken(payload: { userId: string }) {
        const userData = await this.userService.getUserById(payload.userId);
        const tokenInfo = this.authService.createToken({ userId: payload.userId });
        return { data: { tokenInfo, userData } };
    }

    @GrpcMethod('UserService')
    async registerBySMSCode(payload: { registerUserInput: CreateUserInput, verificationCode: string }) {
        const checkResult = this.authService.checkRegisterVerificationCode(payload.verificationCode, payload.registerUserInput.mobile);
        if (!checkResult) {
            throw new RpcException({ code: 403, message: t('Registration by mobile failed') });
        }
        let user = await this.userService.registerBySMSCode(payload.registerUserInput);
        return { data: user };
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
        return { data: verificationCode };
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
        return { data: verificationCode };
    }

    @GrpcMethod('UserService')
    async updateUserById(payload) {
        let user = await this.userService.updateUser(payload.id, payload);
        return { data: user };
    }

    @GrpcMethod('UserService')
    async getUserById(payload: { id: string }) {
        const user = await this.userService.getUserById(payload.id);
        return { data: user };
    }

    @GrpcMethod('UserService')
    async getUserByMobile(payload: { mobile: string }) {
        const user = await this.userService.getUserByMobile(payload.mobile);
        return { data: user };
    }

    @GrpcMethod('UserService')
    async getUser(payload: { first: number, after: string }) {
        const user = await this.userService.getUser(payload.first, payload.after);
        return { data: user };
    }

    @GrpcMethod('UserService')
    async changeBalance(payload: { id: string, changeValue: number, type: string, extraInfo: string }) {
        const user = await this.userService.changeBalance(payload.id, payload.changeValue, payload.type, payload.extraInfo);
        return { data: user };
    }

    @GrpcMethod('UserService')
    async searchUser(payload: { keyword: string, page: number, limit: number}) {
        return await this.userService.searchUser(payload.keyword, (payload.page - 1) * payload.limit, payload.limit);
    }

    @GrpcMethod('UserService')
    async countUser(payload: { keyword: string}) {
        const total = await this.userService.countUser(payload.keyword);
        return { data: total};
    }

    @GrpcMethod('UserService')
    async searchUserAccount(payload: { userId: string, page: number, limit: number, type: string }) {
        const data = await this.userService.searchUserAccount(payload.userId, payload.page, payload.limit, payload.type);
        return { data: data };
    }

    @GrpcMethod('UserService')
    async countUserAccount(payload: { userId: string, type: string }) {
        const data = await this.userService.countUserAccount(payload.userId, payload.type);
        return { data: data };
    }
}
