import 'server-only';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { BlogSnapshot } from './blog';
import { InputError } from './validation';

export type SharedEntry = {
  code: string;
  kind: 'blog' | 'url';
  blog: BlogSnapshot | null;
  destination: string | null;
  created_at: string;
  owner_id: string | null;
};

class StorageError extends Error {
  constructor(public status: number) { super('Database request failed.'); }
}

function config() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new InputError('Sharing is not configured yet. Set up Supabase using the README.', 503);
  return { url: url.replace(/\/$/, ''), key };
}

async function database<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
    headers: {
      apikey: key,
      ...(key.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${key}` }),
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...options.headers,
    },
  });
  if (!response.ok) throw new StorageError(response.status);
  return response.json() as Promise<T>;
}

export async function limitCreation(ownerId: string) {
  const { key } = config();
  const bucket = createHmac('sha256', key).update(ownerId).digest('hex');
  const allowed = await database<boolean>('rpc/consume_share_quota', {
    method: 'POST', body: JSON.stringify({ bucket_key: bucket }),
  });
  if (!allowed) throw new InputError('Publishing limit reached. Try again in an hour.', 429);
}

export async function createEntry(entry: Pick<SharedEntry, 'kind' | 'blog' | 'destination' | 'owner_id'>) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomBytes(6).toString('base64url');
    try {
      await database('shared_entries', { method: 'POST', body: JSON.stringify({ code, ...entry }) });
      return code;
    } catch (error) {
      if (!(error instanceof StorageError) || error.status !== 409) throw error;
    }
  }
  throw new Error('Could not allocate a short link.');
}

export type SavedDraft = { id: string; blog: BlogSnapshot; updated_at: string };

export async function listLibrary(ownerId: string) {
  const [drafts, entries] = await Promise.all([
    database<SavedDraft[]>(`blog_drafts?owner_id=eq.${ownerId}&select=id,blog,updated_at&order=updated_at.desc&limit=50`),
    database<Pick<SharedEntry, 'code' | 'kind' | 'blog' | 'destination' | 'created_at'>[]>(
      `shared_entries?owner_id=eq.${ownerId}&select=code,kind,blog,destination,created_at&order=created_at.desc&limit=50`),
  ]);
  return {
    drafts,
    links: entries.map(entry => ({ code: entry.code, kind: entry.kind,
      title: entry.kind === 'blog' ? entry.blog?.title : entry.destination, path: `/s/${entry.code}` })),
  };
}

export async function saveDraft(ownerId: string, blog: BlogSnapshot, id?: string): Promise<SavedDraft> {
  const rows = id
    ? await database<SavedDraft[]>(`blog_drafts?id=eq.${id}&owner_id=eq.${ownerId}`, {
      method: 'PATCH', body: JSON.stringify({ blog, updated_at: new Date().toISOString() }),
    })
    : await database<SavedDraft[]>('blog_drafts', {
      method: 'POST', body: JSON.stringify({ id: randomUUID(), owner_id: ownerId, blog }),
    });
  if (!rows[0]) throw new InputError('This draft does not exist in your account.', 404);
  return rows[0];
}

export async function getEntry(code: string): Promise<SharedEntry | null> {
  if (!/^[A-Za-z0-9_-]{8}$/.test(code)) return null;
  const entries = await database<SharedEntry[]>(`shared_entries?code=eq.${code}&select=*&limit=1`);
  return entries[0] || null;
}

export function apiError(error: unknown): Response {
  if (error instanceof InputError) return Response.json({ error: error.message }, { status: error.status });
  // Do not expose database credentials, endpoints, or raw upstream errors.
  return Response.json({ error: 'Storage is temporarily unavailable. Check the database setup and try again.' }, { status: 503 });
}
