import { Document } from "mongoose";

export interface Coupon extends Document {
    readonly couponCode: string,
    readonly value: number,
    readonly status: number,
    readonly userId: string,
    readonly createTime: number,
    readonly validTime: number,
    readonly expireTime: number,
    readonly usedTime: number,
    readonly whoUsed: {
        userId: string,
        clientIp: string, // 兑换的人的ip
        udid: string, // 兑换的人的udid
    }
}
