// Types for catalog.mjs, so TypeScript callers (the site's Worker) use the same module.

export type ErrorCode = "invalid_parameter" | "not_found" | "invalid_catalog";

export type PublicTool = {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly loan_days: number;
  readonly available: boolean;
};

export type Catalog = {
  readonly library: string;
  readonly updated: string;
  readonly tools: readonly (PublicTool & Readonly<Record<string, unknown>>)[];
};

export type ListFilters = {
  readonly available?: boolean;
  readonly category?: string;
};

type Envelope = {
  readonly api_version: string;
  readonly library: string;
  readonly catalog_updated: string;
};

export type ListBody = Envelope & {
  readonly categories: readonly string[];
  readonly count: number;
  readonly tools: readonly PublicTool[];
};

export type ShowBody = Envelope & { readonly tool: PublicTool };

export type ErrorBody = {
  readonly api_version: string;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly status: number;
  };
};

export declare const API_VERSION: string;
export declare const PUBLIC_FIELDS: readonly string[];
export declare const ERRORS: Readonly<
  Record<ErrorCode, { readonly status: number; readonly exit: number }>
>;

export declare class CatalogError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly exit: number;
  constructor(code: ErrorCode, message: string);
}

export declare function parseCatalog(value: unknown): Catalog;
export declare function publicTool(tool: PublicTool): PublicTool;
export declare function listFilters(input?: {
  readonly available?: string | boolean | undefined;
  readonly category?: string | undefined;
}): ListFilters;
export declare function listTools(catalog: Catalog, filters?: ListFilters): ListBody;
export declare function showTool(catalog: Catalog, id: string): ShowBody;
export declare function errorShape(code: string, message: string, status: number): ErrorBody;
export declare function errorBody(error: unknown): ErrorBody;
