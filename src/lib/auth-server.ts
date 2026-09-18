import 'server-only';
import { InputError } from './validation';

export async function requireUser(request: Request): Promise<string> {
  const authorization = request.headers.get('authorization');
  if (!authorization || !/^Bearer \S+$/i.test(authorization)) {
    throw new InputError('Sign in to save or share.', 401);
  }
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new InputError('Login is not configured yet. Check the Supabase settings.', 503);
  // Verify the token with Supabase Auth; never trust client-supplied user IDs.
  const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, {
    headers: { apikey: key, Authorization: authorization },
    cache: 'no-store', signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 401 || response.status === 403) throw new InputError('Your session expired. Sign in again.', 401);
  if (!response.ok) throw new InputError('Login is temporarily unavailable. Try again.', 503);
  const user = await response.json();
  if (typeof user.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(user.id) || user.is_anonymous === true) {
    throw new InputError('Sign in with your email to save or share.', 401);
  }
  return user.id;
}
