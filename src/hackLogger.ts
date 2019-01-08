import * as shimmer from 'shimmer';
// Hack Nestjs Logger
import { Logger as NestLogger } from '@nestjs/common';
import { isObject } from "@nestjs/common/utils/shared.utils";
import * as os from "os";
import { padEnd } from "lodash";

const printMessage = (output, level, context) => {
    let timestamp = Date.now();
    let nodeId = `${os.hostname().toLowerCase()}-${process.pid}`;
    let namespace = `${padEnd('NEST', 10)}`;
    let module = `${padEnd(context.toUpperCase(), 15)}`;
    process.stdout.write(`${timestamp}\t${level}\t${nodeId}\t${namespace}\t${module}\t${output}\n`);
};
shimmer.wrap(NestLogger, 'log', (original) => {
    return (message: any, context = 'unknown') => {
        let output = message && isObject(message) ? JSON.stringify(message) : message;
        let level = 'INFO';
        printMessage(output, level, context);
    }
});
shimmer.wrap(NestLogger, 'error', (original) => {
    return (message: any, trace = '', context = 'unknown') => {
        let output = message && isObject(message) ? JSON.stringify(message, (key, value) => {
            if (value instanceof Error) {
                let error = {};
                Object.getOwnPropertyNames(value).forEach(function (key) {
                    error[key] = value[key];
                });
                return error;
            }
            return value;
        }) : message;
        let level = 'ERROR';
        printMessage(output, level, context);
        if (trace) {
            printMessage(trace, level, context);
        }
    }
});
shimmer.wrap(NestLogger, 'warn', (original) => {
    return (message: any, context = 'unknown') => {
        let output = message && isObject(message) ? JSON.stringify(message) : message;
        let level = 'WARN';
        printMessage(output, level, context);
    }
});

// Hack Moleculer Logger
import * as MoleculerLogger from 'moleculer/src/logger';

shimmer.wrap(MoleculerLogger, 'createDefaultLogger', (original) => {
    return (baseLogger, bindings, logLevel, logFormatter, logObjectPrinter) => {
        logFormatter = (level, args, bindings) => {
            let message = args.join(" ");
            let output = message && isObject(message) ? JSON.stringify(message, (key, value) => {
                if (value instanceof Error) {
                    let error = {};
                    Object.getOwnPropertyNames(value).forEach(function (key) {
                        error[key] = value[key];
                    });
                    return error;
                }
                return value;
            }) : message;
            let timestamp = Date.now();
            level = level.toUpperCase();
            let nodeId = `${os.hostname().toLowerCase()}-${process.pid}`;
            let namespace = `${padEnd((bindings.ns || 'unknow').toUpperCase(), 10)}`;
            let module = `${padEnd((bindings.mod || 'unknow').toUpperCase(), 15)}`;
            return `${timestamp}\t${level}\t${nodeId}\t${namespace}\t${module}\t${output}`;
        };
        return original(baseLogger, bindings, logLevel, logFormatter, logObjectPrinter)
    }
})
