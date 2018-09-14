import { forwardRef, HttpException, Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { __ as t } from 'i18n';
import { EntityManager, Repository } from 'typeorm';

import { AuthService } from '../auth/auth.service';
import { User } from '../entities/user.entity';
import { CreateUserInput, UpdateUserInput, UserData } from '../interfaces/user.interface';
import { CryptoUtil } from '../utils/crypto.util';

@Injectable()
export class UserService {
    constructor(
        @InjectEntityManager() private readonly entityManager: EntityManager,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @Inject(CryptoUtil) private readonly cryptoUtil: CryptoUtil,
        @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService
    ) { }

    /**
     * Cteate a user
     *
     * @param createUserInput The user object
     */
    async createUser(createUserInput: CreateUserInput): Promise<void> {
        // await this.checkUsernameExist(createUserInput.username);
        createUserInput.password = await this.cryptoUtil.encryptPassword(createUserInput.password);
        const user = await this.userRepo.save(this.userRepo.create(createUserInput));
    }

    /**
     * Update user's information
     *
     * @param id The specified user id
     * @param updateUserInput The information to be update
     */
    async updateUserInfo(id: string, updateUserInput: UpdateUserInput): Promise<void> {
        const user = await this.userRepo.findOne(id);
        if (updateUserInput.nickname) {
            await this.userRepo.update(user.id, { nickname: updateUserInput.nickname });
        }
        if (updateUserInput.password) {
            const newPassword = await this.cryptoUtil.encryptPassword(updateUserInput.password);
            await this.userRepo.update(user.id, { password: newPassword });
        }
    }

    /**
     * user login
     *
     * @param mobile  手机号
     * @param verificationCode  验证码
     */
    async loginByMobile(mobile: string, verificationCode: string) {
        const user = await this.userRepo.findOne({ mobile });
        if (verificationCode !== '666') {
            // todo 验证OTP逻辑，这里先写死666进行测试
            throw new RpcException({ code: 406, message: t('invalid password') });
        }
        // if (!await this.cryptoUtil.checkPassword(password, user.password)) {
        //     throw new HttpException(t('invalid password'), 406);
        // }
        return this.refactorUserData(user)
    }

    /**
     * Ordinary user registration
     *
     * @param createUserInput
     */
    async registerByMobile(createUserInput: CreateUserInput): Promise<void> {
        createUserInput.status = 0;
        await this.createUser(createUserInput);
    }

    /**
     * Query users by ID
     *
     * @param id The specified user id
     */
    private async findOneById(id: string): Promise<User> {
        const exist = this.userRepo.findOne(id);
        if (!exist) {
            throw new RpcException({ code: 404, message: t('User does not exist') });
        }
        return exist;
    }

    // /**
    //  * Check if the username exists
    //  *
    //  * @param username username
    //  */
    // private async checkUsernameExist(username: string): Promise<void> {
    //     if (await this.userRepo.findOne({ where: { username } })) {
    //         throw new RpcException({ code: 409, message: t('Username already exists') });
    //     }
    // }


    /**
     *
     * @param id
     */
    async findUserInfoById(id: string | string[]): Promise<UserData | UserData[]> {
        if (id instanceof Array) {
            const userInfoData: UserData[] = [];
            const users = await this.userRepo.find({ where: { id: { $in: id } } });
            for (const user of users) {
                (userInfoData as UserData[]).push(this.refactorUserData(user));
            }
            return userInfoData;
        } else {
            const user = await this.userRepo.findOne(id);
            return this.refactorUserData(user);
        }
    }

    /**
     * Refactor the user information data
     *
     * @param user The user object
     */
    private refactorUserData(user: User) {
        const userInfoData: UserData = {
            userId: user.id.toString(),
            mobile: user.mobile,
            nickname: user.nickname,
            status: user.status,
            updateTime: user.updateTime
        };
        return userInfoData
    }
}
