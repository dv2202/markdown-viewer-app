import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const output = mkdtempSync(join(tmpdir(), 'docublog-tests-'));
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', 'src/lib/blog.ts', 'src/lib/validation.ts',
  '--outDir', output, '--module', 'commonjs', '--target', 'es2022', '--skipLibCheck', '--strict']);
const { validateBlog, validateDestination, readJson } = createRequire(import.meta.url)(join(output, 'validation.js'));
after(() => rmSync(output, { recursive: true, force: true }));

const blog = {
  title: 'A shared blog', markdown: '# Hello\n\nWorld', authorName: 'Devansh', avatarUrl: '',
  selectedFont: 'lora', isDarkMode: true,
  socialLinks: [{ id: '1', label: 'Portfolio', type: 'website', url: 'https://example.com' }],
};

test('publishing preserves content and presentation while ignoring unknown fields', () => {
  const snapshot = validateBlog({ ...blog, secret: 'not part of the publication' });
  assert.equal(snapshot.markdown, blog.markdown);
  assert.equal(snapshot.selectedFont, 'lora');
  assert.equal(snapshot.isDarkMode, true);
  assert.equal(snapshot.socialLinks[0].url, 'https://example.com');
  assert.equal('secret' in snapshot, false);
});

test('rejects unsafe profile/avatar URLs and oversized or malformed blogs', () => {
  for (const patch of [
    { markdown: ' ' }, { markdown: 'x'.repeat(200_001) }, { title: '' }, { selectedFont: 'unknown' },
    { avatarUrl: 'javascript:alert(1)' }, { isDarkMode: 'true' }, { socialLinks: Array(21).fill(blog.socialLinks[0]) },
    { socialLinks: [{ ...blog.socialLinks[0], url: 'javascript:alert(1)' }] },
  ]) assert.throws(() => validateBlog({ ...blog, ...patch }));
});

test('accepts web destinations, including query strings, and rejects executable URLs and credentials', () => {
  assert.equal(validateDestination(' https://example.com/path?q=hello#heading '), 'https://example.com/path?q=hello#heading');
  for (const value of ['javascript:alert(1)', 'data:text/html,hello', '//example.com', 'ftp://example.com',
    'https://user:password@example.com', '', null]) assert.throws(() => validateDestination(value));
});

test('request parsing rejects malformed JSON and bounds streamed bodies without Content-Length', async () => {
  assert.deepEqual(await readJson(new Request('http://localhost', { method: 'POST', body: JSON.stringify(blog) })), blog);
  await assert.rejects(readJson(new Request('http://localhost', { method: 'POST', body: '{broken' })), /Invalid JSON/);
  const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(1_000_001)); controller.close(); } });
  await assert.rejects(readJson(new Request('http://localhost', { method: 'POST', body, duplex: 'half' })), error => error.status === 413);
});
