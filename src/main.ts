import { hostname } from "os";
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: 'https://f788de537d2648cb96b4b9f5081165c1@sentry.io/1318216', serverName: hostname() });
import './hackNestLogger';
// import {Transport} from '@nestjs/common/enums/transport.enum';
import {NestFactory} from '@nestjs/core';
// import {join} from 'path';

import {UserModule} from './user.module';

async function bootstrap() {
    // const app = await NestFactory.createMicroservice(UserModule.forRoot({i18n: 'zh-CN'}), {
    //     transport: Transport.GRPC,
    //     options: {
    //         url: '0.0.0.0' + ':50051',
    //         package: 'sati_module_user',
    //         protoPath: join(__dirname, 'protobufs/user-module.proto'),
    //         loader: {
    //             arrays: true,
    //             keepCase: true,
    //             longs: String,
    //             enums: String,
    //             defaults: true,
    //             oneofs: true
    //         }
    //     }
    // });

    // await app.listenAsync();

    const app = await NestFactory.createApplicationContext(UserModule.forRoot());
}

bootstrap();
