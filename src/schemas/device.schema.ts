import * as mongoose from 'mongoose';

const ObjectId = mongoose.Schema.Types.ObjectId;
export const deviceSchema = new mongoose.Schema({
    userId: ObjectId,
    udid: String,
    clientIp: String,
    operationName: String,
    createTime: Number,
}, { autoIndex: true, toJSON: { virtuals: true } });
