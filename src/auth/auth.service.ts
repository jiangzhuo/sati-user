import { forwardRef, Inject, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Authenticator } from 'otplib/authenticator';

import { JwtPayload, JwtReply } from '../interfaces/jwt.interface';
// import { UserService } from '../services/user.service';

@Injectable()
export class AuthService {
    onModuleInit() {
        this.registerAuthenticator = new Authenticator();
        this.registerAuthenticator.options = { step: 60, window: 60 };
        this.loginAuthenticator = new Authenticator();
        this.loginAuthenticator.options = { step: 60, window: 60 };
    }

    constructor(
        // @Inject(forwardRef(() => UserService)) private readonly userService: UserService
    ) { }

    private registerAuthenticator: Authenticator;
    private loginAuthenticator: Authenticator;

    async createToken(payload: JwtPayload): Promise<JwtReply> {
        const accessToken = jwt.sign(payload, 'secretKey', { expiresIn: '1d' });
        return { accessToken, expiresIn: 60 * 60 * 24 };
    }

    generateLoginVerificationCode(userId: string): string {
        let secret = `login|${userId}`;
        return this.loginAuthenticator.generate(secret);
    }

    generateRegisterVerificationCode(userId: string): string {
        let secret = `register|${userId}`;
        return this.registerAuthenticator.generate(secret);
    }

    checkLoginVerificationCode(userId: string): boolean {
        let secret = `login|${userId}`;
        return this.loginAuthenticator.check(secret);
    }

    checkRegisterVerificationCode(userId: string): boolean {
        let secret = `register|${userId}`;
        return this.registerAuthenticator.check(secret);
    }
}
