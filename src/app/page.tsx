'use client';

import React, { useState, useRef, useEffect, useSyncExternalStore, useCallback } from 'react';
import {
  UploadCloud,
  FileText,
  Eye,
  Edit3,
  Moon,
  Sun,
  Printer,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Check,
  Copy,
  Globe,
  Mail,
  Plus,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Download,
  Code,
  Sliders,
  Type
} from 'lucide-react';
import ShaderHero from './ShaderHero';
import MarkdownContent from '@/components/MarkdownContent';
import SharingPanel from '@/components/SharingPanel';
import { BlogSnapshot, FONTS_LIST, safeProfileUrl, SocialLink } from '@/lib/blog';

let memoryTheme = false;
function getTheme() {
  try { return localStorage.getItem('mv_dark_mode') === 'true'; }
  catch { return memoryTheme; }
}
function subscribeTheme(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('theme-changed', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('theme-changed', callback);
  };
}
function setIsDarkMode(value: boolean) {
  memoryTheme = value;
  try { localStorage.setItem('mv_dark_mode', String(value)); } catch { /* In-memory theme still works. */ }
  window.dispatchEvent(new Event('theme-changed'));
}

// Brand SVGs
const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25c-.9 0-1.63.73-1.63 1.63s.73 1.63 1.63 1.63c.9 0 1.63-.73 1.63-1.63s-.73-1.63-1.63-1.63z"/>
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const DEFAULT_LINKS: SocialLink[] = [
  { id: '1', label: 'Blog', url: '#blog', type: 'custom' },
  { id: '2', label: 'Contact', url: 'mailto:ramin@example.com', type: 'email' },
  { id: '3', label: 'About', url: '#about', type: 'custom' },
  { id: '4', label: 'GitHub', url: 'https://github.com', type: 'github' },
  { id: '5', label: 'Twitter', url: 'https://twitter.com', type: 'twitter' },
  { id: '6', label: 'LinkedIn', url: 'https://linkedin.com', type: 'linkedin' },
];

const SAMPLE_MD = `Once you have those four buckets in your head, the next step is not "optimize." It is "figure out which kind of work is actually hurting you."

Start with the symptom:

* typing lags
* scrolling janks
* first interaction feels dead
* one route feels heavy after data loads
* an animation drops frames during unrelated state changes

Then ask which class of work fits that symptom.

If typing lags, likely suspects are:

* repeated JS work
* expensive children rerendering
* large synchronous computations
* urgent and non-urgent updates competing

If scrolling janks, likely suspects are:

* too much live DOM
* expensive layout or paint
* heavy scroll handlers

If the page looks ready but does not respond, likely suspects are:

* hydration
* bundle cost
* mount-time client work

That step removes a lot of fake optimization work. Before you add \`useMemo\`, you should know whether the bottleneck is even repeated JavaScript work. Before you blame React render time, you should know whether the browser is paying the real bill after commit.

\`\`\`javascript
// Example: Optimize only after measuring
function ExpensiveList({ items, filter }) {
  // Only calculate when items or filter change
  const filteredItems = useMemo(() => {
    return items.filter(item => item.name.includes(filter));
  }, [items, filter]);

  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
\`\`\`

> "Premature optimization is the root of all evil." — Donald Knuth
`;

