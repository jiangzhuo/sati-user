import { Logger } from "@nestjs/common";

Logger.log = function (message: any, context = '', isTimeDiffEnabled = true) {
    printMessage.call(this, message, 'info', context, isTimeDiffEnabled);
};

Logger.error = function (
    message: any,
    trace = '',
    context = '',
    isTimeDiffEnabled = true,
) {
    printMessage.call(this, message, 'error', context, isTimeDiffEnabled);
    this.printStackTrace(trace);
};

Logger.warn = function (message: any, context = '', isTimeDiffEnabled = true) {
    printMessage.call(this, message, 'warn', context, isTimeDiffEnabled);
};

function printMessage(
    message: any,
    level: string,
    context: string = '',
    isTimeDiffEnabled?: boolean,
) {
    const output =
        message && isObject(message) ? JSON.stringify(message, null, 2) : message;
    const timestamp = chalk.grey(`[${ new Date().toISOString() }]`);
    const nodeId = chalk.grey(`${ os.hostname().toLowerCase() }-${ process.pid }/NEST.${ context.toUpperCase() }:`);
    const getType = type => getColor(type)(_.padEnd(type.toUpperCase(), 5));
    process.stdout.write(`${ timestamp } ${ getType(level) } ${ nodeId } ${ output } `);
    this.printTimestamp(isTimeDiffEnabled);
    process.stdout.write(`\n`);
}

import { Injectable, LoggerService, Optional } from '@nestjs/common';
import { NestEnvironment } from "@nestjs/common/enums/nest-environment.enum";
import { isObject } from "@nestjs/common/utils/shared.utils";
import * as os from "os";
const chalk = require("chalk");
const _ = require("lodash");
const getColor = type => {
    switch (type) {
        case "fatal":
            return chalk.red.inverse;
        case "error":
            return chalk.red;
        case "warn":
            return chalk.yellow;
        case "debug":
            return chalk.magenta;
        case "trace":
            return chalk.gray;
        default:
            return chalk.green;
    }
};
declare const process;

@Injectable()
export class MyLogger implements LoggerService {
    private static prevTimestamp?: number;
    private static contextEnvironment = NestEnvironment.RUN;

    constructor(
        @Optional() private readonly context?: string,
        @Optional() private readonly isTimeDiffEnabled = false,
    ) {
    }

    log(message: any, context?: string) {
        MyLogger.log(message, context || this.context, this.isTimeDiffEnabled);
    }

    error(message: any, trace = '', context?: string) {
        MyLogger.error(message, trace, context || this.context);
    }

    warn(message: any, context?: string) {
        MyLogger.warn(message, context || this.context, this.isTimeDiffEnabled);
    }

    static log(message: any, context = '', isTimeDiffEnabled = true) {
        this.printMessage(message, 'info', context, isTimeDiffEnabled);
    }

    static error(
        message: any,
        trace = '',
        context = '',
        isTimeDiffEnabled = true,
    ) {
        this.printMessage(message, 'error', context, isTimeDiffEnabled);
        this.printStackTrace(trace);
    }

    static warn(message: any, context = '', isTimeDiffEnabled = true) {
        this.printMessage(message, 'warn', context, isTimeDiffEnabled);
    }

    private static printMessage(
        message: any,
        level: string,
        context: string = '',
        isTimeDiffEnabled?: boolean,
    ) {
        // console.log(isTimeDiffEnabled)
        const output =
            message && isObject(message) ? JSON.stringify(message, null, 2) : message;
        const timestamp = chalk.grey(`[${ new Date().toISOString() }]`);
        const nodeId = chalk.grey(`${ os.hostname().toLowerCase() }-${ process.pid }/NEST.${ context.toUpperCase() }:`);
        const getType = type => getColor(type)(_.padEnd(type.toUpperCase(), 5));
        process.stdout.write(`${ timestamp } ${ getType(level) } ${ nodeId } ${ output } `);
        this.printTimestamp(isTimeDiffEnabled);
        process.stdout.write(`\n`);
    }


    private static printTimestamp(isTimeDiffEnabled?: boolean) {
        const includeTimestamp = MyLogger.prevTimestamp && isTimeDiffEnabled;
        if (includeTimestamp) {
            process.stdout.write(
                chalk.yellow(` +${Date.now() - MyLogger.prevTimestamp}ms`),
            );
        }
        MyLogger.prevTimestamp = Date.now();
    }

    private static printStackTrace(trace: string) {
        if (this.contextEnvironment === NestEnvironment.TEST || !trace) {
            return;
        }
        process.stdout.write(trace);
        process.stdout.write(`\n`);
    }
}

let nestCommon = require('@nestjs/common');
nestCommon.Logger = MyLogger;
