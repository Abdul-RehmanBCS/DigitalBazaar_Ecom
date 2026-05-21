import { getApiRoot } from "./env.js";

export function resolveImageSrc(path, fallbackSeed = "default") {
  if (!path) return `https://picsum.photos/seed/${fallbackSeed}/600/450`;
  if (path.startsWith("http")) return path;
  const root = getApiRoot();
  return `${root}${path}`;
}

export function blogCoverSrc(slug, coverImage) {
  if (coverImage?.startsWith("http")) return coverImage;
  return `https://picsum.photos/seed/blog-${slug}/800/450`;
}
