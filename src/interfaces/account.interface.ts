import { Document } from "mongoose";

export interface Account extends Document {
    readonly userId: string;
    readonly value: number;
    readonly afterBalance: number;
    readonly type: string;
    readonly extraInfo: string;
}
