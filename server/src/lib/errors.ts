export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Operação não permitida no estado atual") {
    super(message, 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "É preciso estar autenticado") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Sem permissão para esta ação") {
    super(message, 403);
  }
}
