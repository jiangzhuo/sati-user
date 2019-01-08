import { DynamicModule, Inject, Module, OnModuleInit } from '@nestjs/common';
// import { APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
// import { configure as i18nConfigure } from 'i18n';

import { AuthService } from './auth/auth.service';

// import { UserGrpcController } from './controllers/user.grpc.controller';
import { UserSchema } from './schemas/user.schema';
import { UserService } from './services/user.service';

import { AccountSchema } from './schemas/account.schema';

import { CryptoUtil } from './utils/crypto.util';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

import { MoleculerModule } from 'nestjs-moleculer';
import { UserController } from './controllers/user.controller';
import { CouponController } from './controllers/coupon.controller';
import { CouponSchema } from './schemas/coupon.schema';
import { CouponService } from "./services/coupon.service";
import { JaegerController } from './controllers/jaeger.controller';
import * as jaeger from 'moleculer-jaeger';

@Module({
    imports: [
        MoleculerModule.forRoot({
            namespace: "sati",
            // logger: bindings => new Logger(),
            metrics: true,
            transporter: "TCP",
            hotReload: true,
            cacher: "Memory",
            logLevel: process.env.LOG_LEVEL
        }),
        MoleculerModule.forFeature([{
            name: 'jaeger',
            schema: jaeger,
        }]),
        ElasticsearchModule.register({
            host: process.env.ELASTICSEARCH_HOST,
            httpAuth: process.env.ELASTICSEARCH_HTTP_AUTH,
            log: 'error',
        }),
        MongooseModule.forRoot(process.env.MONGODB_CONNECTION_STR,
            //     MongooseModule.forRoot('mongodb://localhost:27017/sati',
            //     MongooseModule.forRoot('mongodb://root:kjhguiyIUYkjh32kh@dds-2ze5f8fcc72702b41188-pub.mongodb.rds.aliyuncs.com:3717,dds-2ze5f8fcc72702b42191-pub.mongodb.rds.aliyuncs.com:3717/sati?replicaSet=mgset-10924097&authDB=admin',
            { connectionName: 'sati', useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true }),
        MongooseModule.forFeature([{ name: 'User', schema: UserSchema, collection: 'user' }], 'sati'),
        MongooseModule.forFeature([{ name: 'Account', schema: AccountSchema, collection: 'account' }], 'sati'),
        MongooseModule.forFeature([{ name: 'Coupon', schema: CouponSchema, collection: 'coupon' }], 'sati'),
    ],
    controllers: [
        UserController,
        CouponController,
        // JaegerController
    ],
    providers: [
        AuthService,
        UserService,
        CouponService,
        CryptoUtil
    ],
    exports: []
})
export class UserModule implements OnModuleInit {
    constructor(
        @Inject(UserService) private readonly userService: UserService
    ) {
    }

    static forRoot(): DynamicModule {
        return {
            module: UserModule
        };
    }

    async onModuleInit() {
        // await this.createSuperAdmin();
    }

    // /**
    //  * Create a system super administrator
    //  */
    // private async createSuperAdmin() {
    //     const sadmin = await this.userRepo.findOne({ where: { username: 'sadmin' } });
    //     if (sadmin) return;
    //     await this.userService.createUser({ username: 'sadmin', password: 'sadmin' });
    // }
}
