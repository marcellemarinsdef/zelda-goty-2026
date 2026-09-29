export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly code: string;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidRequestError extends AppError {
  public readonly statusCode = 400;
  public readonly code = 'INVALID_REQUEST';

  constructor(message: string = 'The request payload is invalid.') {
    super(message);
  }
}

export class NotFoundError extends AppError {
  public readonly statusCode = 404;
  public readonly code = 'NOT_FOUND';

  constructor(message: string = 'The requested resource was not found.') {
    super(message);
  }
}

export class VectorStoreNotInitializedError extends AppError {
  public readonly statusCode = 503;
  public readonly code = 'VECTOR_STORE_NOT_INITIALIZED';

  constructor(
    message: string = 'Vector store has not been initialized. Please run "npm run ingest" first.'
  ) {
    super(message);
  }
}

export class InternalServerError extends AppError {
  public readonly statusCode = 500;
  public readonly code = 'INTERNAL_SERVER_ERROR';

  constructor(message: string = 'An unexpected internal error occurred.') {
    super(message);
  }
}
