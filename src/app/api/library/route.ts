import { requireUser } from '@/lib/auth-server';
import { apiError, listLibrary } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const ownerId = await requireUser(request);
    return Response.json(await listLibrary(ownerId), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return apiError(error); }
}
