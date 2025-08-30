import type { Api } from "../api.js";
import type { ApiServer } from "../server.js";

// Returns a map of API name to API docs in OpenAPI format
const generateApiServerDocs = (apiServer: ApiServer): Map<string, string> => {
  const docs = new Map<string, string>();

  for (const api of apiServer.apis) {
    docs.set(api.name, generateApiDocs(api));
  }

  return docs;
};

// Returns API docs in OpenAPI format
const generateApiDocs = (api: Api): string => {
  throw new Error("Not implemented");
};

export { generateApiServerDocs, generateApiDocs };
