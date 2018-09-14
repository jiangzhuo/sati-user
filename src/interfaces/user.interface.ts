export interface UserInfoData {
    userId: string;
    nickname: string;
    mobile: string;
    status: number;
    updateTime: number;
}

export interface CreateUserInput {
    mobile: string;
    username: string;
    password: string;
    nickname: string;
    verificationCode: number;
    status?: number;
}

export interface UpdateUserInput {
    nickname?: string;
    password?: string;
}