export default function Home() {
  // View states: 'landing' | 'app'
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<'edit' | 'view'>('edit');

  // Blog states
  const [title, setTitle] = useState('My blog');
  const [draftId, setDraftId] = useState<string | undefined>();
  const newDraft = useCallback(() => setDraftId(undefined), []);
  const [markdown, setMarkdown] = useState<string>(SAMPLE_MD);
  const isDarkMode = useSyncExternalStore(subscribeTheme, getTheme, () => false);
  const [authorName, setAuthorName] = useState<string>('Ramin Mousavi');
  const [avatarUrl, setAvatarUrl] = useState<string>('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80');
  const [selectedFont, setSelectedFont] = useState<string>('inter');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(DEFAULT_LINKS);

  // Custom new link state
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkType, setNewLinkType] = useState<SocialLink['type']>('github');

  // Utilities
  const [copied, setCopied] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  // File Upload Handlers
  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setMarkdown(content);
      setCurrentScreen('app');
      setActiveTab('view');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download handlers
  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'blog-post.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadHTML = () => {
    const articleEl = document.getElementById('blog-preview-article');
    const contentHtml = articleEl ? articleEl.innerHTML : `<p>${markdown}</p>`;
    const fullHtml = `<!DOCTYPE html>
<html lang="en" class="${isDarkMode ? 'dark' : ''}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${authorName}'s Blog</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,600;1,400&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
    }
  </script>
  <style>
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-white dark:bg-[#0d1117] text-neutral-900 dark:text-neutral-100 min-h-screen">
  <div class="max-w-[760px] mx-auto px-6 py-12">
    <header class="flex items-center justify-between pb-8 mb-8 border-b border-neutral-100 dark:border-neutral-800">
      <div class="flex items-center gap-3">
        ${avatarUrl ? `<img src="${avatarUrl}" class="w-8 h-8 rounded-full object-cover">` : ''}
        <span class="font-semibold text-sm">${authorName}</span>
      </div>
    </header>
    <article class="prose dark:prose-invert max-w-none leading-relaxed">
      ${contentHtml}
    </article>
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'blog-post.html';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Add social link
  const handleAddLink = () => {
    if (!newLinkLabel.trim() || !safeProfileUrl(newLinkUrl.trim())) return;
    const newLink: SocialLink = {
      id: Date.now().toString(),
      label: newLinkLabel.trim(),
      url: newLinkUrl.trim(),
      type: newLinkType
    };
    setSocialLinks([...socialLinks, newLink]);
    setNewLinkLabel('');
    setNewLinkUrl('');
  };

  const handleDeleteLink = (id: string) => {
    setSocialLinks(socialLinks.filter(l => l.id !== id));
  };

  const loadDraft = (blog: BlogSnapshot, id: string) => {
    setTitle(blog.title);
    setMarkdown(blog.markdown);
    setAuthorName(blog.authorName);
    setAvatarUrl(blog.avatarUrl);
    setSelectedFont(blog.selectedFont);
    setSocialLinks(blog.socialLinks);
    setIsDarkMode(blog.isDarkMode);
    setDraftId(id);
    setActiveTab('edit');
  };

  // Stats calculation
  const wordsCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const charsCount = markdown.length;
  const readTime = Math.max(1, Math.ceil(wordsCount / 200));

  const activeFontObj = FONTS_LIST.find(f => f.id === selectedFont) || FONTS_LIST[0];

  // ================= 1. SHADER LANDING PAGE (NO LOGIN, PURE LUXURY) =================
  if (currentScreen === 'landing') {
    return (
      <div className="relative min-h-screen bg-white dark:bg-[#07090e] text-neutral-900 dark:text-white flex flex-col justify-between overflow-hidden selection:bg-neutral-900 selection:text-white">

        {/* Interactive WebGL Dynamic Fluid Shader Canvas */}
        <ShaderHero isDarkMode={isDarkMode} />

        {/* Ambient Grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

        {/* Top Floating Glass Navigation */}
        <header className="relative z-20 max-w-6xl mx-auto w-full px-6 pt-6">
          <div className="w-full h-16 rounded-2xl bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-neutral-200/80 dark:border-neutral-800/80 px-6 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 font-bold text-sm tracking-tight">
              <span className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-md">
                <FileText className="w-4 h-4" />
              </span>
              <span className="bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
                DocuBlog Studio
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60 bg-white/70 dark:bg-neutral-800/70 hover:bg-white dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer shadow-xs"
                title="Toggle theme"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-700" />}
              </button>
              <button
                onClick={() => {
                  setCurrentScreen('app');
                  setActiveTab('edit');
                }}
                className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
              >
                Open Studio <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <main className="relative z-20 max-w-5xl mx-auto px-6 py-16 text-center my-auto flex flex-col items-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neutral-200/80 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md text-xs font-medium text-neutral-700 dark:text-neutral-300 shadow-sm mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Fluid WebGL Engine • Editorial Markdown Viewer</span>
          </div>

          {/* Large Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] max-w-4xl text-neutral-900 dark:text-white drop-shadow-xs">
            View your blog before publishing it.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-neutral-600 dark:text-neutral-300/90 leading-relaxed max-w-2xl font-normal">
            Transform raw markdown into a stunning, distraction-free editorial blog. Choose from 8 curated typography styles, customize your author presence, and export in a click.
          </p>

          {/* Primary CTA Group */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                setCurrentScreen('app');
                setActiveTab('edit');
              }}
              className="px-7 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-semibold text-sm shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-400 dark:text-amber-500 fill-current" />
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setMarkdown(SAMPLE_MD);
                setCurrentScreen('app');
                setActiveTab('view');
              }}
              className="px-6 py-3.5 rounded-2xl border border-neutral-200/90 dark:border-neutral-700/80 bg-white/70 dark:bg-neutral-900/70 hover:bg-white dark:hover:bg-neutral-800 backdrop-blur-md text-neutral-800 dark:text-neutral-200 font-medium text-sm transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:scale-105"
            >
              <Eye className="w-4 h-4 text-blue-500" />
              <span>Live Sample Preview</span>
            </button>
          </div>

          {/* 3 Interactive Feature Cards */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl w-full text-left">
            <div className="p-5 rounded-2xl bg-white/60 dark:bg-neutral-900/50 backdrop-blur-xl border border-neutral-200/70 dark:border-neutral-800/70 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <Type className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">8 Curated Fonts</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Inter, Newsreader, Lora, JetBrains Mono, Merriweather, and more.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/60 dark:bg-neutral-900/50 backdrop-blur-xl border border-neutral-200/70 dark:border-neutral-800/70 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Social & Profile Customizer</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Add GitHub, LinkedIn, Twitter, Portfolio, or custom links with live avatar.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/60 dark:bg-neutral-900/50 backdrop-blur-xl border border-neutral-200/70 dark:border-neutral-800/70 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Preview Locally, Share When Ready</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Preview on your device. Publish a snapshot to share a short link with anyone.
              </p>
            </div>
          </div>

        </main>

        {/* Footer */}
        <footer className="relative z-20 max-w-6xl mx-auto w-full px-6 py-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
          Markdown Blog Reader & Previewer Engine • Move mouse to interact with the shader
        </footer>
      </div>
    );
  }

  // ================= 2. MAIN APPLICATION WORKSPACE =================
  return (
    <div className="min-h-screen bg-white dark:bg-[#0d1117] text-neutral-900 dark:text-neutral-100 transition-colors duration-200">

      {/* Top Application Toolbar */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-[#0d1117]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentScreen('landing')}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors cursor-pointer"
              title="Back to Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 font-semibold text-sm tracking-tight">
              <span className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-blue-600 dark:text-blue-400">
                <FileText className="w-4 h-4" />
              </span>
              <span>DocuBlog Studio</span>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex p-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60">
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editor & Upload
            </button>
            <button
              onClick={() => {
                setActiveTab('view');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'view'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              View Blog
            </button>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMarkdown}
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
              title="Download Markdown (.md)"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadHTML}
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
              title="Download Standalone HTML (.html)"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-700" />}
            </button>
            <button
              onClick={() => {
                if (activeTab !== 'view') setActiveTab('view');
                setTimeout(() => window.print(), 100);
              }}
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
              title="Print / Save as PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <SharingPanel
        blog={{ title, markdown, authorName, avatarUrl, selectedFont, socialLinks, isDarkMode }}
        draftId={draftId}
        onSaved={setDraftId}
        onLoad={loadDraft}
        onNewDraft={newDraft}
        onTitleChange={setTitle}
      />

      {/* ================= EDIT & UPLOAD MODE ================= */}
      {activeTab === 'edit' && (
        <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6 animate-in fade-in duration-200">

          {/* Upload Dropzone Card */}
          <div className="bg-neutral-50/50 dark:bg-neutral-900/40 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 text-center cursor-pointer transition-all border-b border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center gap-3 ${
                isDragOver ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-400' : 'hover:bg-neutral-100/50 dark:hover:bg-neutral-900/80'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".md,.markdown,.txt"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">
                  Drop your markdown file here, or <span className="text-blue-600 dark:text-blue-400 underline">browse</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-1">Supports .md, .markdown, .txt</p>
              </div>
            </div>

            {/* Customization Configuration Bar (Matching Image #3) */}
            <div className="p-5 bg-white dark:bg-neutral-900/70 border-b border-neutral-200 dark:border-neutral-800">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">

                {/* Author Name */}
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    AUTHOR NAME
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Ramin Mousavi"
                  />
                </div>

                {/* Avatar Image URL */}
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    AVATAR IMAGE URL
                  </label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
                    placeholder="https://..."
                  />
                </div>

                {/* Typography Style dropdown */}
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    TYPOGRAPHY STYLE
                  </label>
                  <select
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {FONTS_LIST.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="md:col-span-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMarkdown(SAMPLE_MD)}
                    className="px-3.5 py-2 text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Sample
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('view');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    View Blog <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>

            {/* Social Links & Navigation Customization Card */}
            <div className="p-5 bg-neutral-50/70 dark:bg-neutral-900/40">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Header Navigation & Social Links (GitHub, LinkedIn, Twitter, etc.)
                </span>
                <span className="text-xs text-neutral-400">{socialLinks.length} links configured</span>
              </div>

              {/* Existing links tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {socialLinks.map((link) => (
                  <div
                    key={link.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs shadow-xs"
                  >
                    {link.type === 'github' && <GithubIcon className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />}
                    {link.type === 'linkedin' && <LinkedinIcon className="w-3.5 h-3.5 text-blue-600" />}
                    {link.type === 'twitter' && <TwitterIcon className="w-3.5 h-3.5 text-sky-500" />}
                    {link.type === 'email' && <Mail className="w-3.5 h-3.5 text-amber-500" />}
                    {link.type === 'website' && <Globe className="w-3.5 h-3.5 text-emerald-500" />}
                    {link.type === 'custom' && <FileText className="w-3.5 h-3.5 text-neutral-400" />}
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{link.label}</span>
                    <span className="text-[10px] text-neutral-400 max-w-[120px] truncate">{link.url}</span>
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="text-neutral-400 hover:text-red-500 transition-colors ml-1 cursor-pointer"
                      title="Remove link"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Link inputs */}
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  placeholder="Label (e.g. LinkedIn, Portfolio)"
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
                />
                <input
                  type="text"
                  placeholder="URL (https://... or mailto:)"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1 min-w-[200px]"
                />
                <select
                  value={newLinkType}
                  onChange={(e) => setNewLinkType(e.target.value as SocialLink['type'])}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="github">GitHub</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter / X</option>
                  <option value="website">Website</option>
                  <option value="email">Email</option>
                  <option value="custom">Custom Page</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Link
                </button>
              </div>
            </div>

          </div>

          {/* Markdown Editor Textarea */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm flex flex-col">
            <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40 flex items-center justify-between text-xs text-neutral-500">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Markdown Source
              </span>
              <div className="flex items-center gap-3">
                <span>{charsCount.toLocaleString()} chars</span>
                <span>•</span>
                <span>{wordsCount.toLocaleString()} words</span>
                <span>•</span>
                <span>{readTime} min read</span>
                <button
                  onClick={handleCopyMarkdown}
                  className="ml-2 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Paste or type markdown content here..."
              rows={18}
              className="w-full p-4 font-mono text-xs md:text-sm bg-transparent focus:outline-none resize-y leading-relaxed text-neutral-800 dark:text-neutral-200"
            />
          </div>
        </main>
      )}

      {/* ================= BLOG VIEW (MATCHING SCREENSHOT) ================= */}
      {activeTab === 'view' && (
        <div className="min-h-screen animate-in fade-in duration-200">

          {/* Header Bar identical to screenshot */}
          <header className="max-w-[760px] mx-auto px-6 pt-10 pb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt={authorName}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-800"
                />
              )}
              <span className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-neutral-100">
                {authorName}
              </span>
            </div>

            {/* Configurable Links */}
            <nav className="flex items-center gap-4 text-xs font-normal text-neutral-500 dark:text-neutral-400">
              {socialLinks.map((link, idx) => (
                <a
                  key={link.id}
                  href={link.url}
                  target={link.url.startsWith('http') ? '_blank' : '_self'}
                  rel="noreferrer"
                  className={`transition-colors hover:text-neutral-900 dark:hover:text-neutral-100 ${
                    idx === 0 ? 'text-neutral-900 dark:text-neutral-100 font-medium' : ''
                  }`}
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </nav>
          </header>

          {/* Article Container matching screenshot layout */}
          <article id="blog-preview-article" className="max-w-[760px] mx-auto px-6 py-6 pb-28">
            <div className={`prose dark:prose-invert max-w-none text-neutral-900 dark:text-neutral-100 leading-relaxed ${activeFontObj.class}`}>
              <h1>{title || 'Untitled blog'}</h1>
              <MarkdownContent markdown={markdown} />
            </div>
          </article>

          {/* Floating Actions Pill */}
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
            <button
              onClick={() => setActiveTab('edit')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 text-xs font-semibold shadow-xl hover:scale-105 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit / Upload
            </button>
            <button
              onClick={handleDownloadHTML}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold shadow-xl hover:scale-105 transition-all cursor-pointer border border-neutral-200 dark:border-neutral-700"
              title="Download styled HTML"
            >
              <Download className="w-3.5 h-3.5" /> HTML
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
