type InferSchema<T> = T extends { _output: infer U }
  ? U // Zod schemas have _output property
  : T extends { __type: infer U }
    ? U // Custom schemas could use __type
    : T extends (...args: any[]) => infer U
      ? U // Function-based schemas
      : T; // Fallback to the type itself

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string | object };

interface RequestPartSchema<T = unknown> {
  safeParse: (data: unknown) => ValidationResult<T>;
  _output?: T;
  __type?: T;
}

type RequestSchema<
  TBody extends RequestPartSchema = RequestPartSchema,
  TQuery extends RequestPartSchema = RequestPartSchema,
  TPath extends RequestPartSchema = RequestPartSchema,
> = {
  body: TBody;
  query: TQuery;
  path: TPath;
};

type RequestValidationError = {
  success: false;
  errors: Map<"body" | "query" | "path", any>;
};

type RequestValidationSuccess = {
  success: true;
  data: {
    body: any;
    query: any;
    path: any;
  };
};

type RequestValidationResult =
  | RequestValidationSuccess
  | RequestValidationError;

function validatePart<T extends RequestPartSchema>(
  schema: T,
  input: unknown
): ValidationResult<InferSchema<T>> {
  return schema.safeParse(input) as ValidationResult<InferSchema<T>>;
}

function validateRequestData(
  schema: RequestSchema,
  data: any
): RequestValidationResult {
  const errors = new Map<"body" | "query" | "path", any>();

  const vBody = validatePart(schema.body, data.body);
  if (!vBody.success) {
    errors.set("body", vBody.error);
    return { success: false, errors };
  }

  const vQuery = validatePart(schema.query, data.query);
  if (!vQuery.success) {
    errors.set("query", vQuery.error);
    return { success: false, errors };
  }

  const vPath = validatePart(schema.path, data.path);
  if (!vPath.success) {
    errors.set("path", vPath.error);
    return { success: false, errors };
  }

  if (errors.size > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      body: vBody.data,
      query: vQuery.data,
      path: vPath.data,
    },
  };
}

export {
  type RequestPartSchema,
  type RequestSchema,
  type InferSchema,
  type RequestValidationError,
  type RequestValidationSuccess,
  type RequestValidationResult,
  validateRequestData,
};
