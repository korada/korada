import React, { useState, useEffect, useRef } from 'react';
import '../assets/css/CradleCeremony.scss';

// Paste the /exec URL of the deployed google-apps-script/CradleCode.gs web app here.
const GAS_URL = 'https://script.google.com/macros/s/AKfycbysOgu-cpcx856oOCqT4RkEGdZ4RSFk_9md-EVvPpWj3W7JE7y4JFX-xJ5kHtWF_K-h/exec';
const GAS_CONFIGURED = GAS_URL.indexOf('https://') === 0;
const STORAGE_KEY = 'anagha_cradle_rsvp_v1';

// Event details. Leave a field empty to hide it; an empty date shows "Date to be announced".
// Keep these in sync with the EVENT_* constants in google-apps-script/CradleCode.gs.
const EVENT = {
  date: 'Sunday, November 22, 2026',
  time: '11:30 AM',
  venueName: 'Our residence',
  venueAddress: '9021 Drivers Way Apt 1301, Charlotte, NC 28262',
  dressCode: '',
  rsvpBy: '',
};

const HOSTS = 'Sravya & Venkata Aditya';
const CONTACT_EMAIL = 'venkata@korada.in';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function dlog(msg, obj) {
  try { console.log('[Cradle RSVP] ' + msg, obj !== undefined ? obj : ''); } catch (e) {}
}

function getSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
  catch (e) { return null; }
}
function saveLocal(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
}
function clearLocal() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

// JSONP reads data back from Apps Script across origins (a no-cors POST can't).
function jsonp(params, cb) {
  if (!GAS_CONFIGURED) { setTimeout(() => cb(null), 0); return; }
  const fn = 'jsonp_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
  const script = document.createElement('script');
  let done = false;
  const finish = (res) => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    delete window[fn];
    if (script.parentNode) script.parentNode.removeChild(script);
    cb(res);
  };
  const timer = setTimeout(() => finish(null), 12000);
  window[fn] = (res) => finish(res);
  script.onerror = () => finish(null);
  let qs = 'callback=' + fn;
  Object.keys(params).forEach((k) => { qs += '&' + k + '=' + encodeURIComponent(params[k]); });
  script.src = GAS_URL + '?' + qs;
  document.body.appendChild(script);
}

function partyText(d) {
  const a = d.adults || '1';
  let s = `${a} adult${a === '1' ? '' : 's'}`;
  if (d.children && d.children !== '0') {
    s += `, ${d.children} child${d.children === '1' ? '' : 'ren'}`;
  }
  return s;
}

function burstPetals() {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('div');
  c.className = 'cc-confetti';
  for (let i = 0; i < 40; i++) {
    const s = document.createElement('span');
    s.className = 'cc-petal-' + (i % 3);
    s.style.left = `${Math.random() * 100}%`;
    s.style.animationDelay = `${Math.random() * 0.5}s`;
    s.style.animationDuration = `${2.4 + Math.random() * 1.8}s`;
    c.appendChild(s);
  }
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 5000);
}

// Mango-leaf thoranam strung across the top of the page.
function Toran() {
  return (
    <svg className="cc-toran" width="100%" height="58" aria-hidden="true">
      <defs>
        <pattern id="cc-toran-tile" width="40" height="58" patternUnits="userSpaceOnUse">
          <rect x="0" y="3" width="40" height="3" fill="#6B3A1E" />
          <path d="M20 6 C9 19 10 39 20 54 C30 39 31 19 20 6 Z" fill="#1F6B3A" />
          <path d="M20 9 V50" stroke="#58A36B" strokeWidth="1.2" />
          <circle cx="0" cy="9" r="7" fill="#F08A1C" />
          <circle cx="40" cy="9" r="7" fill="#F08A1C" />
          <circle cx="0" cy="9" r="3" fill="#F2B11B" />
          <circle cx="40" cy="9" r="3" fill="#F2B11B" />
        </pattern>
      </defs>
      <rect width="100%" height="58" fill="url(#cc-toran-tile)" />
    </svg>
  );
}

