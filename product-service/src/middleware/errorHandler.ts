export enum ErrorType {
  VALIDATION = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  AUTHENTICATION = "AUTHENTICATION_ERROR",
  AUTHORIZATION = "AUTHORIZATION_ERROR",
  BUSINESS_LOGIC = "BUSINESS_LOGIC_ERROR",
  EXTERNAL_SERVICE = "EXTERNAL_SERVICE_ERROR",
  DATABASE = "DATABASE_ERROR",
  INTERNAL = "INTERNAL_ERROR",
}

// Base service error class
export class ServiceError extends Error {
  readonly statusCode: number;
  readonly errorType: ErrorType;
  readonly originalError?: any;

  constructor(
    message: string,
    statusCode: number,
    errorType: ErrorType,
    originalError?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.originalError = originalError;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  // Convert to Apollo error format
  //   toApolloError(): ApolloError {
  //     return new ApolloError(this.message, this.errorType, {
  //       statusCode: this.statusCode,
  //       ...(process.env.NODE_ENV !== "production" && this.originalError
  //         ? { originalError: this.originalError }
  //         : {}),
  //     });
  //   }
}

export class ValidationError extends ServiceError {
  constructor(message: string, originalError?: any) {
    super(message, 400, ErrorType.VALIDATION, originalError);
  }
}

export class NotFoundError extends ServiceError {
  constructor(message: string, originalError?: any) {
    super(message, 404, ErrorType.NOT_FOUND, originalError);
  }
}

export class AuthenticationError extends ServiceError {
  constructor(message: string, originalError?: any) {
    super(message, 401, ErrorType.AUTHENTICATION, originalError);
  }
}

export class AuthorizationError extends ServiceError {
  constructor(message: string, originalError?: any) {
    super(message, 403, ErrorType.AUTHORIZATION, originalError);
  }
}

export class BusinessLogicError extends ServiceError {
  constructor(message: string, originalError?: any) {
    super(message, 422, ErrorType.BUSINESS_LOGIC, originalError);
  }
}

export class ExternalServiceError extends ServiceError {
  constructor(message: string, originalError?: any) {
    super(message, 502, ErrorType.EXTERNAL_SERVICE, originalError);
  }
}

export class UserInputError extends ServiceError {
  constructor(message: string, originalError?: any) {
    super(message, 400, ErrorType.VALIDATION, originalError);
  }
}

export class DatabaseError extends ServiceError {
  constructor(message: string, originalError?: any) {
    super(message, 500, ErrorType.DATABASE, originalError);
  }
}

export class InternalError extends ServiceError {
  constructor(message: string, originalError?: any) {
    super(message, 500, ErrorType.INTERNAL, originalError);
  }
}

// Utility function to parse service response errors
export function parseServiceError(error: any): ServiceError {
  // Default to internal error
  let serviceError: ServiceError = new InternalError(
    "Something went wrong",
    error
  );

  // Check if it's a response from an HTTP request
  if (error.response) {
    const { status, data } = error.response;
    const errorMessage = data?.error || "Service error";

    // Handle based on status code
    switch (status) {
      case 400:
        // Check for MongoDB duplicate key error
        if (errorMessage.includes("E11000 duplicate key error")) {
          const fieldMatch = errorMessage.match(/index:\s+(\w+)_1/);
          const field = fieldMatch ? fieldMatch[1] : "record";
          return new ValidationError(`${field} already exists`, error);
        }
        return new ValidationError(errorMessage, error);

      case 401:
        return new AuthenticationError("Authentication required", error);

      case 403:
        return new AuthorizationError("Not authorized", error);

      case 404:
        return new NotFoundError(errorMessage, error);

      case 422:
        return new BusinessLogicError(errorMessage, error);

      case 500:
        return new InternalError("Internal service error", error);

      default:
        if (status >= 500) {
          return new ExternalServiceError(
            `Service unavailable (${status})`,
            error
          );
        }
        return new BusinessLogicError(errorMessage, error);
    }
  }

  // Database errors
  if (error.name === "MongoError" || error.name === "MongoServerError") {
    if (error.code === 11000) {
      const fieldMatch = error.message.match(/index:\s+(\w+)_1/);
      const field = fieldMatch ? fieldMatch[1] : "record";
      return new ValidationError(`${field} already exists`, error);
    }
    return new DatabaseError("Database error", error);
  }

  return serviceError;
}
