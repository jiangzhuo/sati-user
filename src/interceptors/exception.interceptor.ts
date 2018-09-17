import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    HttpStatus,
} from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { RpcException } from "@nestjs/microservices";
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { __ as t } from "i18n";

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
    intercept(
        context: ExecutionContext,
        call$: Observable<any>,
    ): Observable<any> {
        return call$.pipe(
            catchError(err => {
                    if (err instanceof RpcException) {
                        return throwError(err)
                    } else {

                        return throwError(new RpcException({ code: 500, message: err.message, data: {} }))
                    }
                }
            ),
        );
    }
}
