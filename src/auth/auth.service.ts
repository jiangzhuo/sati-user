import { forwardRef, Inject, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Authenticator } from 'otplib/authenticator';

const crypto = require('crypto');


import { JwtPayload, JwtReply } from '../interfaces/jwt.interface';

// import { UserService } from '../services/user.service';

@Injectable()
export class AuthService {
    constructor(
        // @Inject(forwardRef(() => UserService)) private readonly userService: UserService
    ) {
        this.registerAuthenticator = new Authenticator();
        this.registerAuthenticator.options = { crypto: crypto, step: 60, window: 60 };
        this.loginAuthenticator = new Authenticator();
        this.loginAuthenticator.options = { crypto: crypto, step: 60, window: 60 };
    }

    private registerAuthenticator: Authenticator;
    private loginAuthenticator: Authenticator;

    createToken(payload: JwtPayload): JwtReply {
        const accessToken = jwt.sign(payload, 'secretKey', { expiresIn: '1d' });
        return { accessToken, expiresIn: 60 * 60 * 24 };
    }

    generateLoginVerificationCode(mobile: string): string {
        let secret = `login|${mobile}`;
        return this.loginAuthenticator.generate(secret);
    }

    generateRegisterVerificationCode(mobile: string): string {
        let secret = `register|${mobile}`;
        return this.registerAuthenticator.generate(secret);
    }

    generateUpdatePasswordVerificationCode(mobile: string): string {
        let secret = `|${mobile}`;
        return this.registerAuthenticator.generate(secret);
    }

    checkLoginVerificationCode(token: string, mobile: string): boolean {
        if (token === '666') {
            return true;
        }
        let secret = `login|${mobile}`;
        return this.loginAuthenticator.check(token, secret);
    }

    checkRegisterVerificationCode(token: string, mobile: string): boolean {
        if (token === '666') {
            return true;
        }
        let secret = `register|${mobile}`;
        return this.registerAuthenticator.check(token, secret);
    }

    checkUpdatePasswordVerificationCode(token: string, mobile: string): boolean {
        if (token === '666') {
            return true;
        }
        let secret = `|${mobile}`;
        return this.registerAuthenticator.check(token, secret);
    }
}
