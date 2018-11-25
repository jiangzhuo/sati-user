import { Document } from "mongoose";

export interface User extends Document {
    readonly userId: string;
    readonly udid: string;
    readonly clientIp: string;
    readonly operationName: string;
    readonly createTime: number;
}
