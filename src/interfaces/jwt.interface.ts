export interface JwtPayload {
    userId: string;
    options?: any;
}

export interface JwtReply {
    accessToken: string;
    expiresIn: number;
}
