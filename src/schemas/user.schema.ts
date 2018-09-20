import * as mongoose from 'mongoose';

// const ObjectId = mongoose.Schema.Types.ObjectId;
export const UserSchema = new mongoose.Schema({
    mobile: String,
    username: String,
    password: String,
    nickname: String,
    avatar: String,
    status: Number,
    createTime: Number,
    updateTime: Number,
});
