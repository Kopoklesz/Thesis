import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // A ValidationPipe a részletes hibaüzeneteket a response objektumban
    // adja át (message: string[]); az exception.message ilyenkor csak a
    // semmitmondó "Bad Request Exception" lenne.
    const exceptionResponse = exception.getResponse();
    let message: string = exception.message;
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const detail = (exceptionResponse as { message?: string | string[] }).message;
      if (Array.isArray(detail)) {
        message = detail.join(', ');
      } else if (typeof detail === 'string') {
        message = detail;
      }
    }

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message,
      });
  }
}