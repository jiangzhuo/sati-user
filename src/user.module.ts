import { DynamicModule, Inject, Module, OnModuleInit } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { configure as i18nConfigure } from 'i18n';
import { Repository } from 'typeorm';

import { AuthService } from './auth/auth.service';
import { UserGrpcController } from './controllers/user.grpc.controller';
import { User } from './entities/user.entity';
import { UserService } from './services/user.service';
import { CryptoUtil } from './utils/crypto.util';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'mongodb',
            host: '127.0.0.1',
            port: 27017,
            username: '',
            password: '',
            database: 'module_user',
            entities: [__dirname + '/../src/**/*.entity.ts'],
            logger: 'advanced-console',
            logging: false,
            synchronize: true,
            dropSchema: false
        }),
        TypeOrmModule.forFeature([User])
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
        @Inject(UserService) private readonly userService: UserService,
        @InjectRepository(User) private readonly userRepo: Repository<User>
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
