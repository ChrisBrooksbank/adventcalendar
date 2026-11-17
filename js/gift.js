// Make it a gift: a giver writes a note behind any of the 24 doors, and the whole calendar travels in the link's #hash.
// The hash never reaches a server, so the notes stay between the giver and whoever they send the link to.
const MAX_NOTE = 280, MAX_NAME = 40;

const b64u = {
  enc: (bytes) => { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
  dec: (str) => { const s = atob(str.replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(s, (c) => c.charCodeAt(0)); },
};
async function pipe(bytes, stream) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()); }

const clean = (s, n) => String(s ?? '').replace(/\s+$/g, '').slice(0, n);
export function normalise(g) {
  const notes = Array.from({ length: 24 }, (_, i) => clean(g?.notes?.[i], MAX_NOTE));
  return { to: clean(g?.to, MAX_NAME).trim(), from: clean(g?.from, MAX_NAME).trim(), notes };
}

// v1: '1' + base64url(deflate-raw(JSON)); trailing empty notes are trimmed to keep links short
export async function encodeGift(g) {
  const { to, from, notes } = normalise(g); let last = notes.length; while (last && !notes[last - 1]) last--;
  const bytes = new TextEncoder().encode(JSON.stringify({ to, from, notes: notes.slice(0, last) }));
  return '1' + b64u.enc(await pipe(bytes, new CompressionStream('deflate-raw')));
}
export async function decodeGift(code) {
  if (!code || code[0] !== '1') return null;
  try { return normalise(JSON.parse(new TextDecoder().decode(await pipe(b64u.dec(code.slice(1)), new DecompressionStream('deflate-raw'))))); } catch { return null; }
}

// a short, stable fingerprint of a gift, so each gift link keeps its own progress
export function giftId(code) { let h = 2166136261; for (let i = 0; i < code.length; i++) { h ^= code.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

export async function readGift(hash = location.hash) {
  const m = hash.match(/[#&]gift=([\w-]+)/); if (!m) return null;
  const g = await decodeGift(m[1]); return g && { ...g, id: giftId(m[1]) };
}

// ---------- the giver's workshop ----------
export function giftMaker({ onOpen, onClose, preset } = {}) {
  const el = document.createElement('div'); el.id = 'gift'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'gift-h'); el.hidden = true;
  el.innerHTML = `<form class="gift-card" novalidate>
    <button type="button" class="gift-x" aria-label="Close">×</button>
    <h2 id="gift-h">Make it a gift</h2>
    <p class="gift-lede">Write a little note behind any door. Each one stays hidden until its day in December, and appears beside that door’s world when it opens. Leave a door blank and it simply keeps its usual story.</p>
    <div class="gift-names">
      <label>For <input name="to" maxlength="${MAX_NAME}" placeholder="Mia" autocomplete="off"></label>
      <label>Signed <input name="from" maxlength="${MAX_NAME}" placeholder="Love, Grandma" autocomplete="off"></label>
    </div>
    <ol class="gift-notes">${Array.from({ length: 24 }, (_, i) => `<li><label><span>Door ${i + 1}</span><textarea name="n${i + 1}" rows="2" maxlength="${MAX_NOTE}" placeholder="${i === 23 ? 'Christmas Eve…' : ''}"></textarea></label></li>`).join('')}</ol>
    <div class="gift-foot">
    <div class="gift-out" hidden>
      <label>Your gift link <input name="link" readonly></label>
      <p class="gift-hint">Send this link to them. It works best on a phone or computer with a modern browser. Your notes live only in the link, so keep a copy. <a class="gift-try" target="_blank" rel="noopener">Try it as Christmas Eve ↗</a></p>
    </div>
    <div class="gift-row"><button type="submit" class="pill">🎁 Create the gift link</button><button type="button" class="pill gift-copy" hidden>Copy link</button></div></div>
  </form>`;
  document.body.appendChild(el);
  const f = el.querySelector('form'), out = el.querySelector('.gift-out'), copy = el.querySelector('.gift-copy'), link = f.elements.link, tryIt = el.querySelector('.gift-try');
  if (preset) { f.elements.to.value = preset.to; f.elements.from.value = preset.from; preset.notes.forEach((t, i) => { f.elements['n' + (i + 1)].value = t; }); }
  let last = null;
  const close = () => { if (el.hidden) return; el.hidden = true; document.body.classList.remove('gifting'); last?.focus?.(); onClose?.(); };
  const open = () => { last = document.activeElement; el.hidden = false; document.body.classList.add('gifting'); f.elements.to.focus(); onOpen?.(); };
  f.addEventListener('input', () => { out.hidden = true; copy.hidden = true; });
  f.onsubmit = async (e) => {
    e.preventDefault();
    const g = { to: f.elements.to.value, from: f.elements.from.value, notes: Array.from({ length: 24 }, (_, i) => f.elements['n' + (i + 1)].value) };
    if (!g.notes.some((t) => t.trim())) { f.elements.n1.focus(); f.elements.n1.placeholder = 'Write at least one note…'; return; }
    const base = location.origin + location.pathname, code = await encodeGift(g);
    link.value = `${base}#gift=${code}`; tryIt.href = `${base}?date=${new Date().getFullYear()}-12-24#gift=${code}`;
    out.hidden = false; copy.hidden = !navigator.clipboard; link.select();
  };
  copy.onclick = async () => { try { await navigator.clipboard.writeText(link.value); copy.textContent = 'Copied ✓'; setTimeout(() => { copy.textContent = 'Copy link'; }, 1800); } catch { link.select(); } };
  el.querySelector('.gift-x').onclick = close;
  el.addEventListener('click', (e) => { if (e.target === el) close(); });
  el.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') close(); });
  return { open, close, get isOpen() { return !el.hidden; } };
}
