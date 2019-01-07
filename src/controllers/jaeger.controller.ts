import { Service, ServiceBroker } from 'moleculer';
import { Injectable } from '@nestjs/common';
import { InjectBroker } from 'nestjs-moleculer';
import * as jaeger from 'moleculer-jaeger';

@Injectable()
export class JaegerController extends Service {
    constructor(@InjectBroker() broker: ServiceBroker
    ) {
        super(broker);

        this.parseServiceSchema({
            name: "jaeger",
            mixins: [jaeger],
            settings: {
                host: 'localhost',
                port: 6832
            },
            created: this.serviceCreated,
            started: this.serviceStarted,
            stopped: this.serviceStopped,
        });
    }

    serviceCreated() {
        this.logger.info("jaeger service created.");
    }

    serviceStarted() {
        this.logger.info("jaeger service started.");
    }

    serviceStopped() {
        this.logger.info("jaeger service stopped.");
    }
}
