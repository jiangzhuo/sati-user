import { Inject, Injectable } from '@nestjs/common';
// import {GrpcMethod, RpcException} from '@nestjs/microservices';
// import { __ as t } from 'i18n';
import * as SMSClient from '@alicloud/sms-sdk';
import {
    ACCESS_KEY_ID,
    ACCESS_KEY_SECRET,
    REGISTER_TEMPLATE_CODE,
    LOGIN_TEMPLATE_CODE,
    SIGN_NAME
} from '../configurations/sms.config'

// import { CreateUserInput, UpdateUserInput } from '../interfaces/user.interface';
import { UserService } from '../services/user.service';
import { AuthService } from "../auth/auth.service";
// import { LoggingInterceptor } from "../interceptors/logging.interceptor";
// import { ErrorsInterceptor } from "../interceptors/exception.interceptor";
import { InjectBroker } from 'nestjs-moleculer';
import { ServiceBroker, Service, Context, Errors } from 'moleculer';
import MoleculerError = Errors.MoleculerError;

// @Controller()
// @UseInterceptors(LoggingInterceptor, ErrorsInterceptor)
@Injectable()
export class UserController extends Service {
    constructor(
        @InjectBroker() broker: ServiceBroker,
        @Inject(UserService) private readonly userService: UserService,
        @Inject(AuthService) private readonly authService: AuthService
    ) {
        super(broker);

        this.parseServiceSchema({
            name: "user",
            //version: "v2",
            meta: {
                scalable: true
            },
            // dependencies: [
            // 	"auth",
            // 	"users"
            // ],
            settings: {
                upperCase: true
            },
            actions: {
                loginBySMSCode: this.loginBySMSCode,
                loginByMobileAndPassword: this.loginByMobileAndPassword,
                renewToken: this.renewToken,
                registerBySMSCode: this.registerBySMSCode,
                updatePasswordBySMSCode: this.updatePasswordBySMSCode,
                getRegisterVerificationCode: this.getRegisterVerificationCode,
                getLoginVerificationCode: this.getLoginVerificationCode,
                updateUserById: this.updateUserById,
                // getUserById: this.getUserById,
                getUserById: {
                    cache: {
                        keys: ["id", "#udid"],
                        ttl: 30,
                    },
                    handler: this.getUserById
                },
                getUserByMobile: this.getUserByMobile,
                getUser: this.getUser,
                changeBalance: this.changeBalance,
                searchUser: this.searchUser,
                countUser: this.countUser,
                searchUserAccount: this.searchUserAccount,
                countUserAccount: this.countUserAccount,
                // welcome: {
                //     cache: {
                //         keys: ["name"]
                //     },
                //     params: {
                //         name: "string"
                //     },
                //     handler: this.welcome
                // }
            },
            // events: {
            //     "user.created": this.userCreated
            // },
            created: this.serviceCreated,
            started: this.serviceStarted,
            stopped: this.serviceStopped,
        });
    }

    serviceCreated() {
        this.logger.info("user service created.");
    }

    serviceStarted() {
        this.logger.info("user service started.");
    }

    serviceStopped() {
        this.logger.info("user service stopped.");
    }

    async loginBySMSCode(ctx: Context) {
        // console.log(ctx)
        const checkResult = this.authService.checkLoginVerificationCode(ctx.params.verificationCode, ctx.params.mobile);
        if (!checkResult) {
            // throw new RpcException({code: 406, message: t('Login by mobile failed')});
            throw new MoleculerError('Login by mobile failed', 406);
        }
        const user = await this.userService.loginByMobile(ctx.params.mobile);
        // if (!user) throw new RpcException({ code: 406, message: t('Login by mobile failed no user') });
        if (!user) throw new MoleculerError('Login by mobile failed no user', 406);
        const tokenInfo = this.authService.createToken({ userId: user.id });
        return { data: { tokenInfo, user } };
    }

    async loginByMobileAndPassword(ctx: Context) {
        const userData = await this.userService.loginByMobileAndPassword(ctx.params.mobile, ctx.params.password);
        const tokenInfo = this.authService.createToken({ userId: userData.id });
        return { data: { tokenInfo, userData } };
    }

