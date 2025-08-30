import type { Api } from "../api.js";
import type { AnyRoute } from "../route.js";
import type { ApiServer } from "../server.js";
import type { RequestPartSchema } from "../utils/schemas.js";

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, Record<string, PathItemObject>>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

interface PathItemObject {
  operationId: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses: Record<string, ResponseObject>;
  security?: Array<Record<string, string[]>>;
}

interface ParameterObject {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  required?: boolean;
  schema: any;
  description?: string;
}

interface RequestBodyObject {
  description?: string;
  content: Record<
    string,
    {
      schema: any;
    }
  >;
  required?: boolean;
}

interface ResponseObject {
  description: string;
  content?: Record<
    string,
    {
      schema: any;
    }
  >;
}

// Utility to extract path parameters from route string
const extractPathParameters = (routePath: string): string[] => {
  const matches = routePath.match(/:([^/]+)/g);
  return matches ? matches.map((match) => match.slice(1)) : [];
};

// Convert HTTP method to lowercase for OpenAPI
const normalizeMethod = (method: string): string => method.toLowerCase();

// Generate parameters for query and path
const generateParameters = (
  querySchema: Record<string, any>,
  pathSchema: Record<string, any>,
  routePath: string
): ParameterObject[] => {
  const parameters: ParameterObject[] = [];

  // Extract path parameters
  const pathParams = extractPathParameters(routePath);

  // Add path parameters
  if (pathSchema.properties) {
    Object.keys(pathSchema.properties).forEach((key) => {
      if (pathParams.includes(key)) {
        parameters.push({
          name: key,
          in: "path",
          required: true,
          schema: pathSchema.properties[key],
          description:
            pathSchema.properties[key].description || `Path parameter: ${key}`,
        });
      }
    });
  }

  // Add query parameters
  if (querySchema.properties) {
    const requiredQuery = querySchema.required || [];
    Object.keys(querySchema.properties).forEach((key) => {
      parameters.push({
        name: key,
        in: "query",
        required: requiredQuery.includes(key),
        schema: querySchema.properties[key],
        description:
          querySchema.properties[key].description || `Query parameter: ${key}`,
      });
    });
  }

  return parameters;
};

// Generate request body object
const generateRequestBody = (
  bodySchema: Record<string, any>,
  method: string
): RequestBodyObject | undefined => {
  // Only include request body for methods that typically have bodies
  if (!["post", "put", "patch"].includes(method.toLowerCase())) {
    return undefined;
  }

  // Skip if body schema is empty or has no properties
  if (
    !bodySchema.properties ||
    Object.keys(bodySchema.properties).length === 0
  ) {
    return undefined;
  }

  return {
    description: "Request body",
    content: {
      "application/json": {
        schema: bodySchema,
      },
    },
    required: bodySchema.required && bodySchema.required.length > 0,
  };
};

// Generate responses object
const generateResponses = (
  route: AnyRoute,
  responseSchema?: Record<string, any>
): Record<string, ResponseObject> => {
  const responses: Record<string, ResponseObject> = {};

  // Success response
  responses[route.successStatus.toString()] = {
    description: `Successful ${route.method} operation`,
    ...(responseSchema && {
      content: {
        "application/json": {
          schema: responseSchema,
        },
      },
    }),
  };

  // Common error responses
  responses["400"] = {
    description: "Bad Request - Invalid input parameters",
  };

  responses["401"] = {
    description: "Unauthorized - Authentication required",
  };

  responses["403"] = {
    description: "Forbidden - Insufficient permissions",
  };

  // Add 404 if the route has notFoundValues configured
  if (route.notFoundValues && route.notFoundValues.length > 0) {
    responses["404"] = {
      description: "Not Found - Resource does not exist",
    };
  }

  responses["500"] = {
    description: "Internal Server Error",
  };

  return responses;
};

// Convert Express-style route to OpenAPI path
const convertRouteToOpenAPIPath = (route: string): string => {
  return route.replace(/:([^/]+)/g, "{$1}");
};

// OpenAPI v3 route doc generation
const generateRouteDocs = (
  route: AnyRoute,
  jsonSchemaParser: (schema: RequestPartSchema) => Record<string, any>
): Record<string, any> => {
  const bodySchema = jsonSchemaParser(route.schema.body);
  const querySchema = jsonSchemaParser(route.schema.query);
  const pathSchema = jsonSchemaParser(route.schema.path);

  const method = normalizeMethod(route.method);
  const openApiPath = convertRouteToOpenAPIPath(route.route);

  const pathItem: PathItemObject = {
    operationId: route.operationId,
    summary: `${route.method} ${route.route}`,
    description: `Operation: ${route.operationId}`,
    parameters: generateParameters(querySchema, pathSchema, route.route),
    responses: generateResponses(route),
  };

  // Add request body if applicable
  const requestBody = generateRequestBody(bodySchema, method);
  if (requestBody) {
    pathItem.requestBody = requestBody;
  }

  return {
    [openApiPath]: {
      [method]: pathItem,
    },
  };
};

// Returns API docs in OpenAPI format
const generateApiDocs = (
  api: Api,
  jsonSchemaParser: (schema: RequestPartSchema) => Record<string, any>
): OpenAPISpec => {
  const spec: OpenAPISpec = {
    openapi: "3.0.3",
    info: {
      title: api.name || "API",
      version: api.version || "1.0.0",
      description:
        api.description || `Generated API documentation for ${api.name}`,
    },
    paths: {},
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  };

  // Add server information if available
  spec.servers = api.allowedHosts.map((host) => ({
    url: host,
    description: `API Server at ${host}`,
  }));

  // Generate documentation for each route
  for (const route of api.routes) {
    const routeDocs = generateRouteDocs(route, jsonSchemaParser);

    // Merge route docs into paths
    Object.keys(routeDocs).forEach((path) => {
      if (!spec.paths[path]) {
        spec.paths[path] = {};
      }
      Object.assign(spec.paths[path], routeDocs[path]);
    });
  }

  return spec;
};

// Returns a map of API name to API docs in OpenAPI format
const generateApiServerDocs = (
  apiServer: ApiServer,
  jsonSchemaParser: (schema: RequestPartSchema) => Record<string, any>
): Map<string, OpenAPISpec> => {
  const docs = new Map<string, OpenAPISpec>();

  for (const api of apiServer.apis) {
    docs.set(api.name, generateApiDocs(api, jsonSchemaParser));
  }

  return docs;
};

export {
  generateApiServerDocs,
  generateApiDocs,
  generateRouteDocs,
  type OpenAPISpec,
  type PathItemObject,
  type ParameterObject,
  type RequestBodyObject,
  type ResponseObject,
};
