import { DynamicModule, Inject, Module, OnModuleInit } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { configure as i18nConfigure } from 'i18n';

import { AuthService } from './auth/auth.service';

import { UserGrpcController } from './controllers/user.grpc.controller';
import { UserSchema } from './schemas/user.schema';
import { UserService } from './services/user.service';

import { AccountSchema} from './schemas/account.schema';

import { CryptoUtil } from './utils/crypto.util';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

@Module({
    imports: [
        ElasticsearchModule.register({
            host: 'http://es-cn-mp90uekur0001c8sa.public.elasticsearch.aliyuncs.com:9200',
            httpAuth: 'elastic:Its%queOress2',
            log: 'trace',
        }),
        MongooseModule.forRoot('mongodb://sati:kjhguiyIUYkjh32kh@dds-2zee21d7f4fff2f41890-pub.mongodb.rds.aliyuncs.com:3717,dds-2zee21d7f4fff2f42351-pub.mongodb.rds.aliyuncs.com:3717/sati_user?replicaSet=mgset-9200157',
        // MongooseModule.forRoot('mongodb://localhost:27017/module_user',
            { connectionName: 'user', useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true }),
        MongooseModule.forFeature([{ name: 'User', schema: UserSchema, collection: 'user' }], 'user'),
        MongooseModule.forFeature([{ name: 'Account', schema: AccountSchema, collection: 'account' }], 'user')
    ],
    controllers: [
        UserGrpcController
    ],
    providers: [
        AuthService,
        UserService,
        CryptoUtil
    ],
    exports: []
})
export class UserModule implements OnModuleInit {
    constructor(
        @Inject(UserService) private readonly userService: UserService
    ) { }

    static forRoot(options: { i18n: 'en-US' | 'zh-CN' }): DynamicModule {
        i18nConfigure({
            locales: ['en-US', 'zh-CN'],
            defaultLocale: options.i18n,
            directory: 'src/i18n'
        });
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
