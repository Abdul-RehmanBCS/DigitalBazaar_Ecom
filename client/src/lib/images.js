const API_ROOT = import.meta.env.VITE_API_ROOT || "http://localhost:5000";

export function resolveImageSrc(path, fallbackSeed = "default") {
  if (!path) return `https://picsum.photos/seed/${fallbackSeed}/600/450`;
  if (path.startsWith("http")) return path;
  return `${API_ROOT}${path}`;
}

export function blogCoverSrc(slug, coverImage) {
  if (coverImage?.startsWith("http")) return coverImage;
  return `https://picsum.photos/seed/blog-${slug}/800/450`;
}