    async renewToken(ctx: Context) {
        const userData = await this.userService.getUserById(ctx.params.userId);
        const tokenInfo = this.authService.createToken({ userId: ctx.params.userId });
        return { data: { tokenInfo, userData } };
    }

    async registerBySMSCode(ctx: Context) {
        const checkResult = this.authService.checkRegisterVerificationCode(ctx.params.verificationCode, ctx.params.registerUserInput.mobile);
        if (!checkResult) {
            // throw new RpcException({ code: 403, message: t('Registration by mobile failed') });
            throw new MoleculerError('Registration by mobile failed', 403);
        }
        let user = await this.userService.registerBySMSCode(ctx.params.registerUserInput);
        return { data: user };
    }

    async updatePasswordBySMSCode(ctx: Context) {
        const checkResult = this.authService.checkUpdatePasswordVerificationCode(ctx.params.verificationCode, ctx.params.mobile);
        if (!checkResult) {
            // throw new RpcException({ code: 403, message: t('Registration by mobile failed') });
            throw new MoleculerError('change password by mobile failed', 403);
        }
        let user = await this.userService.getUserByMobile(ctx.params.UserInput.mobile);
        if (user) {
            throw new MoleculerError('user not found', 404);
        }
        user = await this.userService.updateUser(user.id, { password: ctx.params.password });
        return { data: user };
    }

    async getRegisterVerificationCode(ctx: Context) {
        let verificationCode = this.authService.generateRegisterVerificationCode(ctx.params.mobile);
        let smsClient = new SMSClient({ accessKeyId: ACCESS_KEY_ID, secretAccessKey: ACCESS_KEY_SECRET });
        await smsClient.sendSMS({
            PhoneNumbers: ctx.params.mobile,
            SignName: SIGN_NAME,
            TemplateCode: REGISTER_TEMPLATE_CODE,
            TemplateParam: `{"code":"${verificationCode}"}`
        });
        return { data: verificationCode };
    }

    async getLoginVerificationCode(ctx: Context) {
        let verificationCode = this.authService.generateLoginVerificationCode(ctx.params.mobile);
        let smsClient = new SMSClient({ accessKeyId: ACCESS_KEY_ID, secretAccessKey: ACCESS_KEY_SECRET });
        await smsClient.sendSMS({
            PhoneNumbers: ctx.params.mobile,
            SignName: SIGN_NAME,
            TemplateCode: LOGIN_TEMPLATE_CODE,
            TemplateParam: `{"code":"${verificationCode}"}`
        });
        return { data: verificationCode };
    }

    async updateUserById(ctx: Context) {
        this.broker.cacher.clean(`user.getUserById:${ctx.params.id}*`);
        let user = await this.userService.updateUser(ctx.params.id, ctx.params);
        return { data: user };
    }

    async getUserById(ctx: Context) {
        // console.log(ctx.meta)
        const user = await this.userService.getUserById(ctx.params.id);
        return { data: user };
    }

    async getUserByMobile(ctx: Context) {
        const user = await this.userService.getUserByMobile(ctx.params.mobile);
        return { data: user };
    }

    async getUser(ctx: Context) {
        const user = await this.userService.getUser(ctx.params.first, ctx.params.after);
        return { data: user };
    }

    async changeBalance(ctx: Context) {
        const user = await this.userService.changeBalance(ctx.params.id, ctx.params.changeValue, ctx.params.type, ctx.params.extraInfo);
        return { data: user };
    }

    async searchUser(ctx: Context) {
        return await this.userService.searchUser(ctx.params.keyword, (ctx.params.page - 1) * ctx.params.limit, ctx.params.limit);
    }

    async countUser(ctx: Context) {
        const total = await this.userService.countUser(ctx.params.keyword);
        return { data: total };
    }

    async searchUserAccount(ctx: Context) {
        const data = await this.userService.searchUserAccount(ctx.params.userId, ctx.params.page, ctx.params.limit, ctx.params.type);
        return { data: data };
    }

    async countUserAccount(ctx: Context) {
        const data = await this.userService.countUserAccount(ctx.params.userId, ctx.params.type);
        return { data: data };
    }
}
