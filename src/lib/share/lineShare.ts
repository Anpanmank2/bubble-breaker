export function buildLineShare(text: string): string {
  const params = new URLSearchParams({ text });
  return `https://line.me/R/share?${params.toString()}`;
}
