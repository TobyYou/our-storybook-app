// store.js: reads and writes the storybook in a private GitHub repo.
// Every save is a commit, so the repo's history is the backup.

export const DATA_PATH = 'data/storybook.json';
const API = 'https://api.github.com';

const bytesToB64 = bytes => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
export const textToB64 = t => bytesToB64(new TextEncoder().encode(t));
const b64ToText = b => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, '')), c => c.charCodeAt(0)));
const encodePath = p => p.split('/').map(encodeURIComponent).join('/');
const clone = o => JSON.parse(JSON.stringify(o));

export class GitHubStore {
  constructor({ token, owner, repo, branch = 'main' }) {
    Object.assign(this, { token, owner, repo, branch });
  }
  async req(path, { method = 'GET', body, accept = 'application/vnd.github+json' } = {}) {
    const headers = { Authorization: `Bearer ${this.token}`, Accept: accept, 'X-GitHub-Api-Version': '2022-11-28' };
    if (body) headers['Content-Type'] = 'application/json';
    const r = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
    if (!r.ok) {
      const e = new Error(`GitHub ${r.status}`);
      e.status = r.status;
      try { e.detail = await r.json(); } catch { /* no body */ }
      throw e;
    }
    return r;
  }
  contents(path) { return `/repos/${this.owner}/${this.repo}/contents/${encodePath(path)}`; }
  async whoami() { return (await this.req('/user')).json(); }

  async load() {
    const j = await (await this.req(`${this.contents(DATA_PATH)}?ref=${this.branch}`)).json();
    let text;
    if (j.content && j.encoding === 'base64') text = b64ToText(j.content);
    else text = await (await this.req(`${this.contents(DATA_PATH)}?ref=${this.branch}`, { accept: 'application/vnd.github.raw' })).text();
    return { data: JSON.parse(text), sha: j.sha };
  }

  // Applies `mutate` to the newest copy on GitHub and commits it.
  // If someone else saved in between, it re-reads and re-applies, so neither edit is lost.
  async update(mutate, message) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const { data, sha } = await this.load();
      const next = clone(data);
      mutate(next);
      next.updatedAt = new Date().toISOString();
      try {
        await this.req(this.contents(DATA_PATH), {
          method: 'PUT',
          body: { message, content: textToB64(JSON.stringify(next, null, 2) + '\n'), sha, branch: this.branch },
        });
        return next;
      } catch (e) {
        if (e.status !== 409 && e.status !== 422) throw e;
      }
    }
    throw new Error('Could not save after several tries');
  }

  async putFile(path, base64, message) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        await this.req(this.contents(path), { method: 'PUT', body: { message, content: base64, branch: this.branch } });
        return path;
      } catch (e) {
        if (e.status !== 409) throw e;
        await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
      }
    }
    throw new Error('Could not upload after several tries');
  }

  async rawFile(path) {
    return (await this.req(`${this.contents(path)}?ref=${this.branch}`, { accept: 'application/vnd.github.raw' })).blob();
  }
}

// In-memory store for ?demo. Nothing leaves the browser.
export class DemoStore {
  constructor(seed) { this.data = clone(seed); this.files = new Map(); }
  async whoami() { return { login: 'demo' }; }
  async load() { return { data: clone(this.data), sha: 'demo' }; }
  async update(mutate) {
    await new Promise(r => setTimeout(r, 250));
    const next = clone(this.data); mutate(next); next.updatedAt = new Date().toISOString();
    this.data = next; return clone(next);
  }
  async putFile(path, base64) {
    const bin = atob(base64); const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    this.files.set(path, new Blob([bytes], { type: 'image/jpeg' })); return path;
  }
  async rawFile(path) {
    if (this.files.has(path)) return this.files.get(path);
    throw Object.assign(new Error('missing'), { status: 404 });
  }
}
