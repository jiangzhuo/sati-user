

import { Document } from "mongoose";
import { ObjectId } from "mongodb";

// export interface UserData {
//     userId: string;
//     nickname: string;
//     avatar: string;
//     mobile: string;
//     status: number;
//     updateTime: number;
// }
//
export interface CreateUserInput {
    mobile: string;
    password: string;
    nickname: string;
    avatar: string;
    status?: number;
}

export interface UpdateUserInput {
    nickname?: string;
    avatar?: string;
    password?: string;
    status?: number;
}

export interface User extends Document {
    readonly mobile: string;
    readonly username: string;
    readonly password: string;
    readonly nickname: string;
    readonly avatar: string;
    readonly status: number;
    readonly createTime: number;
    readonly updateTime: number;
}
