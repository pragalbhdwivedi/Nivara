const ensureTrailingSlash = (value: string) => (value.endsWith("/") ? value : `${value}/`);

export const withBase = (path: string) => {
  const base = ensureTrailingSlash(import.meta.env?.BASE_URL ?? "/");
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${normalizedPath}`;
};
