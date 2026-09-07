import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
const allowedFiles = new Set(['src/content/shop-items.json', 'src/content/gallery-order.json']);

// Path-scoped commits preserve unrelated staged and unstaged work.
export async function publishEditorData(root, file) {
  if (!allowedFiles.has(file)) throw new Error('This file cannot be published from the editor.');
  const git = async (...args) => (await exec('git', args, { cwd: root, timeout: 60_000, maxBuffer: 1_000_000 })).stdout.trim();
  if (await git('branch', '--show-current') !== 'main') throw new Error('Saved locally. Switch to main before publishing.');
  await git('fetch', 'origin', 'main');
  try { await git('merge-base', '--is-ancestor', 'origin/main', 'HEAD'); }
  catch { throw new Error('Saved locally. Main has newer changes; ask Codex to sync them before publishing.'); }
  const pending = await git('log', '--format=', '--name-only', 'origin/main..HEAD');
  if (pending.split('\n').some(path => path && path !== file)) throw new Error('Saved locally. Other unpublished commits are waiting; ask Codex to review them before publishing.');
  // Referenced pictures must already be published; the button only publishes data.
  const { readFile } = await import('node:fs/promises');
  const next = JSON.parse(await readFile(`${root}/${file}`, 'utf8'));
  const images = file.endsWith('shop-items.json') ? next.map(item => item.image) : next;
  for (const image of new Set(images)) {
    try { await git('cat-file', '-e', `origin/main:public/images/gallery-web/${image}`); }
    catch { throw new Error('Saved locally. A selected photo is not published yet; ask Codex to publish the photo first.'); }
  }
  if (await git('diff', 'HEAD', '--', file)) await git('commit', '--only', '-m', file.endsWith('shop-items.json') ? 'Update shop from editor' : 'Update gallery from editor', '--', file);
  try { await git('push', 'origin', 'HEAD:main'); }
  catch { throw new Error('Saved locally, but publishing failed. Check your connection and GitHub sign-in, then try again.'); }
  return { saved: true, published: true, message: 'Sent to Netlify — your update will appear on daisyhatchet.com shortly.' };
}
