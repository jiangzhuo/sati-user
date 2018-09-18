export interface UserData {
    userId: string;
    nickname: string;
    avatar: string;
    mobile: string;
    status: number;
    updateTime: number;
}

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
}
