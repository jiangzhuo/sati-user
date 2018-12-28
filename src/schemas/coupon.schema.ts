import * as mongoose from 'mongoose';
import * as Int32 from "mongoose-int32";

const ObjectId = mongoose.Schema.Types.ObjectId;
export const CouponSchema = new mongoose.Schema({
    // id包括了时间戳、随机数和计数器足够生成
    couponCode: String, // 算出来的兑换码
    value: Number, // 影响多少balance
    status: { type: Int32, default: 0 }, // 状态 第一位0表示没使用1已经使用，第二位0表示正常1表示已经被禁用
    userId: ObjectId, // 某人专属的coupon
    createTime: Number,
    validTime: Number,
    expireTime: Number,
    usedTime: Number, // 使用的时间
    whoUse: {
        userId: ObjectId,
        clientIp: String, // 兑换的人的ip
        udid: String, // 兑换的人的udid
    }
}, { autoIndex: true, toJSON: { virtuals: true } });
