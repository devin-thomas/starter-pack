// The one capability behind both the command and the HTTP API: look up the
// library's tools. Both callers use these functions unchanged, so the command's
// --json output and the API response for the same question are the same object.

export const API_VERSION = "1";

// Only these fields ever leave the library. Everything else in the catalog
// (shelf locations, staff notes) stays private.
export const PUBLIC_FIELDS = Object.freeze([
  "id",
  "name",
  "category",
  "loan_days",
  "available",
]);

const TOOL_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Error codes shared by both lanes. The command maps them to exit statuses,
// the API to HTTP statuses.
export const ERRORS = Object.freeze({
  invalid_parameter: { status: 400, exit: 2 },
  not_found: { status: 404, exit: 1 },
  invalid_catalog: { status: 500, exit: 3 },
});

export class CatalogError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "CatalogError";
    this.code = code;
    this.status = ERRORS[code].status;
    this.exit = ERRORS[code].exit;
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value, max) {
  return typeof value === "string" && value.trim() !== "" && value.length <= max;
}

// Validate a catalog. Messages name the position and field only, never a value,
// so a broken file cannot leak a private note through an error.
export function parseCatalog(value) {
  const invalid = (detail) =>
    new CatalogError("invalid_catalog", `The catalog is not valid: ${detail}.`);
  if (!isRecord(value)) throw invalid("expected a JSON object");
  if (!text(value.library, 100)) throw invalid("library needs a name");
  if (typeof value.updated !== "string" || !DATE.test(value.updated))
    throw invalid("updated must be a YYYY-MM-DD date");
  if (!Array.isArray(value.tools)) throw invalid("tools must be a list");
  const seen = new Set();
  const tools = value.tools.map((tool, index) => {
    const at = `tool ${index + 1}`;
    if (!isRecord(tool)) throw invalid(`${at} must be an object`);
    if (typeof tool.id !== "string" || !TOOL_ID.test(tool.id))
      throw invalid(`${at} needs an id of lowercase letters, digits and hyphens`);
    if (seen.has(tool.id)) throw invalid(`${at} repeats an id`);
    seen.add(tool.id);
    if (!text(tool.name, 100)) throw invalid(`${at} needs a name`);
    if (!text(tool.category, 60)) throw invalid(`${at} needs a category`);
    if (!Number.isInteger(tool.loan_days) || tool.loan_days < 1 || tool.loan_days > 365)
      throw invalid(`${at} needs loan_days between 1 and 365`);
    if (typeof tool.available !== "boolean")
      throw invalid(`${at} needs available as true or false`);
    return tool;
  });
  return { library: value.library, updated: value.updated, tools };
}

// The public view of one tool: a fresh object with the public fields only.
export function publicTool(tool) {
  return Object.fromEntries(PUBLIC_FIELDS.map((field) => [field, tool[field]]));
}

function envelope(catalog) {
  return {
    api_version: API_VERSION,
    library: catalog.library,
    catalog_updated: catalog.updated,
  };
}

// Normalize list filters from either caller. `available` accepts a boolean or
// the strings "true" and "false"; anything else is a parameter error.
export function listFilters({ available, category } = {}) {
  const filters = {};
  if (available !== undefined) {
    if (available === true || available === "true") filters.available = true;
    else if (available === false || available === "false") filters.available = false;
    else
      throw new CatalogError(
        "invalid_parameter",
        "available must be true or false.",
      );
  }
  if (category !== undefined) {
    if (!text(category, 60))
      throw new CatalogError(
        "invalid_parameter",
        "category must be a name of 1 to 60 characters.",
      );
    filters.category = category.trim();
  }
  return filters;
}

export function listTools(catalog, filters = {}) {
  const wanted = filters.category?.toLowerCase();
  const tools = catalog.tools
    .filter(
      (tool) =>
        (filters.available === undefined || tool.available === filters.available) &&
        (wanted === undefined || tool.category.toLowerCase() === wanted),
    )
    .map(publicTool);
  return {
    ...envelope(catalog),
    categories: [...new Set(catalog.tools.map((tool) => tool.category))],
    count: tools.length,
    tools,
  };
}

export function showTool(catalog, id) {
  if (typeof id !== "string" || !TOOL_ID.test(id))
    throw new CatalogError(
      "invalid_parameter",
      "A tool id uses lowercase letters, digits and hyphens, such as cordless-drill.",
    );
  const tool = catalog.tools.find((item) => item.id === id);
  if (!tool)
    throw new CatalogError(
      "not_found",
      "No tool has that id. List the tools to see every id.",
    );
  return { ...envelope(catalog), tool: publicTool(tool) };
}

// The one error shape both lanes print.
export function errorShape(code, message, status) {
  return { api_version: API_VERSION, error: { code, message, status } };
}

// Unknown errors become a generic message so nothing internal is shown.
export function errorBody(error) {
  return error instanceof CatalogError
    ? errorShape(error.code, error.message, error.status)
    : errorShape("internal_error", "Something went wrong. Nothing was changed.", 500);
}
