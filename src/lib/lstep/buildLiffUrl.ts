export function buildLiffUrl(code: string): string {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (liffId) {
    return `https://liff.line.me/${liffId}?code=${encodeURIComponent(code)}`;
  }
  return `https://example.com/liff-mock?code=${encodeURIComponent(code)}`;
}
