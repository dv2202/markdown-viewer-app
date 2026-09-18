import { requireUser } from '@/lib/auth-server';
import { apiError, limitCreation, saveDraft } from '@/lib/storage';
import { InputError, readJson, validateBlog } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const ownerId = await requireUser(request);
    const value = await readJson(request);
    if (!value || typeof value !== 'object') throw new InputError('Invalid draft.');
    const body = value as Record<string, unknown>;
    if (body.id !== undefined && (typeof body.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id))) {
      throw new InputError('Invalid draft ID.');
    }
    const blog = validateBlog(body.blog);
    if (!body.id) await limitCreation(ownerId);
    return Response.json(await saveDraft(ownerId, blog, body.id as string | undefined), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) { return apiError(error); }
}
