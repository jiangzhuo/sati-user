import * as shimmer from 'shimmer';
// Hack Nestjs Logger
import { Logger as NestLogger } from '@nestjs/common';
import { isObject } from '@nestjs/common/utils/shared.utils';
import * as os from 'os';
import { padEnd } from 'lodash';

const printMessage = (output, level, context) => {
    const timestamp = Date.now();
    const nodeId = `${os.hostname().toLowerCase()}-${process.pid}`;
    const namespace = `${padEnd('NEST', 10)}`;
    const module = `${padEnd(context.toUpperCase(), 15)}`;
    process.stdout.write(`${timestamp}\t${level}\t${nodeId}\t${namespace}\t${module}\t${output}\n`);
};
shimmer.wrap(NestLogger, 'log', (original) => {
    return (message: any, context = 'unknown') => {
        const output = message && isObject(message) ? JSON.stringify(message) : message;
        const level = 'INFO';
        printMessage(output, level, context);
    };
});
shimmer.wrap(NestLogger, 'error', (original) => {
    return (message: any, trace = '', context = 'unknown') => {
        const output = message && isObject(message) ? JSON.stringify(message, (key, value) => {
            if (value instanceof Error) {
                const error = {};
                Object.getOwnPropertyNames(value).forEach(key => {
                    error[key] = value[key];
                });
                return error;
            }
            return value;
        }) : message;
        const level = 'ERROR';
        printMessage(output, level, context);
        if (trace) {
            printMessage(trace, level, context);
        }
    };
});
shimmer.wrap(NestLogger, 'warn', (original) => {
    return (message: any, context = 'unknown') => {
        const output = message && isObject(message) ? JSON.stringify(message) : message;
        const level = 'WARN';
        printMessage(output, level, context);
    };
});

// Hack Moleculer Logger
import * as MoleculerLogger from 'moleculer/src/logger';

shimmer.wrap(MoleculerLogger, 'createDefaultLogger', (original) => {
    return (baseLogger, bindings, logLevel, logFormatter, logObjectPrinter) => {
        logFormatter = (level, args, bindings) => {
            const message = args.join(' ');
            const output = message && isObject(message) ? JSON.stringify(message, (key, value) => {
                if (value instanceof Error) {
                    const error = {};
                    Object.getOwnPropertyNames(value).forEach(key => {
                        error[key] = value[key];
                    });
                    return error;
                }
                return value;
            }) : message;
            const timestamp = Date.now();
            level = level.toUpperCase();
            const nodeId = `${os.hostname().toLowerCase()}-${process.pid}`;
            const namespace = `${padEnd((bindings.ns || 'unknow').toUpperCase(), 10)}`;
            const module = `${padEnd((bindings.mod || 'unknow').toUpperCase(), 15)}`;
            return `${timestamp}\t${level}\t${nodeId}\t${namespace}\t${module}\t${output}`;
        };
        return original(baseLogger, bindings, logLevel, logFormatter, logObjectPrinter);
    };
});
