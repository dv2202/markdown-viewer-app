'use client';

import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Check, Copy, Link2, Save, Share2 } from 'lucide-react';
import { BlogSnapshot } from '@/lib/blog';
import { authClient } from '@/lib/auth-client';
import LoginDialog from './LoginDialog';

type Action = 'blog' | 'url' | 'save';
type Draft = { id: string; blog: BlogSnapshot; updated_at: string };
type Library = { drafts: Draft[]; links: { code: string; title: string; path: string; kind: string }[] };
type Pending = { action: Action; blog: BlogSnapshot; destination: string; draftId?: string };
const inputClass = 'min-w-0 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 text-sm font-semibold disabled:opacity-50 cursor-pointer';

export default function SharingPanel({ blog, draftId, onSaved, onLoad, onNewDraft, onTitleChange }: {
  blog: BlogSnapshot; draftId?: string; onSaved: (id: string) => void;
  onLoad: (blog: BlogSnapshot, id: string) => void; onNewDraft: () => void; onTitleChange: (title: string) => void;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [destination, setDestination] = useState('');
  const [busy, setBusy] = useState<Action | null>(null);
  const [result, setResult] = useState('');
  const [message, setMessage] = useState('');
  const [copiedUrl, setCopiedUrl] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const [library, setLibrary] = useState<{ owner: string; data: Library } | null>(null);
  const [libraryError, setLibraryError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const pending = useRef<Pending | null>(null);
  const currentUser = useRef<string | undefined>(undefined);

  useEffect(() => {
    try {
      const { data } = authClient().auth.onAuthStateChange((_event, nextSession) => {
        if (currentUser.current !== nextSession?.user.id) {
          onNewDraft(); setResult(''); setMessage(''); setLibraryError('');
        }
        currentUser.current = nextSession?.user.id;
        setSession(nextSession);
      });
      return () => data.subscription.unsubscribe();
    } catch { /* Editor remains usable before authentication is configured. */ }
  }, [onNewDraft]);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    fetch('/api/library', { headers: { Authorization: `Bearer ${session.access_token}` }, signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load your saved blogs.');
        if (!controller.signal.aborted) { setLibrary({ owner: session.user.id, data }); setLibraryError(''); }
      })
      .catch(error => { if (!controller.signal.aborted) setLibraryError(error.message); });
    return () => controller.abort();
  }, [session, refresh]);

  async function execute(work: Pending, authenticated: Session) {
    setBusy(work.action); setMessage(''); setResult('');
    const owner = authenticated.user.id;
    try {
      const response = await fetch(work.action === 'blog' ? '/api/blogs' : work.action === 'url' ? '/api/links' : '/api/drafts', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authenticated.access_token}` },
        body: JSON.stringify(work.action === 'blog' ? work.blog : work.action === 'url' ? { url: work.destination } : { blog: work.blog, id: work.draftId }),
      });
      const data = await response.json();
      if (currentUser.current !== owner) return;
      if (response.status === 401) { pending.current = work; setLoginOpen(true); throw new Error(data.error); }
      if (!response.ok) throw new Error(data.error || 'Could not save or share.');
      if (work.action === 'save') { onSaved(data.id); setMessage('Draft saved privately to your account.'); }
      else setResult(new URL(data.path, window.location.origin).href);
      setRefresh(value => value + 1);
    } catch (error) {
      if (currentUser.current === owner) setMessage(error instanceof Error ? error.message : 'Could not save or share. Try again.');
    } finally { setBusy(null); }
  }

  async function create(action: Action) {
    if (busy !== null) return;
    setBusy(action);
    const work = { action, blog, destination, draftId };
    try {
      const { data, error } = await authClient().auth.getSession();
      if (error) throw error;
      if (!data.session) { pending.current = work; setLoginOpen(true); setBusy(null); return; }
      currentUser.current = data.session.user.id; setSession(data.session);
      await execute(work, data.session);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Login is unavailable.'); setBusy(null); }
  }

  function authenticated(nextSession: Session) {
    currentUser.current = nextSession.user.id; setSession(nextSession); setLoginOpen(false);
    const work = pending.current; pending.current = null;
    if (work) void execute(work, nextSession);
  }

  async function signOut() {
    try {
      const { error } = await authClient().auth.signOut();
      if (error) throw error;
      currentUser.current = undefined; setSession(null); setLibrary(null); setResult(''); setMessage(''); setLibraryError(''); onNewDraft();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not sign out.'); }
  }

  async function copy(url: string) {
    try { await navigator.clipboard.writeText(url); setCopiedUrl(url); setTimeout(() => setCopiedUrl(''), 2000); }
    catch { setMessage('Copy is unavailable. Select and copy the link manually.'); }
  }
  const saved = session && library?.owner === session.user.id ? library.data : null;

  return <section aria-label="Save and share" className="max-w-5xl w-full mx-auto px-4 pt-6 print:hidden">
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-5 space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div><h2 className="text-base font-semibold">Save & share</h2><p className="text-xs text-neutral-500 mt-1">Edit and preview freely. Sign in when you save or share. Anyone with a published link can read it.</p></div>
        {session && <div className="text-xs flex items-center gap-3"><span>{session.user.email}</span><button onClick={() => void signOut()} disabled={busy !== null} className="underline cursor-pointer">Sign out</button></div>}
      </div>
      <form className="flex flex-col sm:flex-row gap-2" onSubmit={event => { event.preventDefault(); void create('blog'); }}>
        <input aria-label="Blog title" placeholder="Blog title" required maxLength={160} value={blog.title} onChange={event => onTitleChange(event.target.value)} className={`${inputClass} flex-1`} />
        <button type="button" onClick={() => void create('save')} disabled={busy !== null || !blog.markdown.trim() || !blog.title.trim()} className={buttonClass}><Save className="w-4 h-4" />{busy === 'save' ? 'Saving…' : 'Save draft'}</button>
        <button disabled={busy !== null || !blog.markdown.trim()} className={buttonClass}><Share2 className="w-4 h-4" />{busy === 'blog' ? 'Publishing…' : 'Publish & share'}</button>
      </form>
      {draftId && <p className="text-xs text-neutral-500">Editing a saved draft. Saving updates it; publishing creates a separate snapshot. <button onClick={onNewDraft} className="underline cursor-pointer">Save as a new draft</button></p>}
      <form className="flex flex-col sm:flex-row gap-2" onSubmit={event => { event.preventDefault(); void create('url'); }}>
        <input aria-label="URL to shorten" type="url" placeholder="https://example.com/a-long-link" required maxLength={2048} value={destination} onChange={event => setDestination(event.target.value)} className={`${inputClass} flex-1`} />
        <button disabled={busy !== null} className={buttonClass}><Link2 className="w-4 h-4" />{busy === 'url' ? 'Creating…' : 'Shorten URL'}</button>
      </form>
      {message && <p role="status" className="text-sm text-amber-700 dark:text-amber-400">{message}</p>}
      {result && <div role="status" className="flex flex-wrap items-center gap-3 text-sm"><span className="text-green-700 dark:text-green-400">Link ready</span><a className="underline break-all" href={result} target="_blank" rel="noreferrer">{result}</a><button aria-label="Copy new link" onClick={() => void copy(result)} className="inline-flex items-center gap-1 cursor-pointer">{copiedUrl === result ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copiedUrl === result ? 'Copied' : 'Copy'}</button></div>}
      {session && <details><summary className="text-sm font-medium cursor-pointer">My saved blogs & links</summary>
        {libraryError && <p role="status" className="text-sm mt-2">{libraryError} <button onClick={() => setRefresh(value => value + 1)} className="underline cursor-pointer">Retry</button></p>}
        {!saved && !libraryError && <p className="text-xs mt-2">Loading…</p>}
        {saved && <div className="space-y-3 mt-3 max-h-64 overflow-y-auto">
          <h3 className="text-xs text-neutral-500">Private drafts</h3>
          {saved.drafts.length === 0 && <p className="text-xs">No saved drafts yet.</p>}
          <ul className="space-y-2">{saved.drafts.map(draft => <li key={draft.id}><button disabled={busy !== null} onClick={() => onLoad(draft.blog, draft.id)} className="text-sm underline cursor-pointer">{draft.blog.title}</button></li>)}</ul>
          <h3 className="text-xs text-neutral-500">Published blogs & short links</h3>
          {saved.links.length === 0 && <p className="text-xs">No shared links yet.</p>}
          <ul className="space-y-2">{saved.links.map(entry => <li key={entry.code} className="flex items-center gap-3 text-sm"><a href={entry.path} target="_blank" rel="noreferrer" className="flex-1 min-w-0 truncate underline">{entry.title}</a><span className="text-xs text-neutral-500">{entry.kind}</span><button aria-label={`Copy link for ${entry.title}`} onClick={() => void copy(new URL(entry.path, window.location.origin).href)} className="cursor-pointer">{copiedUrl.endsWith(entry.path) ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button></li>)}</ul>
        </div>}
      </details>}
    </div>
    {loginOpen && <LoginDialog onClose={() => { setLoginOpen(false); pending.current = null; }} onAuthenticated={authenticated} />}
  </section>;
}
