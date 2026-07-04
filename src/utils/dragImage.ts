/** Extracts an image URL from a drag event that originated from a webpage (not a local file). */
export function extractDraggedImageUrl(dataTransfer: DataTransfer): string | null {
  const uriList = dataTransfer.getData('text/uri-list');
  const firstUri = uriList
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#'));
  if (firstUri) return firstUri;

  const html = dataTransfer.getData('text/html');
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match) return match[1];

  const plain = dataTransfer.getData('text/plain').trim();
  if (/^https?:\/\//i.test(plain)) return plain;

  return null;
}
