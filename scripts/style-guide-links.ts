import { marked } from "marked";
import type { Token } from "marked";

// Inspect JSON values, not quoted fragments inside serialized example prose.
export function jsonResourceReferences(source: string): readonly string[] {
  const value: unknown = JSON.parse(source);
  let references: string[] = [];
  function visit(item: unknown): void {
    if (typeof item === "string") {
      if (/^(?:\/(?!\/)|https:\/\/starter\.devthomas\.site\/)[^\s"'\\]*$/.test(item)) references.push(item);
      return;
    }
    if (Array.isArray(item)) {
      const entries: readonly unknown[] = item;
      for (const entry of entries) visit(entry);
      return;
    }
    if (item !== null && typeof item === "object") {
      const entries: readonly unknown[] = Object.values(item);
      for (const entry of entries) visit(entry);
    }
  }
  visit(value);
  return references;
}

export function markdownResourceReferences(source: string): readonly string[] {
  let references: string[] = [];
  marked.walkTokens(marked.lexer(source), (token: Token): void => {
    if (token.type === "link" || token.type === "image") references.push(token.href);
  });
  return references;
}
