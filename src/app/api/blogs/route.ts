import { apiError, createEntry, limitCreation } from '@/lib/storage';
import { readJson, validateBlog } from '@/lib/validation';
import { requireUser } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const ownerId = await requireUser(request);
    const blog = validateBlog(await readJson(request));
    await limitCreation(ownerId);
    const code = await createEntry({ kind: 'blog', blog, destination: null, owner_id: ownerId });
    return Response.json({ code, path: `/s/${code}`, blogPath: `/b/${code}` }, { status: 201 });
  } catch (error) { return apiError(error); }
}
