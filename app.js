// Our Storybook: a shelf of trips. Each trip is an invitation (before) or a memory (after).
// All content lives in the private repo below. This file holds no memories.
import { GitHubStore, DemoStore, textToB64 } from './store.js';

const CONFIG = { owner: 'TobyYou', repo: 'our-storybook', branch: 'main' };
const TOKEN_KEY = 'our-storybook-key';

/* ---------- small helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* private mode */ } },
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const NUMBER_WORDS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen'];
const parseDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const shortDate = s => { if (!s) return ''; const d = parseDate(s); return `${MONTHS[d.getMonth()]} ${d.getDate()}`; };
const dayLabel = s => { const d = parseDate(s); return `${WEEKDAYS[d.getDay()]} · ${MONTHS[d.getMonth()]} ${d.getDate()}`; };
const longDay = s => { const d = parseDate(s); return `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()]}, ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()]} ${d.getDate()}`; };
function dateRange(t) {
  if (t.when) return esc(t.when);
  if (!t.start) return 'Dates to be decided';
  const a = parseDate(t.start), b = parseDate(t.end || t.start);
  const y = b.getFullYear();
  if (t.start === (t.end || t.start)) return `${MONTHS[a.getMonth()]} ${a.getDate()}, ${y}`;
  if (a.getMonth() === b.getMonth()) return `${MONTHS[a.getMonth()]} ${a.getDate()} – ${b.getDate()}, ${y}`;
  return `${MONTHS[a.getMonth()]} ${a.getDate()} – ${MONTHS[b.getMonth()]} ${b.getDate()}, ${y}`;
}
function datesBetween(start, end) {
  if (!start) return [];
  const out = []; const d = parseDate(start); const last = parseDate(end || start);
  while (d <= last && out.length < 14) { out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`); d.setDate(d.getDate() + 1); }
  return out;
}
const mapLink = q => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);

const THEMES = {
  night: 'Starry night', beach: 'Sunny beach', autumn: 'Autumn leaves', city: 'City lights', snow: 'Snowy days', garden: 'Spring garden',
};
const ICONS = {
  coffee: '<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 11h2a2 2 0 0 1 0 4h-2"/><path d="M8 3c0 2 2 2 2 4M12 3c0 2 2 2 2 4"/>',
  bowl: '<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M9 3l2 7M15 3l-2 7"/>',
  plate: '<circle cx="12" cy="13" r="7"/><circle cx="12" cy="13" r="3"/><path d="M3 4v6M21 4v16"/>',
  book: '<path d="M4 5h7v15H4zM13 5h7v15h-7z"/><path d="M6 9h3M15 9h3"/>',
  candle: '<rect x="8" y="10" width="8" height="11" rx="1.5"/><path d="M12 10V8"/><path d="M12 2c2 2.5 2 4 0 5.5C10 6 10 4.5 12 2z"/>',
  wand: '<path d="M4 20L15 9"/><path d="M18 2l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/>',
  dance: '<circle cx="14" cy="4" r="2"/><path d="M10 21l2-6 3 2v4"/><path d="M7 10l4-3 4 1 3 3"/><path d="M11 7l-1 7"/>',
  hat: '<path d="M2 16c4 3 16 3 20 0"/><path d="M6 15l1.5-7c1-1.5 3-1.5 4.5.5 1.5-2 3.5-2 4.5-.5L18 15"/>',
  hanger: '<path d="M12 7a2 2 0 1 1 2-2"/><path d="M14 5c0 1.5-2 2-2 3.5L21 16H3l9-7.5"/>',
  gift: '<rect x="4" y="11" width="16" height="10"/><path d="M3 8h18v3H3zM12 8v13"/><path d="M12 8c-2-4-6-3-4 0M12 8c2-4 6-3 4 0"/>',
  tree: '<path d="M12 21v-6"/><path d="M12 3l6 9H6z"/><path d="M12 8l5 7H7z"/>',
  beach: '<path d="M3 20h18"/><path d="M12 20V8"/><path d="M4 9a8 8 0 0 1 16 0z"/>',
  camera: '<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l2-3h4l2 3"/>',
  plane: '<path d="M10 14L3 11l1-2 8 1 5-6h2l-3 7 4 2-1 2-4-1-3 6H9z"/>',
  car: '<path d="M3 16v-4l2-5h14l2 5v4z"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/>',
  bed: '<path d="M3 18V8M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="2"/>',
  moon: '<path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"/>',
  heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.star}</svg>`;

/* ---------- state ---------- */
let store = null, me = null, data = null, editing = false;
const dayIndex = {};           // trip id -> selected day tab
const view = $('#view'), modal = $('#modal'), toastEl = $('#toast');
const isDemo = new URLSearchParams(location.search).has('demo');
const nameOf = login => (data?.people?.[login]) || login || 'Someone';
const myName = () => nameOf(me?.login);
const partnerName = () => { const others = Object.entries(data?.people || {}).filter(([l]) => l !== me?.login); return others[0]?.[1] || 'you'; };

/* ---------- toast ---------- */
let toastTimer;
function toast(msg, kind = 'ok', sticky = false) {
  toastEl.textContent = msg;
  toastEl.className = 'show ' + kind;
  clearTimeout(toastTimer);
  if (!sticky) toastTimer = setTimeout(() => { toastEl.className = ''; }, 2800);
}
function errorText(e) {
  if (e?.status === 401) return 'Your GitHub key stopped working. Sign out and connect again.';
  if (e?.status === 403 || e?.status === 404) return 'This key can’t reach the storybook. Check it has “repo” access and that you accepted the invitation.';
  if (!navigator.onLine) return 'You’re offline. Try again when you’re connected.';
  return 'Couldn’t save to GitHub. Try again in a moment.';
}

/* ---------- saving: every change is a commit ---------- */
async function save(mutate, message) {
  toast('Saving to GitHub…', 'busy', true);
  try {
    data = await store.update(mutate, `${message} (by ${myName()})`);
    toast('Saved · backed up to GitHub ✓');
    render();
    return true;
  } catch (e) {
    console.error(e);
    toast(errorText(e), 'err');
    return false;
  }
}
const findTrip = (d, id) => d.trips.find(t => t.id === id);

/* ---------- photos ---------- */
function blobToB64(blob) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
}
async function prepareImage(file) {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.86));
    return { b64: await blobToB64(blob), ext: 'jpg' };
  } catch {
    if (file.size > 15e6) throw new Error('That photo is too large to upload.');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    return { b64: await blobToB64(file), ext };
  }
}
async function uploadPhotos(tripId, files) {
  const paths = [];
  for (let i = 0; i < files.length; i++) {
    toast(`Uploading photo ${i + 1} of ${files.length}…`, 'busy', true);
    const { b64, ext } = await prepareImage(files[i]);
    const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const path = `photos/${tripId}/${stamp}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
    await store.putFile(path, b64, `Add photo to ${tripId} (by ${myName()})`);
    paths.push(path);
  }
  return paths;
}
const urlCache = new Map();
function photoURL(path) {
  if (!urlCache.has(path)) urlCache.set(path, store.rawFile(path).then(b => URL.createObjectURL(b)));
  return urlCache.get(path);
}
const imgObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  imgObserver.unobserve(e.target); loadImg(e.target);
}), { rootMargin: '300px' }) : null;
async function loadImg(img) {
  try { img.src = await photoURL(img.dataset.path); img.classList.add('ready'); }
  catch { img.classList.add('broken'); img.alt = 'This photo couldn’t load'; }
}
function hydrateImages(root = view) {
  root.querySelectorAll('img[data-path]:not([src])').forEach(img => imgObserver ? imgObserver.observe(img) : loadImg(img));
}
const photoImg = (path, alt = 'Photo', cls = '') => `<img class="${cls}" data-path="${esc(path)}" alt="${esc(alt)}" loading="lazy">`;
function allPhotos(t) {
  const fromEntries = (t.entries || []).flatMap(en => (en.photos || []).map(p => ({ path: p, caption: '', by: en.by, date: en.date, entry: en.id })));
  return [...(t.photos || []), ...fromEntries];
}

/* ---------- connect screen ---------- */
function renderConnect(message = '') {
  $('#topbar').hidden = true;
  view.innerHTML = `
  <section class="connect">
    <div class="connect-book" aria-hidden="true"><span>Our<br>Storybook</span></div>
    <h1>Our Storybook</h1>
    <p class="lead">Every trip we take, written down and kept safe in our private GitHub repo.</p>
    <form id="connectForm" class="connect-form" autocomplete="off">
      <label for="keyInput">Your GitHub key</label>
      <input id="keyInput" type="password" spellcheck="false" autocapitalize="off" placeholder="ghp_…" required>
      <button class="btn" type="submit">Open our storybook</button>
      <p class="form-err" role="alert">${esc(message)}</p>
    </form>
    <details class="help" ${message ? '' : 'open'}>
      <summary>First time? Get your key (2 minutes)</summary>
      <ol>
        <li>Sign in to GitHub on this phone or computer.</li>
        <li>Accept the invitation to <b>TobyYou/our-storybook</b> if you got one by email (the repo’s owner can skip this).</li>
        <li><a href="https://github.com/settings/tokens/new?scopes=repo&description=Our%20Storybook" target="_blank" rel="noopener">Open this page to make a key</a>. The name and the <b>repo</b> box are already filled in.</li>
        <li>Pick an <b>Expiration</b> (No expiration is easiest), scroll to the bottom and tap <b>Generate token</b>.</li>
        <li>Copy the key that starts with <code>ghp_</code> and paste it above.</li>
      </ol>
      <p class="fine">The key stays on this device only. The app uses it to read and save memories in the private repo, nothing else.</p>
    </details>
    <p class="demo-link"><a href="?demo">Peek at a demo first</a></p>
  </section>`;
  $('#connectForm').addEventListener('submit', e => {
    e.preventDefault();
    const key = $('#keyInput').value.trim();
    if (!key) return;
    ls.set(TOKEN_KEY, key);
    location.reload();
  });
}

/* ---------- top bar ---------- */
function renderTopbar() {
  const bar = $('#topbar');
  bar.hidden = false;
  bar.innerHTML = `
    <a class="brand" href="#/">Our Storybook</a>
    <div class="bar-right">
      <button class="chip ${editing ? 'on' : ''}" id="editToggle" type="button" aria-pressed="${editing}">${editing ? 'Done editing' : 'Edit'}</button>
      <button class="chip ghost" id="whoBtn" type="button">${esc(isDemo ? 'Demo' : myName())}</button>
    </div>`;
  $('#editToggle').onclick = () => { editing = !editing; renderTopbar(); render(); };
  $('#whoBtn').onclick = () => openModal(`
    <h2>${isDemo ? 'Demo mode' : `Hi, ${esc(myName())}`}</h2>
    <p>${isDemo ? 'Nothing you add here is saved. Connect with a GitHub key to use the real storybook.' : `Connected as <b>${esc(me.login)}</b>. Every change saves to the private repo <b>${CONFIG.owner}/${CONFIG.repo}</b>, and GitHub keeps the full history.`}</p>
    ${isDemo ? '' : `<p><a href="https://github.com/${CONFIG.owner}/${CONFIG.repo}/commits/${CONFIG.branch}" target="_blank" rel="noopener">See the backup history on GitHub</a></p>`}
    <div class="modal-actions">
      <button class="btn ghost" type="button" data-close>Close</button>
      ${isDemo ? '<a class="btn" href="./">Connect for real</a>' : '<button class="btn danger" type="button" id="signOut">Sign out on this device</button>'}
    </div>`, m => { const so = $('#signOut', m); if (so) so.onclick = () => { ls.del(TOKEN_KEY); location.href = './'; }; });
}

/* ---------- routing ---------- */
function render() {
  const m = location.hash.match(/^#\/trip\/([\w-]+)/);
  const trip = m && data.trips.find(t => t.id === m[1]);
  if (trip) renderTrip(trip); else renderShelf();
  hydrateImages();
}

/* ---------- shelf ---------- */
function renderShelf() {
  const trips = [...data.trips].sort((a, b) => (b.start || '9999').localeCompare(a.start || '9999'));
  view.innerHTML = `
  <section class="shelf">
    <header class="shelf-head">
      <p class="kicker">${esc(data.couple || '')}</p>
      <h1>Our Storybook</h1>
      <p class="sub">${trips.length} ${trips.length === 1 ? 'chapter' : 'chapters'} so far</p>
    </header>
    <div class="books">
      ${trips.map(bookCard).join('')}
      <button class="book new" type="button" data-act="new-trip"><span class="plus">+</span><span class="b-title">New chapter</span><span class="b-place">An invitation for a trip we’re planning, or a record of one we took</span></button>
    </div>
  </section>`;
}
function bookCard(t) {
  const photos = allPhotos(t).length, moments = (t.days || []).reduce((n, d) => n + (d.stops || []).length, 0);
  const cover = t.cover || allPhotos(t)[0]?.path;
  return `
  <a class="book theme-${esc(t.theme)}" href="#/trip/${esc(t.id)}">
    ${cover ? photoImg(cover, '', 'b-photo') : ''}
    <span class="ribbon ${t.status === 'invitation' ? 'inv' : ''}">${t.status === 'invitation' ? 'Invitation' : 'Memories'}</span>
    <span class="b-title">${esc(t.title)}</span>
    <span class="b-place">${esc(t.place)}</span>
    <span class="b-dates">${dateRange(t)}</span>
    <span class="b-count">${moments} moments · ${photos} photos</span>
  </a>`;
}

/* ---------- a trip ---------- */
function renderTrip(t) {
  const sealed = t.status === 'invitation' && !editing && !ls.get('opened-' + t.id);
  view.innerHTML = `
  <article class="trip theme-${esc(t.theme)}">
    <header class="cover">
      <a class="back" href="#/">← All chapters</a>
      <div class="cover-art" aria-hidden="true"><span class="sun"></span></div>
      <p class="kicker">${t.status === 'invitation' ? 'An invitation' : 'A memory'}</p>
      <h1>${esc(t.title)}</h1>
      <p class="sub">${esc(t.place)} · ${dateRange(t)}</p>
      ${editing ? `<div class="tools">
        <button class="chip" data-act="edit-trip">Edit details</button>
        ${t.status === 'invitation' ? '<button class="chip" data-act="to-memory">We went! Make it a memory</button>' : '<button class="chip" data-act="to-invite">Make it an invitation</button>'}
        <button class="chip danger" data-act="delete-trip">Delete chapter</button>
      </div>` : ''}
    </header>
    ${sealed ? sealedHTML(t) : `
      ${letterHTML(t)}
      ${daysHTML(t)}
      ${galleryHTML(t)}
      ${journalHTML(t)}`}
  </article>`;
}
function sealedHTML(t) {
  return `
  <section class="sealed">
    <div class="envelope" id="envelope">
      <div class="env-back"></div><div class="env-paper"><b>Dear ${esc(t.letter?.to || partnerName())},</b><i></i><i></i></div>
      <div class="env-front"></div><div class="env-flap"></div>
      <button class="seal" type="button" data-act="open-invite" aria-label="Open the invitation">✦</button>
    </div>
    <button class="btn" type="button" data-act="open-invite">Open your invitation</button>
  </section>`;
}
function letterHTML(t) {
  const L = t.letter;
  if (!L || !(L.body || []).length) {
    return editing ? `<section class="card letter empty"><button class="btn ghost" data-act="edit-letter">+ Write a letter for this chapter</button></section>` : '';
  }
  return `
  <section class="card letter">
    <p class="dear">Dear ${esc(L.to)},</p>
    ${L.body.map(p => `<p>${esc(p)}</p>`).join('')}
    <p class="signoff">${esc(L.signoff || 'Yours,')}<br><span>${esc(L.from)}</span></p>
    ${editing ? '<button class="chip" data-act="edit-letter">Edit letter</button>' : ''}
  </section>`;
}
function daysHTML(t) {
  const days = t.days || [];
  if (!days.length) {
    return `<section class="story"><div class="story-head"><p class="kicker">The plan</p><h2>Being written</h2></div>
      ${lockHTML('The plan is being written right now. It unlocks soon.')}
      ${editing ? '<p class="center"><button class="chip" data-act="edit-trip">Add dates to start planning days</button></p>' : ''}</section>`;
  }
  const i = Math.min(dayIndex[t.id] ?? 0, days.length - 1);
  const d = days[i];
  const isInvite = t.status === 'invitation';
  return `
  <section class="story">
    <div class="story-head">
      <p class="kicker">${isInvite ? 'The plan' : 'Our storybook'}</p>
      <h2>${isInvite ? 'What we’ll do' : esc(t.storyTitle || t.title)}</h2>
      <p class="flourish" aria-hidden="true">✦ ── ❦ ── ✦</p>
    </div>
    <div class="tabs" role="tablist" aria-label="Days">
      ${days.map((dd, k) => `<button class="tab ${dd.sealed ? 'locked' : ''}" role="tab" aria-selected="${k === i}" data-act="day" data-i="${k}">Day ${NUMBER_WORDS[k] || k + 1}<small>${dd.date ? dayLabel(dd.date) : ''}${dd.sealed ? ' · locked' : ''}</small></button>`).join('')}
    </div>
    <div class="day">
      <div class="day-head"><h3>${d.date ? longDay(d.date) : esc(d.title || '')}</h3>${d.sub ? `<p>${esc(d.sub)}</p>` : ''}
        ${editing ? `<div class="tools"><button class="chip" data-act="edit-day">Edit day title</button><button class="chip" data-act="toggle-lock">${d.sealed ? 'Unlock this day' : 'Lock this day'}</button></div>` : ''}</div>
      ${d.sealed && !editing ? lockHTML('Already planned. Just secret for now.') : `
      <ol class="tl">${(d.stops || []).map(stopHTML).join('') || `<li class="tl-empty">${isInvite ? 'Nothing planned here yet.' : 'No moments written for this day yet.'}</li>`}</ol>
      ${editing ? `<button class="btn ghost add" data-act="add-stop">+ Add a moment to Day ${NUMBER_WORDS[i] || i + 1}</button>` : ''}`}
    </div>
  </section>`;
}
function stopHTML(s) {
  return `
  <li class="stop ${s.big ? 'big' : ''}">
    <span class="ico">${icon(s.icon)}</span>
    ${s.time ? `<div class="time">${esc(s.time)}</div>` : ''}
    <h4>${esc(s.title)}</h4>
    ${s.place ? `<div class="place">${esc(s.place)}</div>` : ''}
    ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}
    ${s.map ? `<a class="map" href="${mapLink(s.map)}" target="_blank" rel="noopener">Open in Maps</a>` : ''}
    ${editing ? `<div class="tools"><button class="chip" data-act="edit-stop" data-id="${esc(s.id)}">Edit</button><button class="chip danger" data-act="del-stop" data-id="${esc(s.id)}">Remove</button></div>` : ''}
  </li>`;
}
function lockHTML(text) {
  return `<button class="lock" type="button" data-act="jiggle">
    <svg viewBox="0 0 80 96" aria-hidden="true"><path d="M20 44 V28 a20 20 0 0 1 40 0 V44" fill="none" stroke="#b8861f" stroke-width="9" stroke-linecap="round"/><rect x="8" y="40" width="64" height="52" rx="14" fill="#e3b23f"/><rect x="8" y="40" width="64" height="14" rx="7" fill="#f2c95a"/><circle cx="40" cy="64" r="7" fill="#6e3b2f"/><rect x="37" y="66" width="6" height="14" rx="3" fill="#6e3b2f"/></svg>
    <span><strong>Locked by magic.</strong><br>${esc(text)}</span></button>`;
}
function galleryHTML(t) {
  const photos = allPhotos(t);
  return `
  <section class="gallery">
    <div class="sec-head"><h2>Gallery</h2><p>${photos.length ? `${photos.length} photo${photos.length === 1 ? '' : 's'}` : 'No photos yet'}</p></div>
    ${photos.length ? `<div class="grid">${photos.map((p, k) => `<button class="ph" type="button" data-act="photo" data-i="${k}">${photoImg(p.path, p.caption || 'Photo')}</button>`).join('')}</div>` : ''}
    <label class="btn add-photos">+ Add photos<input type="file" accept="image/*" multiple id="photoInput"></label>
  </section>`;
}
function journalHTML(t) {
  const entries = [...(t.entries || [])].sort((a, b) => (b.at || b.date || '').localeCompare(a.at || a.date || ''));
  return `
  <section class="journal">
    <div class="sec-head"><h2>Memory notes</h2><p>Little things we don’t want to forget</p></div>
    <button class="btn" type="button" data-act="add-entry">+ Write a memory</button>
    ${entries.map(en => `
      <article class="entry">
        <header><span class="who">${esc(nameOf(en.by))}</span><time>${shortDate(en.date)}</time></header>
        ${en.title ? `<h3>${esc(en.title)}</h3>` : ''}
        ${(en.text || '').split(/\n{2,}/).map(p => `<p>${esc(p)}</p>`).join('')}
        ${(en.photos || []).length ? `<div class="entry-photos">${en.photos.map(p => photoImg(p, 'Memory photo')).join('')}</div>` : ''}
        ${editing ? `<div class="tools"><button class="chip danger" data-act="del-entry" data-id="${esc(en.id)}">Remove</button></div>` : ''}
      </article>`).join('')}
  </section>`;
}

/* ---------- modal ---------- */
function openModal(html, setup) {
  modal.innerHTML = `<div class="modal-inner">${html}</div>`;
  modal.querySelectorAll('[data-close]').forEach(b => b.onclick = () => modal.close());
  if (setup) setup(modal);
  if (!modal.open) modal.showModal();
}
modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });
const field = (id, label, value = '', type = 'text', extra = '') => `<label class="field" for="${id}"><span>${label}</span><input id="${id}" type="${type}" value="${esc(value)}" ${extra}></label>`;
const area = (id, label, value = '', rows = 5, extra = '') => `<label class="field" for="${id}"><span>${label}</span><textarea id="${id}" rows="${rows}" ${extra}>${esc(value)}</textarea></label>`;
const val = id => $('#' + id, modal)?.value.trim() ?? '';

function tripForm(t = {}) {
  const isNew = !t.id;
  openModal(`
    <h2>${isNew ? 'A new chapter' : 'Edit chapter'}</h2>
    <form id="tripForm" class="form">
      ${isNew ? `<fieldset class="choice"><legend>What is it?</legend>
        <label><input type="radio" name="kind" value="invitation" checked><span><b>An invitation</b> for a trip we’re planning</span></label>
        <label><input type="radio" name="kind" value="memory"><span><b>A memory</b> of a trip we took</span></label></fieldset>` : ''}
      ${field('fTitle', 'Title', t.title || '', 'text', 'required placeholder="The San Diego Chapter"')}
      ${field('fPlace', 'Where', t.place || '', 'text', 'placeholder="San Diego, CA"')}
      <div class="row2">${field('fStart', 'First day', t.start || '', 'date')}${field('fEnd', 'Last day', t.end || '', 'date')}</div>
      ${field('fWhen', 'Or describe when (optional)', t.when || '', 'text', 'placeholder="Thanksgiving week"')}
      <label class="field" for="fTheme"><span>Look</span><select id="fTheme">${Object.entries(THEMES).map(([k, v]) => `<option value="${k}" ${t.theme === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <div class="modal-actions"><button class="btn ghost" type="button" data-close>Cancel</button><button class="btn" type="submit">${isNew ? 'Create chapter' : 'Save'}</button></div>
    </form>`, m => {
    $('#tripForm', m).onsubmit = async e => {
      e.preventDefault();
      const info = { title: val('fTitle'), place: val('fPlace'), start: val('fStart'), end: val('fEnd') || val('fStart'), when: val('fWhen'), theme: val('fTheme') };
      if (info.end && info.start && info.end < info.start) [info.start, info.end] = [info.end, info.start];
      modal.close();
      if (isNew) {
        const kind = m.querySelector('input[name=kind]:checked').value;
        const id = (info.title || 'chapter').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) + '-' + uid().slice(-4);
        const trip = {
          id, ...info, status: kind,
          days: datesBetween(info.start, info.end).map(date => ({ date, sub: '', stops: [] })),
          photos: [], entries: [],
          letter: kind === 'invitation' ? { to: partnerName(), body: [`You are invited to ${info.title || 'a new adventure'}${info.place ? ` in ${info.place}` : ''}.`], signoff: 'Yours,', from: myName() } : null,
        };
        editing = true; renderTopbar();
        if (await save(d => { d.trips.push(trip); }, `New chapter: ${info.title}`)) location.hash = `#/trip/${id}`;
      } else {
        await save(d => {
          const tt = findTrip(d, t.id); if (!tt) return;
          const old = tt.days || [];
          Object.assign(tt, info);
          const dates = datesBetween(info.start, info.end);
          if (dates.length) {
            const byDate = Object.fromEntries(old.filter(x => x.date).map(x => [x.date, x]));
            const kept = dates.map(date => byDate[date] || { date, sub: '', stops: [] });
            const orphans = old.filter(x => !x.date || !dates.includes(x.date)).flatMap(x => x.stops || []);
            if (orphans.length) kept[kept.length - 1].stops.push(...orphans);
            tt.days = kept;
          }
        }, `Edit chapter: ${info.title}`);
      }
    };
  });
}
function letterForm(t) {
  const L = t.letter || { to: partnerName(), body: [], signoff: 'Yours,', from: myName() };
  openModal(`
    <h2>The letter</h2>
    <form id="letterForm" class="form">
      ${field('lTo', 'Dear…', L.to)}
      ${area('lBody', 'Letter (leave a blank line between paragraphs)', (L.body || []).join('\n\n'), 9)}
      <div class="row2">${field('lSign', 'Sign-off', L.signoff || 'Yours,')}${field('lFrom', 'From', L.from || myName())}</div>
      <div class="modal-actions"><button class="btn ghost" type="button" data-close>Cancel</button><button class="btn" type="submit">Save letter</button></div>
    </form>`, m => {
    $('#letterForm', m).onsubmit = async e => {
      e.preventDefault();
      const letter = { to: val('lTo'), body: val('lBody').split(/\n\s*\n/).map(s => s.trim()).filter(Boolean), signoff: val('lSign'), from: val('lFrom') };
      modal.close();
      await save(d => { const tt = findTrip(d, t.id); if (tt) tt.letter = letter; }, `Update letter: ${t.title}`);
    };
  });
}
function stopForm(t, dayI, s = null) {
  const days = t.days || [];
  openModal(`
    <h2>${s ? 'Edit moment' : 'Add a moment'}</h2>
    <form id="stopForm" class="form">
      <label class="field" for="sDay"><span>Day</span><select id="sDay">${days.map((d, k) => `<option value="${k}" ${k === dayI ? 'selected' : ''}>Day ${NUMBER_WORDS[k] || k + 1}${d.date ? ' · ' + dayLabel(d.date) : ''}</option>`).join('')}</select></label>
      ${field('sTime', 'When', s?.time || '', 'text', 'placeholder="Morning, 2:00 PM…"')}
      ${field('sTitle', 'Title', s?.title || '', 'text', 'required placeholder="Morning Potion"')}
      ${field('sPlace', 'Place', s?.place || '', 'text', 'placeholder="Café Babu"')}
      ${area('sNote', 'What happened (or what we’ll do)', s?.note || '', 3)}
      <label class="field" for="sIcon"><span>Icon</span><select id="sIcon">${Object.keys(ICONS).map(k => `<option ${s?.icon === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
      <label class="check"><input type="checkbox" id="sMap" ${s?.map || !s ? 'checked' : ''}> Add an “Open in Maps” link for the place</label>
      <label class="check"><input type="checkbox" id="sBig" ${s?.big ? 'checked' : ''}> Make it a highlight</label>
      <div class="modal-actions"><button class="btn ghost" type="button" data-close>Cancel</button><button class="btn" type="submit">${s ? 'Save' : 'Add moment'}</button></div>
    </form>`, m => {
    $('#stopForm', m).onsubmit = async e => {
      e.preventDefault();
      const target = Number(val('sDay'));
      const stop = { id: s?.id || uid(), time: val('sTime'), title: val('sTitle'), place: val('sPlace'), note: val('sNote'), icon: val('sIcon'),
        map: $('#sMap', m).checked && val('sPlace') ? `${val('sPlace')} ${t.place || ''}`.trim() : '', big: $('#sBig', m).checked, by: s?.by || me.login };
      if (s?.map && $('#sMap', m).checked && val('sPlace') === s.place) stop.map = s.map;
      modal.close();
      dayIndex[t.id] = target;
      await save(d => {
        const tt = findTrip(d, t.id); if (!tt) return;
        tt.days.forEach(dd => { dd.stops = (dd.stops || []).filter(x => x.id !== stop.id); });
        const list = tt.days[target].stops;
        if (s) { const at = (t.days[target].stops || []).findIndex(x => x.id === s.id); list.splice(at >= 0 ? at : list.length, 0, stop); }
        else list.push(stop);
      }, `${s ? 'Edit' : 'Add'} moment: ${stop.title}`);
    };
  });
}
function entryForm(t) {
  openModal(`
    <h2>Write a memory</h2>
    <form id="entryForm" class="form">
      ${field('eTitle', 'Title (optional)', '', 'text', 'placeholder="The salsa by the river"')}
      ${area('eText', 'The memory', '', 6, 'required placeholder="What happened, how it felt, what we want to remember…"')}
      ${field('eDate', 'Date', today(), 'date')}
      <label class="field" for="ePhotos"><span>Photos (optional)</span><input id="ePhotos" type="file" accept="image/*" multiple></label>
      <div class="modal-actions"><button class="btn ghost" type="button" data-close>Cancel</button><button class="btn" type="submit">Save memory</button></div>
    </form>`, m => {
    $('#entryForm', m).onsubmit = async e => {
      e.preventDefault();
      const files = [...($('#ePhotos', m).files || [])];
      const entry = { id: uid(), title: val('eTitle'), text: val('eText'), date: val('eDate') || today(), at: new Date().toISOString(), by: me.login, photos: [] };
      modal.close();
      try { entry.photos = files.length ? await uploadPhotos(t.id, files) : []; }
      catch (err) { toast(err.message || errorText(err), 'err'); return; }
      await save(d => { const tt = findTrip(d, t.id); if (tt) (tt.entries ||= []).push(entry); }, `Memory note: ${entry.title || entry.text.slice(0, 40)}`);
    };
  });
}
function photoViewer(t, k) {
  const photos = allPhotos(t);
  const p = photos[k]; if (!p) return;
  openModal(`
    <figure class="viewer">
      ${photoImg(p.path, p.caption || 'Photo', 'big')}
      <figcaption>${p.caption ? `<p class="cap">${esc(p.caption)}</p>` : ''}<p class="meta">Added by ${esc(nameOf(p.by))}${p.date ? ' · ' + shortDate(p.date) : ''}</p></figcaption>
    </figure>
    ${editing && !p.entry ? `<form id="capForm" class="form">${field('pCap', 'Caption', p.caption || '')}<div class="modal-actions">
      <button class="btn danger ghost" type="button" id="pDel">Remove from gallery</button>
      <button class="btn" type="submit">Save caption</button></div></form>` : ''}
    <div class="modal-actions viewer-nav">
      <button class="btn ghost" type="button" id="pPrev" ${k === 0 ? 'disabled' : ''}>←</button>
      <button class="btn ghost" type="button" data-close>Close</button>
      <button class="btn ghost" type="button" id="pNext" ${k >= photos.length - 1 ? 'disabled' : ''}>→</button>
    </div>`, m => {
    hydrateImages(m);
    $('#pPrev', m).onclick = () => photoViewer(t, k - 1);
    $('#pNext', m).onclick = () => photoViewer(t, k + 1);
    const cf = $('#capForm', m);
    if (cf) {
      cf.onsubmit = async e => { e.preventDefault(); const cap = val('pCap'); modal.close();
        await save(d => { const ph = findTrip(d, t.id)?.photos?.find(x => x.path === p.path); if (ph) ph.caption = cap; }, `Caption a photo in ${t.title}`); };
      $('#pDel', m).onclick = async () => { modal.close();
        await save(d => { const tt = findTrip(d, t.id); if (tt) tt.photos = tt.photos.filter(x => x.path !== p.path); }, `Remove a photo from ${t.title}`); };
    }
  });
}
function confirmBox(title, text, okLabel, onOk) {
  openModal(`<h2>${esc(title)}</h2><p>${esc(text)}</p><div class="modal-actions"><button class="btn ghost" type="button" data-close>Keep it</button><button class="btn danger" type="button" id="okBtn">${esc(okLabel)}</button></div>`,
    m => { $('#okBtn', m).onclick = () => { modal.close(); onOk(); }; });
}

/* ---------- actions ---------- */
view.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act;
  if (act === 'new-trip') return tripForm();
  const m = location.hash.match(/^#\/trip\/([\w-]+)/);
  const t = m && data.trips.find(x => x.id === m[1]); if (!t) return;
  const di = Math.min(dayIndex[t.id] ?? 0, Math.max(0, (t.days || []).length - 1));
  switch (act) {
    case 'day': dayIndex[t.id] = Number(b.dataset.i); render(); break;
    case 'open-invite': {
      const env = $('#envelope'); env?.classList.add('open');
      setTimeout(() => { ls.set('opened-' + t.id, '1'); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1100);
      break;
    }
    case 'jiggle': b.classList.remove('jiggle'); void b.offsetWidth; b.classList.add('jiggle'); break;
    case 'edit-trip': tripForm(t); break;
    case 'edit-letter': letterForm(t); break;
    case 'add-stop': stopForm(t, di); break;
    case 'edit-stop': { const s = t.days.flatMap(d => d.stops || []).find(x => x.id === b.dataset.id); const at = t.days.findIndex(d => (d.stops || []).some(x => x.id === b.dataset.id)); if (s) stopForm(t, at, s); break; }
    case 'del-stop': confirmBox('Remove this moment?', 'It stays in the GitHub history if you ever want it back.', 'Remove', () =>
      save(d => { findTrip(d, t.id)?.days.forEach(dd => { dd.stops = (dd.stops || []).filter(x => x.id !== b.dataset.id); }); }, `Remove a moment from ${t.title}`)); break;
    case 'edit-day': openModal(`<h2>Day ${NUMBER_WORDS[di] || di + 1}</h2><form id="dayForm" class="form">${field('dSub', 'A line for this day', t.days[di].sub || '', 'text', 'placeholder="Matcha, our first cowboy hats, and a night of real magic."')}<div class="modal-actions"><button class="btn ghost" type="button" data-close>Cancel</button><button class="btn" type="submit">Save</button></div></form>`,
      mm => { $('#dayForm', mm).onsubmit = async ev => { ev.preventDefault(); const sub = val('dSub'); modal.close(); await save(d => { const tt = findTrip(d, t.id); if (tt) tt.days[di].sub = sub; }, `Edit day line in ${t.title}`); }; }); break;
    case 'toggle-lock': save(d => { const dd = findTrip(d, t.id)?.days[di]; if (dd) dd.sealed = !dd.sealed; }, `${t.days[di].sealed ? 'Unlock' : 'Lock'} a day in ${t.title}`); break;
    case 'to-memory': save(d => { const tt = findTrip(d, t.id); if (tt) { tt.status = 'memory'; (tt.days || []).forEach(dd => { dd.sealed = false; }); } }, `Turn ${t.title} into memories`); break;
    case 'to-invite': save(d => { const tt = findTrip(d, t.id); if (tt) tt.status = 'invitation'; }, `Turn ${t.title} into an invitation`); break;
    case 'delete-trip': confirmBox(`Delete “${t.title}”?`, 'It disappears from the storybook. Its photos and text stay in the GitHub history.', 'Delete chapter', async () => {
      if (await save(d => { d.trips = d.trips.filter(x => x.id !== t.id); }, `Delete chapter: ${t.title}`)) location.hash = '#/'; }); break;
    case 'add-entry': entryForm(t); break;
    case 'del-entry': confirmBox('Remove this memory note?', 'It stays in the GitHub history if you ever want it back.', 'Remove', () =>
      save(d => { const tt = findTrip(d, t.id); if (tt) tt.entries = tt.entries.filter(x => x.id !== b.dataset.id); }, `Remove a memory note from ${t.title}`)); break;
    case 'photo': photoViewer(t, Number(b.dataset.i)); break;
  }
});
view.addEventListener('change', async e => {
  if (e.target.id !== 'photoInput') return;
  const files = [...e.target.files]; e.target.value = '';
  const m = location.hash.match(/^#\/trip\/([\w-]+)/); if (!m || !files.length) return;
  const tid = m[1];
  try {
    const paths = await uploadPhotos(tid, files);
    await save(d => { const tt = findTrip(d, tid); if (tt) (tt.photos ||= []).push(...paths.map(path => ({ path, caption: '', by: me.login, date: today() }))); }, `Add ${paths.length} photo${paths.length === 1 ? '' : 's'}`);
  } catch (err) { console.error(err); toast(err.message && !err.status ? err.message : errorText(err), 'err'); }
});

/* ---------- start ---------- */
const DEMO_SEED = {
  version: 1, couple: 'You & Me', people: { demo: 'You' },
  trips: [{
    id: 'demo-lake', title: 'A Weekend by the Lake', place: 'Somewhere lovely', start: '2026-06-12', end: '2026-06-13', theme: 'garden', status: 'memory',
    letter: { to: 'You', body: ['This is a demo chapter. Add moments, photos and memory notes to see how it works. Nothing here is saved.'], signoff: 'Yours,', from: 'Me' },
    days: [
      { date: '2026-06-12', sub: 'Coffee, a long walk, and sunset.', stops: [{ id: 'a', time: 'Morning', title: 'Morning Potion', place: 'A little café', note: 'The first coffee of the trip.', icon: 'coffee' }] },
      { date: '2026-06-13', sub: '', stops: [] },
    ],
    photos: [], entries: [],
  }, { id: 'demo-next', title: 'The Next Chapter', place: 'Somewhere sunny', when: 'Coming soon', theme: 'beach', status: 'invitation', days: [], photos: [], entries: [],
    letter: { to: 'You', body: ['You are invited to the next adventure.'], signoff: 'Yours,', from: 'Me' } }],
};

async function boot() {
  if (isDemo) { store = new DemoStore(DEMO_SEED); me = { login: 'demo' }; }
  else {
    const key = ls.get(TOKEN_KEY);
    if (!key) return renderConnect();
    store = new GitHubStore({ token: key, ...CONFIG });
    try { me = await store.whoami(); }
    catch (e) { return renderConnect(e.status === 401 ? 'That key didn’t work. Make a new one and paste it again.' : 'Couldn’t reach GitHub. Check your connection and try again.'); }
  }
  view.innerHTML = '<p class="loading">Opening the storybook…</p>';
  try { ({ data } = await store.load()); }
  catch (e) {
    if (!isDemo && (e.status === 404 || e.status === 403)) return renderConnect('This key can’t open the storybook yet. If you were invited, accept the invitation on GitHub first, then try again.');
    return renderConnect(errorText(e));
  }
  renderTopbar();
  render();
  addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
}
boot();

// Exposed for testing only.
window.__storybook = { get data() { return data; }, uploadPhotos, save, textToB64 };
