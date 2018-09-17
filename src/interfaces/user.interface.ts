export interface UserData {
    userId: string;
    nickname: string;
    mobile: string;
    status: number;
    updateTime: number;
}

export interface CreateUserInput {
    mobile: string;
    password: string;
    nickname: string;
    status?: number;
}

export interface UpdateUserInput {
    nickname?: string;
    password?: string;
}
