'use client';

import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { authClient } from '@/lib/auth-client';

export default function LoginDialog({ onClose, onAuthenticated }: { onClose: () => void; onAuthenticated: (session: Session) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    dialog.current?.showModal();
    const element = dialog.current;
    return () => element?.close();
  }, []);

  async function submit() {
    setBusy(true); setMessage('');
    try {
      const client = authClient();
      if (!sent) {
        const { error } = await client.auth.signInWithOtp({ email: email.trim() });
        if (error) throw error;
        setSent(true); setMessage('Check your email for a login code.');
      } else {
        const { data, error } = await client.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
        if (error) throw error;
        if (!data.session) throw new Error('Login could not be completed. Request a new code.');
        onAuthenticated(data.session);
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Login failed. Try again.'); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog} onCancel={event => { if (busy) event.preventDefault(); else onClose(); }} aria-labelledby="login-title" className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white p-6 backdrop:bg-black/50">
    <h2 id="login-title" className="text-xl font-semibold">Sign in to save or share</h2>
    <p className="mt-2 text-sm text-neutral-500">Your work stays here while you sign in. Use your email to create an account or return to an existing one.</p>
    <form onSubmit={event => { event.preventDefault(); void submit(); }} className="mt-5 space-y-3">
      <label className="block text-sm">Email<input type="email" required autoComplete="email" value={email} readOnly={sent} onChange={event => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2" /></label>
      {sent && <label className="block text-sm">Email code<input required autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6,10}" value={code} onChange={event => setCode(event.target.value)} className="mt-1 w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2" /></label>}
      {message && <p role="status" className="text-sm text-amber-700 dark:text-amber-400">{message}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 font-semibold disabled:opacity-50 cursor-pointer">{busy ? 'Please wait…' : sent ? 'Sign in & continue' : 'Send login code'}</button>
      {sent && <button type="button" disabled={busy} onClick={() => { setSent(false); setCode(''); setMessage(''); }} className="text-sm underline cursor-pointer">Use a different email or request a new code</button>}
      <button type="button" disabled={busy} onClick={onClose} className="block w-full text-sm py-2 cursor-pointer">Cancel</button>
    </form>
  </dialog>;
}
