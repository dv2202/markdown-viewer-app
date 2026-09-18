export const FONTS_LIST = [
  { id: 'inter', name: 'Clean Modern Sans (Inter)', class: 'font-inter' },
  { id: 'jakarta', name: 'Plus Jakarta Sans', class: 'font-jakarta' },
  { id: 'newsreader', name: 'Newsreader (Editorial Serif)', class: 'font-newsreader' },
  { id: 'lora', name: 'Lora (Contemporary Serif)', class: 'font-lora' },
  { id: 'merriweather', name: 'Merriweather (Literary Serif)', class: 'font-merriweather' },
  { id: 'playfair', name: 'Playfair Display', class: 'font-playfair' },
  { id: 'space', name: 'Space Grotesk', class: 'font-space' },
  { id: 'jetbrains', name: 'JetBrains Mono', class: 'font-jetbrains' },
];

export interface SocialLink {
  id: string;
  label: string;
  url: string;
  type: 'github' | 'twitter' | 'linkedin' | 'website' | 'email' | 'custom';
}

export interface BlogSnapshot {
  title: string;
  markdown: string;
  authorName: string;
  avatarUrl: string;
  selectedFont: string;
  socialLinks: SocialLink[];
  isDarkMode: boolean;
}

export function safeProfileUrl(value: string): boolean {
  return /^#[\w-]*$/.test(value) || /^mailto:[^\s<>]+$/i.test(value) || safeHttpUrl(value);
}

export function safeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}
