import { apiError, createEntry, limitCreation } from '@/lib/storage';
import { readJson, validateDestination } from '@/lib/validation';
import { requireUser } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const ownerId = await requireUser(request);
    const body = await readJson(request);
    const destination = validateDestination(body && typeof body === 'object' ? (body as Record<string, unknown>).url : undefined);
    await limitCreation(ownerId);
    const code = await createEntry({ kind: 'url', blog: null, destination, owner_id: ownerId });
    return Response.json({ code, path: `/s/${code}` }, { status: 201 });
  } catch (error) { return apiError(error); }
}
