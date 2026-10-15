export const staticRoutes = [
  "/",
  "/guide",
  "/style",
  "/style/TypeScript",
  "/style/Godot",
  "/style/Kotlin",
  "/style/React-TypeScript",
  "/style/Python",
  "/style/Swift-SwiftUI",
  "/style/JavaScript",
  "/style/Dart-Flutter",
  "/phases/1",
  "/phases/2",
  "/phases/3",
  "/recommendations",
  "/resources",
  "/artifacts",
  "/about",
  "/contact",
  "/help/cloudflare-iphone",
];

export function readingRoutes(slugs: string[]) {
  return [...staticRoutes, "/skills", "/skills/recommendations", ...slugs.map(slug => `/skills/${slug}`)];
}