function Diya({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path className="cc-flame" d="M0 -18 C6 -9 5 -3 0 -1 C-5 -3 -6 -9 0 -18 Z" fill="#FFB52E" />
      <path d="M-15 0 Q0 15 15 0 Z" fill="#A9541C" />
      <path d="M-15 0 H15" stroke="#C99A2E" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

// Illustrated baby in a pattu langa, seated in a swinging uyyala.
function CradleArt() {
  return (
    <svg
      className="cc-art"
      viewBox="0 0 400 400"
      role="img"
      aria-label="Illustration of a smiling baby in a silk pattu langa, sitting in a swinging cradle"
    >
      <defs>
        <linearGradient id="cc-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8A4B22" />
          <stop offset="1" stopColor="#5E2F14" />
        </linearGradient>
        <linearGradient id="cc-silk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#C5184A" />
          <stop offset="1" stopColor="#8E1230" />
        </linearGradient>
      </defs>

      <circle cx="200" cy="212" r="168" fill="#FBE4A6" />
      <circle cx="200" cy="212" r="180" fill="none" stroke="#8E1230" strokeWidth="3.5"
        strokeLinecap="round" strokeDasharray="0.1 11" />

      {/* Stand */}
      <rect x="44" y="52" width="14" height="320" rx="5" fill="url(#cc-wood)" />
      <rect x="342" y="52" width="14" height="320" rx="5" fill="url(#cc-wood)" />
      <rect x="24" y="366" width="54" height="12" rx="6" fill="#5E2F14" />
      <rect x="322" y="366" width="54" height="12" rx="6" fill="#5E2F14" />
      <rect x="30" y="40" width="340" height="16" rx="8" fill="url(#cc-wood)" />
      <circle cx="30" cy="48" r="10" fill="#C99A2E" />
      <circle cx="370" cy="48" r="10" fill="#C99A2E" />
      <rect x="42" y="120" width="18" height="6" rx="3" fill="#C99A2E" />
      <rect x="340" y="120" width="18" height="6" rx="3" fill="#C99A2E" />
      <rect x="42" y="300" width="18" height="6" rx="3" fill="#C99A2E" />
      <rect x="340" y="300" width="18" height="6" rx="3" fill="#C99A2E" />

      {/* Marigold garland */}
      <path d="M58 60 Q200 118 342 60" fill="none" stroke="#F08A1C" strokeWidth="10"
        strokeLinecap="round" strokeDasharray="0.1 12" />
      <path d="M64 61 Q200 112 336 61" fill="none" stroke="#F2B11B" strokeWidth="5"
        strokeLinecap="round" strokeDasharray="0.1 12" />

      <Diya x={104} y={380} />
      <Diya x={296} y={380} />

      <g className="cc-swing">
        <path d="M128 56 L116 244 M272 56 L284 244" stroke="#C99A2E" strokeWidth="3.5"
          strokeDasharray="7 3" fill="none" />

        {/* Cradle back and side posts */}
        <rect x="114" y="250" width="172" height="52" fill="#4A230E" />
        <path d="M114 250 Q135 236 157 250 Q178 236 200 250 Q222 236 243 250 Q265 236 286 250 Z" fill="#6B3A1E" />
        <rect x="103" y="238" width="14" height="72" rx="6" fill="url(#cc-wood)" />
        <rect x="283" y="238" width="14" height="72" rx="6" fill="url(#cc-wood)" />
        <circle cx="110" cy="236" r="8" fill="#C99A2E" />
        <circle cx="290" cy="236" r="8" fill="#C99A2E" />
        <ellipse cx="200" cy="300" rx="86" ry="9" fill="#FFF8E8" />

        {/* Baby */}
        <g>
          <path d="M168 262 H232 Q264 276 278 300 Q200 310 122 300 Q136 276 168 262 Z" fill="#D9A62E" />
          <path d="M168 262 H232 Q258 274 268 290 Q200 299 132 290 Q142 274 168 262 Z" fill="url(#cc-silk)" />
          <path d="M184 266 L170 293 M200 266 V296 M216 266 L230 293" stroke="#5E0B1F"
            strokeWidth="1.4" opacity="0.45" />
          <g fill="#F2B11B">
            <circle cx="158" cy="282" r="2" /><circle cx="178" cy="278" r="2" />
            <circle cx="191" cy="287" r="2" /><circle cx="209" cy="287" r="2" />
            <circle cx="222" cy="278" r="2" /><circle cx="242" cy="282" r="2" />
          </g>
          <path d="M128 296 Q200 305 272 296" fill="none" stroke="#8E1230" strokeWidth="3"
            strokeLinecap="round" strokeDasharray="0.1 8" />
          <ellipse cx="186" cy="303" rx="8" ry="4.5" fill="#F3C8A0" />
          <ellipse cx="214" cy="303" rx="8" ry="4.5" fill="#F3C8A0" />

          <path d="M178 220 Q200 230 222 220 L232 262 H168 Z" fill="#17703F" />
          <path d="M183 222 Q200 233 217 222" fill="none" stroke="#D9A62E" strokeWidth="3" strokeLinecap="round" />
          <path d="M187 227 Q200 246 213 227" fill="none" stroke="#D9A62E" strokeWidth="2" />
          <circle cx="200" cy="239" r="3.5" fill="#C2152E" stroke="#D9A62E" strokeWidth="1.5" />
          <rect x="167" y="256" width="66" height="8" rx="4" fill="#D9A62E" />
          <circle cx="200" cy="260" r="4" fill="#C2152E" />

          <g>
            <path d="M226 231 L246 256" stroke="#F3C8A0" strokeWidth="12" strokeLinecap="round" />
            <circle cx="247" cy="258" r="6.5" fill="#F3C8A0" />
            <path d="M224 228 L231 237" stroke="#17703F" strokeWidth="14" strokeLinecap="round" />
            <path d="M228 242 L238 236" stroke="#D9A62E" strokeWidth="2.5" strokeLinecap="round" />
          </g>
          <g className="cc-wave">
            <path d="M174 231 L151 207" stroke="#F3C8A0" strokeWidth="12" strokeLinecap="round" />
            <circle cx="150" cy="205" r="6.5" fill="#F3C8A0" />
            <path d="M176 228 L167 219" stroke="#17703F" strokeWidth="14" strokeLinecap="round" />
            <path d="M160 222 L170 212" stroke="#D9A62E" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          <circle cx="164" cy="190" r="6" fill="#F3C8A0" />
          <circle cx="236" cy="190" r="6" fill="#F3C8A0" />
          <circle cx="164" cy="198" r="3" fill="#D9A62E" />
          <circle cx="236" cy="198" r="3" fill="#D9A62E" />
          <circle cx="200" cy="186" r="36" fill="#F3C8A0" />
          <circle cx="200" cy="141" r="9" fill="#2B1A14" />
          <path d="M165 181 C162 151 185 143 200 143 C215 143 238 151 235 181 C228 165 215 159 200 159 C185 159 172 165 165 181 Z" fill="#2B1A14" />
          <path d="M192 147 Q200 153 208 147" fill="none" stroke="#FFF8E8" strokeWidth="4"
            strokeLinecap="round" strokeDasharray="0.1 5.3" />
          <path d="M200 150 V161" stroke="#D9A62E" strokeWidth="1.5" />
          <circle cx="200" cy="163" r="3.5" fill="#D9A62E" />
          <circle cx="200" cy="163" r="1.4" fill="#C2152E" />
          <circle cx="200" cy="173" r="3" fill="#C2152E" />
          <path d="M181 179 Q187 175 193 179 M207 179 Q213 175 219 179" fill="none"
            stroke="#2B1A14" strokeWidth="1.6" strokeLinecap="round" />
          <g className="cc-eyes">
            <ellipse cx="187" cy="189" rx="4" ry="5" fill="#2B1A14" />
            <ellipse cx="213" cy="189" rx="4" ry="5" fill="#2B1A14" />
            <circle cx="188.4" cy="187" r="1.3" fill="#fff" />
            <circle cx="214.4" cy="187" r="1.3" fill="#fff" />
          </g>
          <circle cx="176" cy="201" r="6" fill="#F0907F" opacity="0.55" />
          <circle cx="224" cy="201" r="6" fill="#F0907F" opacity="0.55" />
          <circle cx="220" cy="209" r="1.8" fill="#2B1A14" />
          <path d="M191 202 Q200 212 209 202" fill="none" stroke="#A33A3A" strokeWidth="2.2" strokeLinecap="round" />
        </g>

        {/* Cradle base */}
        <path d="M100 304 H300 Q296 336 262 340 H138 Q104 336 100 304 Z" fill="url(#cc-wood)" />
        <rect x="100" y="300" width="200" height="8" rx="4" fill="#C99A2E" />
        <path d="M124 322 H276" stroke="#C99A2E" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.1 9" />
        <path d="M150 340 V348 M200 340 V352 M250 340 V348" stroke="#C99A2E" strokeWidth="1.5" />
        <circle cx="150" cy="351" r="4" fill="#C99A2E" />
        <circle cx="200" cy="355" r="4" fill="#C99A2E" />
        <circle cx="250" cy="351" r="4" fill="#C99A2E" />
      </g>
    </svg>
  );
}

export default function CradleCeremony() {
  // view: 'form' | 'banner' | 'thanks' | 'removed'   status: 'idle' | 'submitting' | 'error'
  const [view, setView] = useState('form');
  const [status, setStatus] = useState('idle');
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(null);
  const [wasUpdate, setWasUpdate] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupStatus, setLookupStatus] = useState(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [errors, setErrors] = useState({});
  const [verifying, setVerifying] = useState(false);
  const lookupRef = useRef(null);
  const formRef = useRef(null);

  // A saved RSVP is re-checked against the sheet; if the backend can't be
  // reached, the local copy is trusted.
  useEffect(() => {
    const s = getSaved();
    if (!s || !s.email) return;
    setVerifying(true);
    jsonp({ email: s.email }, (res) => {
      setVerifying(false);
      if (res && res.success && res.found === false) {
        clearLocal();
      } else if (res && res.success && res.found && res.rsvp) {
        saveLocal(res.rsvp);
        setSaved(res.rsvp);
        setView('banner');
      } else {
        setSaved(s);
        setView('banner');
      }
    });
  }, []);

  function prefill(d) {
    const f = formRef.current;
    if (!f || !d) return;
    f.name.value = d.name || '';
    f.email.value = d.email || '';
    f.phone.value = d.phone || '';
    f.adults.value = d.adults || '1';
    f.children.value = d.children || '0';
    f.message.value = d.message || '';
  }

  function startEdit() {
    setView('form');
    setEditing(true);
    setStatus('idle');
    setConfirmRemove(false);
    setTimeout(() => prefill(getSaved()), 0);
  }

  function cancelEdit() {
    setEditing(false);
    if (saved) setView('banner');
  }

  function handleRemove() {
    const current = getSaved();
    if (!current || !current.email) return;
    setStatus('submitting');
    jsonp({ action: 'cancel', email: current.email, name: current.name || '' }, (res) => {
      if (!res || !res.success) dlog('Remove failed on the backend; cleared locally', res);
      clearLocal();
      setSaved(null);
      setStatus('idle');
      setConfirmRemove(false);
      setView('removed');
    });
  }

  function handleLookup() {
    const email = (lookupRef.current && lookupRef.current.value.trim()) || '';
    if (!email) { setLookupStatus({ kind: 'error', msg: 'Enter your email address.' }); return; }
    if (!EMAIL_RE.test(email)) { setLookupStatus({ kind: 'error', msg: 'Enter a valid email address, like you@example.com.' }); return; }
    setLookupBusy(true);
    setLookupStatus({ kind: '', msg: 'Looking up your RSVP…' });
    jsonp({ email }, (res) => {
      setLookupBusy(false);
      if (res && res.success && res.found && res.rsvp) {
        setLookupStatus(null);
        saveLocal(res.rsvp);
        setSaved(res.rsvp);
        setView('banner');
      } else if (res && res.success && res.found === false) {
        setLookupStatus({ kind: 'error', msg: 'No RSVP found for that email. Check the spelling, or send a new RSVP below.' });
      } else {
        setLookupStatus({ kind: 'error', msg: "Couldn't reach the RSVP list. Try again in a moment." });
      }
    });
  }

  function validate(name, email, phone) {
    const errs = {};
    if (!name) errs.name = 'Enter your full name.';
    if (!email) errs.email = 'Enter your email address.';
    else if (!EMAIL_RE.test(email)) errs.email = 'Enter a valid email address, like you@example.com.';
    if (phone && !/^[\d\s().+\-]{7,15}$/.test(phone)) errs.phone = 'Enter a valid phone number.';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const errs = validate(name, email, phone);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    const prior = getSaved();
    const isUpdate = !!(prior && prior.email);
    const data = {
      name,
      email,
      phone,
      adults: form.adults.value,
      children: form.children.value,
      message: form.message.value.trim(),
    };

    setStatus('submitting');

    const finish = () => {
      saveLocal(data);
      setSaved(data);
      setWasUpdate(isUpdate);
      setEditing(false);
      setStatus('idle');
      setView('thanks');
      burstPetals();
      // The POST is opaque, so confirm the row landed with a readable lookup.
      jsonp({ email: data.email }, (res) => dlog('Verify after submit', res));
    };

    if (!GAS_CONFIGURED) {
      dlog('GAS_URL is not configured; RSVP saved in this browser only');
      finish();
      return;
    }

    fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data),
    })
      .then(finish)
      .catch((err) => {
        dlog('POST failed: ' + err);
        setStatus('error');
      });
  }

  const mapsUrl = EVENT.venueAddress
    ? 'https://maps.google.com/?q=' + encodeURIComponent(EVENT.venueAddress)
    : '';
  const firstName = saved && saved.name ? saved.name.split(' ')[0] : '';

  return (
    <div className="cc-page">
      <Toran />

      <header className="cc-header">
        <h1 className="cc-title" lang="te">బారసాల</h1>
        <p className="cc-subtitle">Cradle Ceremony</p>
        <p className="cc-name">Anagha Saraswika</p>
      </header>

      <div className="cc-art-wrap">
        <CradleArt />
      </div>

      <section className="cc-event" aria-label="Event details">
        <div className="cc-zari" />
        <div className="cc-event-body">
          <p className="cc-event-te">You are invited</p>
          <p className="cc-date">{EVENT.date || 'Date to be announced'}</p>
          {EVENT.date && EVENT.time && <p className="cc-time">{EVENT.time}</p>}
          {EVENT.venueName && <p className="cc-venue-name">{EVENT.venueName}</p>}
          {EVENT.venueAddress && <p className="cc-venue-addr">{EVENT.venueAddress}</p>}
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="cc-maps-link">
              Open in Maps
            </a>
          )}
          {EVENT.dressCode && <p className="cc-dress">Dress code: {EVENT.dressCode}</p>}
          <p className="cc-dress">Please join us for a vegetarian lunch after the ceremony.</p>
          <p className="cc-event-line">
            Join us as we name our little one, lay the baby in the cradle for the first time, and ask for your blessings.
          </p>
        </div>
        <div className="cc-zari cc-zari-flip" />
      </section>

      <section className="cc-rsvp-card" id="rsvp">
        <h2 className="cc-rsvp-title">Will you join us?</h2>
        <p className="cc-rsvp-sub">
          {EVENT.rsvpBy ? `Please reply by ${EVENT.rsvpBy}.` : 'Let us know so we can plan for you.'}
        </p>

        {verifying && (
          <div className="cc-verifying">
            <div className="cc-spinner" />
            <p>Checking your RSVP…</p>
          </div>
        )}

        {!verifying && view === 'banner' && saved && (
          <div className="cc-already">
            <h3 className="cc-state-title">You're on the list{firstName ? `, ${firstName}` : ''}</h3>
            <p className="cc-state-text">We have your RSVP and can't wait to see you.</p>
            <dl className="cc-summary">
              <div><dt>Name</dt><dd>{saved.name}</dd></div>
              <div><dt>Email</dt><dd>{saved.email}</dd></div>
              <div><dt>Attending</dt><dd>{partyText(saved)}</dd></div>
              {saved.message && <div><dt>Blessings</dt><dd>{saved.message}</dd></div>}
            </dl>
            {confirmRemove ? (
              <div className="cc-confirm">
                <p>Remove your RSVP? We'll take you off the guest list.</p>
                <button type="button" className="cc-btn-outline" onClick={() => setConfirmRemove(false)} disabled={status === 'submitting'}>
                  Keep my RSVP
                </button>
                <button type="button" className="cc-btn-danger" onClick={handleRemove} disabled={status === 'submitting'}>
                  {status === 'submitting' ? 'Removing…' : 'Remove my RSVP'}
                </button>
              </div>
            ) : (
              <>
                <button type="button" className="cc-btn-outline" onClick={startEdit}>Edit my RSVP</button>
                <button type="button" className="cc-link-btn cc-remove" onClick={() => setConfirmRemove(true)}>
                  Remove my RSVP
                </button>
              </>
            )}
          </div>
        )}

        {view === 'thanks' && (
          <div className="cc-thankyou">
            <h3 className="cc-state-title">{wasUpdate ? 'Your RSVP is updated' : 'Your RSVP is in'}</h3>
            <p className="cc-state-text">
              {wasUpdate
                ? 'We have your changes. See you at the cradle ceremony.'
                : 'Thank you. We are so happy you will be there to bless Anagha Saraswika.'}
            </p>
            <p className="cc-state-foot">
              {GAS_CONFIGURED && 'A confirmation is on its way to your email. '}
              Need to change something?{' '}
              <button type="button" className="cc-link-btn" onClick={startEdit}>Edit my RSVP</button>
            </p>
          </div>
        )}

        {view === 'removed' && (
          <div className="cc-thankyou">
            <h3 className="cc-state-title">Your RSVP is removed</h3>
            <p className="cc-state-text">We'll miss you. If your plans change, you're always welcome.</p>
            <p className="cc-state-foot">
              <button
                type="button"
                className="cc-link-btn"
                onClick={() => { setView('form'); setEditing(false); setLookupOpen(false); setLookupStatus(null); }}
              >
                RSVP again
              </button>
            </p>
          </div>
        )}

        {!verifying && view === 'form' && !editing && (
          <div className="cc-lookup">
            <p>
              Already replied on another device?{' '}
              <button type="button" className="cc-link-btn" onClick={() => setLookupOpen((o) => !o)}>
                Find my RSVP
              </button>
            </p>
            {lookupOpen && (
              <div className="cc-lookup-fields">
                <input
                  ref={lookupRef}
                  type="email"
                  aria-label="Email you used for your RSVP"
                  placeholder="Email you used"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLookup(); } }}
                />
                <button type="button" className="cc-btn-outline" onClick={handleLookup} disabled={lookupBusy}>
                  {lookupBusy ? 'Searching…' : 'Find my RSVP'}
                </button>
                {lookupStatus && <p className={`cc-lookup-status ${lookupStatus.kind}`}>{lookupStatus.msg}</p>}
              </div>
            )}
          </div>
        )}

        {!verifying && view === 'form' && (
          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            <div className="cc-field">
              <label htmlFor="cc-name">Full name</label>
              <input
                id="cc-name" type="text" name="name" autoComplete="name" required
                className={errors.name ? 'cc-input-error' : ''}
                onChange={() => errors.name && setErrors((e) => ({ ...e, name: '' }))}
              />
              {errors.name && <p className="cc-field-error">{errors.name}</p>}
            </div>

            <div className="cc-field">
              <label htmlFor="cc-email">Email address</label>
              <input
                id="cc-email" type="email" name="email" autoComplete="email" placeholder="you@example.com" required
                className={errors.email ? 'cc-input-error' : ''}
                onChange={() => errors.email && setErrors((e) => ({ ...e, email: '' }))}
              />
              {errors.email && <p className="cc-field-error">{errors.email}</p>}
            </div>

            <div className="cc-field">
              <label htmlFor="cc-phone">Phone number <span className="cc-opt">(optional)</span></label>
              <input
                id="cc-phone" type="tel" name="phone" autoComplete="tel"
                className={errors.phone ? 'cc-input-error' : ''}
                onChange={() => errors.phone && setErrors((e) => ({ ...e, phone: '' }))}
              />
              {errors.phone && <p className="cc-field-error">{errors.phone}</p>}
            </div>

            <div className="cc-row">
              <div className="cc-field">
                <label htmlFor="cc-adults">Adults</label>
                <select id="cc-adults" name="adults" required>
                  {['1', '2', '3', '4', '5', '6+'].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="cc-field">
                <label htmlFor="cc-children">Children</label>
                <select id="cc-children" name="children">
                  {['0', '1', '2', '3', '4+'].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>


            <div className="cc-field">
              <label htmlFor="cc-message">Blessings for Anagha Saraswika <span className="cc-opt">(optional)</span></label>
              <textarea id="cc-message" name="message" rows={3} />
            </div>

            {status === 'error' && (
              <div className="cc-error" role="alert">
                Your RSVP didn't send. Check your connection and try again, or email{' '}
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              </div>
            )}

            <button type="submit" className="cc-submit" disabled={status === 'submitting'}>
              {status === 'submitting'
                ? (editing ? 'Updating…' : 'Sending…')
                : (editing ? 'Update my RSVP' : 'Send RSVP')}
            </button>

            {editing && (
              <p className="cc-cancel-edit">
                <button type="button" className="cc-link-btn" onClick={cancelEdit}>Cancel</button>
              </p>
            )}
          </form>
        )}
      </section>

      <footer className="cc-footer">
        <p className="cc-footer-te">Your presence is our joy</p>
        <p className="cc-footer-hosts">{HOSTS}</p>
      </footer>
      <div className="cc-zari" />
    </div>
  );
}
