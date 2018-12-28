import { Inject, Injectable } from '@nestjs/common';
import * as SMSClient from '@alicloud/sms-sdk';

import { UserService } from '../services/user.service';
import { AuthService } from "../auth/auth.service";
import { InjectBroker } from 'nestjs-moleculer';
import { ServiceBroker, Service, Context, Errors } from 'moleculer';
import MoleculerError = Errors.MoleculerError;
import { CouponService } from '../services/coupon.service';
import moment = require("moment");

@Injectable()
export class CouponController extends Service {
    constructor(
        @InjectBroker() broker: ServiceBroker,
        @Inject(CouponService) private readonly couponService: CouponService,
        @Inject(AuthService) private readonly authService: AuthService
    ) {
        super(broker);

        this.parseServiceSchema({
            name: "coupon",
            //version: "v2",
            meta: {
                scalable: true
            },
            settings: {
                upperCase: true
            },
            actions: {
                useCoupon: this.useCoupon,
                generateCoupon: this.generateCoupon,
                getCoupon: this.getCoupon,
                disableCoupon: this.disableCoupon,
                enableCoupon: this.enableCoupon
            },
            created: this.serviceCreated,
            started: this.serviceStarted,
            stopped: this.serviceStopped,
        });
    }

    serviceCreated() {
        this.logger.info("coupon service created.");
    }

    serviceStarted() {
        this.logger.info("coupon service started.");
    }

    serviceStopped() {
        this.logger.info("coupon service stopped.");
    }

    async generateCoupon(ctx: Context) {
        const coupons = await this.couponService.generate(ctx.params.count, ctx.params.value, ctx.params.status, ctx.params.userId, ctx.params.validTime, ctx.params.expireTime);
        return { data: coupons };
    }

    async useCoupon(ctx: Context) {
        let coupon = await this.couponService.getCouponByCode(ctx.params.couponCode);
        if (!coupon) {
            throw new MoleculerError('coupon not found', 404);
        }
        if ((coupon.status & 0b000000000000000000000000000000001) === 0b000000000000000000000000000000001) {
            throw new MoleculerError('already used coupon', 404);
        }
        if ((coupon.status & 0b000000000000000000000000000000010) === 0b000000000000000000000000000000010) {
            throw new MoleculerError('disabled coupon', 404);
        }
        if (coupon.userId.toString() !== '000000000000000000000000' && coupon.userId.toString() !== ctx.meta.userId) {
            throw new MoleculerError('not your coupon', 404);
        }
        if (coupon.validTime > moment().unix() || coupon.expireTime < moment().unix()) {
            throw new MoleculerError('not active coupon', 404);
        }
        coupon = await this.couponService.use(coupon, ctx.meta);
        return { data: coupon };
    }

    async getCoupon(ctx: Context) {
        const data = await this.couponService.getCoupon(ctx.params.first, ctx.params.after, ctx.params.before, ctx.params.status)
        return { data };
    }

    async disableCoupon(ctx: Context) {
        let couponId = ctx.params.couponId;
        let coupon = await this.couponService.getCouponById(couponId);
        if(!coupon){
            throw new MoleculerError('coupon not found', 404);
        }
        coupon = await this.couponService.changeStatus(couponId, { or: 0b000000000000000000000000000000010 });
        return { data: coupon };
    }

    async enableCoupon(ctx: Context) {
        let couponId = ctx.params.couponId;
        let coupon = await this.couponService.getCouponById(couponId);
        if(!coupon){
            throw new MoleculerError('coupon not found', 404);
        }
        coupon = await this.couponService.changeStatus(couponId, { and: 0b1111111111111111111111111111101 });
        return { data: coupon };
    }
}
