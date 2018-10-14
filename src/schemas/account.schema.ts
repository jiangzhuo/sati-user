import * as mongoose from 'mongoose';

const ObjectId = mongoose.Schema.Types.ObjectId;
export const AccountSchema = new mongoose.Schema({
    userId: ObjectId,
    value: Number,
    afterBalance: Number,
    type: String,
    createTime: Number,
    extraInfo: { type: String, default: '' },
});
