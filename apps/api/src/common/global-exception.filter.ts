import { Catch, HttpException, HttpStatus, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";

type MinimalResponse = {
  status(code: number): MinimalResponse;
  send(body: unknown): unknown;
};

/**
 * Returns clean, consistent JSON for every error, whether it came from a
 * thrown HttpException (400, 404, ...) or an unexpected exception.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<MinimalResponse>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response.status(status).send(
        typeof body === "string"
          ? { statusCode: status, message: body }
          : { statusCode: status, ...(body as Record<string, unknown>) },
      );
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "internal server error",
    });
  }
}
