import { BlogSnapshot, FONTS_LIST, safeHttpUrl, safeProfileUrl, SocialLink } from './blog';

export class InputError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

function string(value: unknown, name: string, max: number, allowEmpty = false): string {
  if (typeof value !== 'string' || value.length > max || (!allowEmpty && !value.trim())) {
    throw new InputError(`${name} is required and must be at most ${max.toLocaleString()} characters.`);
  }
  return value;
}

export function validateBlog(value: unknown): BlogSnapshot {
  if (!value || typeof value !== 'object') throw new InputError('Invalid blog.');
  const blog = value as Record<string, unknown>;
  const title = string(blog.title, 'Title', 160).trim();
  const markdown = string(blog.markdown, 'Blog content', 200_000);
  const authorName = string(blog.authorName, 'Author name', 100).trim();
  const avatarUrl = string(blog.avatarUrl, 'Avatar URL', 2048, true).trim();
  if (avatarUrl && !safeHttpUrl(avatarUrl)) throw new InputError('Avatar must use an HTTP or HTTPS URL.');
  const selectedFont = string(blog.selectedFont, 'Font', 30);
  if (!FONTS_LIST.some(font => font.id === selectedFont)) throw new InputError('Invalid font.');
  if (typeof blog.isDarkMode !== 'boolean') throw new InputError('Invalid theme.');
  if (!Array.isArray(blog.socialLinks) || blog.socialLinks.length > 20) throw new InputError('Use at most 20 profile links.');
  const types = ['github', 'twitter', 'linkedin', 'website', 'email', 'custom'];
  const socialLinks = blog.socialLinks.map((value: unknown, index: number) => {
    if (!value || typeof value !== 'object') throw new InputError('Invalid profile link.');
    const link = value as Record<string, unknown>;
    const label = string(link.label, 'Link label', 60).trim();
    const url = string(link.url, 'Profile URL', 2048).trim();
    if (!safeProfileUrl(url)) throw new InputError('Profile links must use HTTP, HTTPS, mailto, or a page anchor.');
    if (typeof link.type !== 'string' || !types.includes(link.type)) throw new InputError('Invalid link type.');
    return { id: String(index), label, url, type: link.type as SocialLink['type'] };
  });
  return { title, markdown, authorName, avatarUrl, selectedFont, socialLinks, isDarkMode: blog.isDarkMode };
}

export function validateDestination(value: unknown): string {
  const destination = string(value, 'URL', 2048).trim();
  if (!safeHttpUrl(destination)) throw new InputError('Enter a full HTTP or HTTPS URL without embedded credentials.');
  return new URL(destination).href;
}

export async function readJson(request: Request): Promise<unknown> {
  // Bound the actual streamed body, including requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) throw new InputError('A JSON body is required.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 1_000_000) {
      await reader.cancel();
      throw new InputError('Request is too large.', 413);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new InputError('Invalid JSON.'); }
}
