import { apiError, getEntry } from '@/lib/storage';
import { safeHttpUrl } from '@/lib/blog';

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const entry = await getEntry(code);
    if (!entry) return new Response('This short link does not exist.', { status: 404 });
    const destination = entry.kind === 'blog' ? `/b/${code}` : entry.destination;
    if (!destination || (entry.kind === 'url' && !safeHttpUrl(destination))) {
      return new Response('Invalid link destination.', { status: 404 });
    }
    return new Response(null, { status: 302, headers: { Location: destination, 'Cache-Control': 'no-store' } });
  } catch (error) { return apiError(error); }
}
