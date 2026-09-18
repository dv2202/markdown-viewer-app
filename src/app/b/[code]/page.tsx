import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cache } from 'react';
import { getEntry } from '@/lib/storage';
import { FONTS_LIST, safeHttpUrl, safeProfileUrl } from '@/lib/blog';
import MarkdownContent from '@/components/MarkdownContent';

const loadEntry = cache(getEntry);

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const entry = await loadEntry((await params).code);
  return { title: entry?.kind === 'blog' && entry.blog ? `${entry.blog.title} | DocuBlog Studio` : 'Blog not found' };
}

export default async function PublishedBlog({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const entry = await loadEntry(code);
  if (!entry || entry.kind !== 'blog' || !entry.blog) notFound();
  const blog = entry.blog;
  const font = FONTS_LIST.find(font => font.id === blog.selectedFont) || FONTS_LIST[0];
  const words = blog.markdown.trim().split(/\s+/).length;

  return (
    <div className={blog.isDarkMode ? 'dark min-h-screen' : 'min-h-screen'}>
      <main className="min-h-screen bg-white dark:bg-[#0d1117] text-neutral-900 dark:text-neutral-100">
        <header className="max-w-[760px] mx-auto px-6 pt-10 pb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {blog.avatarUrl && safeHttpUrl(blog.avatarUrl) && (
              // User-provided avatar URLs cannot use a fixed Next Image allowlist.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={blog.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
            )}
            <span className="font-semibold text-sm">{blog.authorName}</span>
          </div>
          <nav aria-label="Author links" className="flex flex-wrap gap-4 text-xs text-neutral-500 dark:text-neutral-400">
            {blog.socialLinks.filter(link => safeProfileUrl(link.url)).map(link => (
              <a key={link.id} href={link.url} target={link.url.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="hover:underline">{link.label}</a>
            ))}
          </nav>
        </header>
        <article className="max-w-[760px] mx-auto px-6 pt-6 pb-20">
          <p className="text-xs text-neutral-500 mb-6">{Math.max(1, Math.ceil(words / 200))} min read · Published {new Date(entry.created_at).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p>
          <div className={`prose dark:prose-invert max-w-none ${font.class}`}>
            <h1>{blog.title}</h1>
            <MarkdownContent markdown={blog.markdown} />
          </div>
        </article>
        <footer className="max-w-[760px] mx-auto px-6 pb-8 text-xs text-neutral-500 print:hidden">
          Published with <Link href="/" className="underline">DocuBlog Studio</Link>
        </footer>
      </main>
    </div>
  );
}
