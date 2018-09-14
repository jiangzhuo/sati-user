import { Entity, Column, ObjectIdColumn, ObjectID } from 'typeorm';
import { Index } from 'typeorm/decorator/Index'

@Entity()
export class User {
    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    @Index({ unique: true })
    mobile: string;

    @Column()
    username: string;

    @Column()
    password: string;

    @Column()
    nickname: string;

    @Column()
    status: number;

    @Column()
    createTime: number;

    @Column()
    updateTime: number;
}
