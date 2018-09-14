import { Entity, Column, ObjectIdColumn, ObjectID } from 'typeorm';

@Entity()
export class User {
    @ObjectIdColumn() id: ObjectID;

    @Column() mobile: string;

    @Column() username: string;

    @Column() password: string;

    @Column() nickname: string;

    @Column() status: number;

    @Column() createTime: number;

    @Column() updateTime: number;
}
