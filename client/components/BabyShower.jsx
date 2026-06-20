import React, { useState, useEffect, useRef } from 'react';
import inviteImg from '../assets/images/seemantham-invite.jpg';
import '../assets/css/BabyShower.scss';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyrlsLV4YADUCr-EVisrAixVP5M-Hfmvue3h0UWCXvhtW0eFJ9JRSz-FeHB2J5-lM5c/exec';
const STORAGE_KEY = 'seemantham_rsvp_v1';

const PETALS = ['🌸', '🌼', '🌸', '🌷', '🌼', '🌸', '🌼', '🌷', '🌸', '🌼'];

// ── Debug logging ────────────────────────────────────────────────────────────
// Turn on a visible on-page log (to confirm the submit actually reached GAS) by
// adding ?debug=1 (or #debug) to the URL. Everything is also mirrored to the
// browser console regardless. The no-cors POST is opaque, so this is how you can
// tell whether GAS truly received the data — see verifySubmission().
const DEBUG = typeof location !== 'undefined' &&
  (/(\?|&)debug=1\b/.test(location.search) || /\bdebug\b/.test(location.hash));

function dlog(msg, kind, obj) {
  try { console.log('[RSVP] ' + msg, obj !== undefined ? obj : ''); } catch (e) {}
  if (!DEBUG) return;
  const box = document.getElementById('bs-debug-log');
  if (!box) return;
  const div = document.createElement('div');
  div.className = 'bs-dl' + (kind ? ' ' + kind : '');
  let body = msg;
  if (obj !== undefined) {
    try { body += '\n' + JSON.stringify(obj, null, 2); } catch (e) { body += '\n' + obj; }
  }
  div.innerHTML = '<span class="t">[' + new Date().toLocaleTimeString() + ']</span> ' +
    body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  box.appendChild(div);
  const panel = document.getElementById('bs-debug-panel');
  if (panel) panel.scrollTop = panel.scrollHeight;
}

// The no-cors POST is opaque, so we follow up with a JSONP lookup (a real,
// readable response) to confirm GAS received the data and wrote the row.
function verifySubmission(data) {
  dlog('Verifying via JSONP lookup for ' + data.email + ' …');
  jsonp({ email: data.email }, (res) => {
    if (!res) {
      dlog('Verify: NO response from GAS (timeout/error). The POST may not have ' +
           'reached GAS, or the deployment is down / not authorized.', 'err');
      return;
    }
    dlog('Verify: GAS responded (script version ' + (res.version || '?') + ')', 'ok', res);
    if (res.found && res.rsvp) {
      const match = (res.rsvp.email || '').toLowerCase() === (data.email || '').toLowerCase();
      dlog('Verify: row FOUND in sheet for ' + res.rsvp.email +
           (match ? ' — write confirmed ✓' : ''), match ? 'ok' : 'warn', res.rsvp);
    } else {
      dlog('Verify: GAS is reachable but NO row found for ' + data.email +
           '. The write did not land — check the Apps Script execution log ' +
           '(likely a sheet/tab-name or authorization problem).', 'err');
    }
  });
}

function getSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
  catch (e) { return null; }
}
function saveLocal(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
}

// JSONP — reads data back from Apps Script across origins (no-cors can't).
function jsonp(params, cb) {
  const fn = 'jsonp_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
  const script = document.createElement('script');
  let done = false;
  const cleanup = () => {
    clearTimeout(timer);
    delete window[fn];
    if (script.parentNode) script.parentNode.removeChild(script);
  };
  const finish = (res) => { if (done) return; done = true; cleanup(); cb(res); };
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
    s += ` · ${d.children} child${d.children === '1' ? '' : 'ren'}`;
  }
  return s;
}

function burstConfetti() {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const emojis = ['🌸', '🌼', '💛', '🎉', '✨', '🌷'];
  const c = document.createElement('div');
  c.className = 'bs-confetti';
  for (let i = 0; i < 36; i++) {
    const s = document.createElement('span');
    s.textContent = emojis[i % emojis.length];
    s.style.left = `${Math.random() * 100}%`;
    s.style.fontSize = `${0.9 + Math.random() * 1.3}rem`;
    s.style.animationDelay = `${Math.random() * 0.4}s`;
    s.style.animationDuration = `${2.4 + Math.random() * 1.8}s`;
    c.appendChild(s);
  }
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 5000);
}

export default function BabyShower() {
  // view: 'form' | 'banner' | 'thanks'   ·   status: 'idle' | 'submitting' | 'error'
  const [view, setView] = useState('form');
  const [status, setStatus] = useState('idle');
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(null);
  const [wasUpdate, setWasUpdate] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupStatus, setLookupStatus] = useState(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [verifying, setVerifying] = useState(false);
  const lookupRef = useRef(null);
  const formRef = useRef(null);

  // On mount: if localStorage has an RSVP, verify it still exists in GAS.
  // If GAS confirms → show banner with fresh data.
  // If GAS says not found → clear localStorage, show form.
  // If GAS is unreachable (timeout/error) → trust localStorage optimistically.
  useEffect(() => {
    const s = getSaved();
    if (s && s.email) {
      setVerifying(true);
      jsonp({ email: s.email }, (res) => {
        setVerifying(false);
        if (res && res.success && res.found === false) {
          localStorage.removeItem(STORAGE_KEY);
        } else if (res && res.success && res.found && res.rsvp) {
          saveLocal(res.rsvp);
          setSaved(res.rsvp);
          setView('banner');
        } else {
          // GAS unreachable — trust localStorage
          setSaved(s);
          setView('banner');
        }
      });
    }
    if (DEBUG) {
      dlog('Debug mode ON. GAS_URL = ' + GAS_URL, 'warn');
      dlog('Pinging GAS to check reachability…');
      jsonp({ ping: '1' }, (res) => {
        if (!res) {
          dlog('Ping FAILED — GAS did not respond. URL wrong, deployment down, or not authorized.', 'err');
        } else {
          dlog('Ping OK — GAS reachable, deployed version ' + (res.version || '?'), 'ok', res);
        }
      });
    }
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
    f.dietary.value = d.dietary || '';
  }

  function startEdit() {
    setView('form');
    setEditing(true);
    setStatus('idle');
    // prefill after the form has rendered
    setTimeout(() => prefill(getSaved()), 0);
  }

  function cancelEdit() {
    setEditing(false);
    if (saved) setView('banner');
  }

  function handleRemove() {
    if (!window.confirm("Are you sure you want to remove your RSVP?\n\nWe'll be so sad to see you go!")) return;
    const current = getSaved();
    if (!current || !current.email) return;
    setStatus('submitting');
    jsonp({ action: 'cancel', email: current.email, name: current.name || '' }, (res) => {
      if (!res || !res.success) {
        dlog('Remove RSVP error (clearing locally anyway): ' + JSON.stringify(res), 'err');
      }
      localStorage.removeItem(STORAGE_KEY);
      setSaved(null);
      setStatus('idle');
      setView('removed');
    });
  }

  function handleLookup() {
    const email = (lookupRef.current && lookupRef.current.value.trim()) || '';
    if (!email) { setLookupStatus({ kind: 'error', msg: 'Please enter your email address.' }); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setLookupStatus({ kind: 'error', msg: 'Please enter a valid email address (e.g. you@example.com).' }); return; }
    setLookupBusy(true);
    setLookupStatus({ kind: '', msg: 'Looking up your RSVP…' });
    jsonp({ email }, (res) => {
      setLookupBusy(false);
      if (res && res.success && res.found && res.rsvp) {
        setLookupStatus({ kind: 'ok', msg: 'Found it! 🎉' });
        saveLocal(res.rsvp);
        setSaved(res.rsvp);
        setView('banner');
      } else if (res && res.success && res.found === false) {
        setLookupStatus({ kind: 'error', msg: "We couldn't find an RSVP for that email. Please check the spelling, or submit a new one below." });
      } else {
        setLookupStatus({ kind: 'error', msg: 'Something went wrong. Please try again in a moment.' });
      }
    });
  }

  function validate(name, email, phone) {
    const errs = {};
    if (!name) errs.name = 'Please enter your full name.';
    if (!email) {
      errs.email = 'Please enter your email address.';
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      errs.email = 'Please enter a valid email address (e.g. you@example.com).';
    }
    if (phone && !/^[\d\s().+\-]{7,15}$/.test(phone)) {
      errs.phone = 'Please enter a valid phone number.';
    }
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
      phone: form.phone.value.trim(),
      adults: form.adults.value,
      children: form.children.value,
      message: form.message.value.trim(),
      dietary: form.dietary.value.trim(),
    };

    setStatus('submitting');
    dlog((isUpdate ? 'UPDATE' : 'NEW') + ' submit — sending to GAS', 'warn', data);

    const finish = () => {
      saveLocal(data);
      setSaved(data);
      setWasUpdate(isUpdate);
      setEditing(false);
      setStatus('idle');
      setView('thanks');
      burstConfetti();
      verifySubmission(data);
    };

    if (GAS_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
      dlog('GAS_URL not configured — saving locally only', 'err');
      finish();
      return;
    }

    const t0 = Date.now();
    dlog('POST → ' + GAS_URL + ' (mode: no-cors)');
    fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data),
    })
      .then(() => {
        dlog('POST resolved in ' + (Date.now() - t0) + 'ms (opaque — cannot read body)', 'ok');
        finish();
      })
      .catch((err) => {
        dlog('POST fetch FAILED: ' + err, 'err');
        setStatus('error');
      });
  }

  return (
    <div className="bs-page">
      {/* Floating petals */}
      <div className="bs-petals" aria-hidden="true">
        {PETALS.map((p, i) => <span key={i}>{p}</span>)}
      </div>

      <div className="bs-gold-bar" />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="bs-header bs-animate-in">
        <div className="bs-marigold">🌼 · 🌸 · 🌼 · 🌸 · 🌼 · 🌸 · 🌼</div>
        <p className="bs-sub">Join us in celebrating</p>
        <h1 className="bs-title">
          <span className="bs-flower" style={{ animationDelay: '1.2s' }}>🌸</span> Seemantham <span className="bs-flower">🌸</span>
        </h1>
        <p className="bs-and">✦ &nbsp; and Gender Reveal &nbsp; ✦</p>
      </header>

      {/* ── Invite image ───────────────────────────────────────────────── */}
      <div className="bs-img-wrap bs-animate-in bs-delay-1">
        <span className="bs-img-flower bs-img-flower-left" aria-hidden="true">🌸</span>
        <span className="bs-img-flower bs-img-flower-right" aria-hidden="true">🌸</span>
        <img
          src={inviteImg}
          alt="Seemantham invitation — Sravya & Venkata Aditya, 16th August 2026"
        />
      </div>

      {/* ── Event details ──────────────────────────────────────────────── */}
      <div className="bs-event-banner bs-animate-in bs-delay-2">
        <p className="bs-label">📅 Date &amp; Time</p>
        <p className="bs-date">16th August 2026</p>
        <p className="bs-time">Muhurtham · 11:45 AM</p>
        <div><span className="bs-dress">💚 Dress Code: <strong>Green</strong></span></div>
        <p className="bs-venue-name" style={{ marginTop: '1rem' }}>🏡 Golden Meadows Farm</p>
        <p className="bs-venue-addr">9009 Poplar Tent Rd, Concord, NC 28027</p>
        <a
          href="https://maps.google.com/?q=9009+Poplar+Tent+Rd+Concord+NC+28027"
          target="_blank"
          rel="noopener noreferrer"
          className="bs-maps-link"
          style={{ marginTop: '0.85rem' }}
        >
          📍 Open in Maps
        </a>
        <div style={{ marginTop: '1.25rem' }}>
          <p className="bs-label" style={{ marginBottom: '0.5rem' }}>🎁 Registry</p>
          <a href="https://www.amazon.com/baby-reg/venkata-korada-september-2026-charlotte/255JAWY1MXX5X?ref_=cm_sw_r_apin_dp_99CX83V36RXR4GBK1FMB&language=en-US" target="_blank" rel="noopener noreferrer" className="bs-maps-link" style={{ margin: '0.4rem 0.3rem 0' }}>Amazon</a>
          <a href="https://www.target.com/gift-registry/gift/sravya-venkata-aditya" target="_blank" rel="noopener noreferrer" className="bs-maps-link" style={{ margin: '0.4rem 0.3rem 0' }}>Target</a>
        </div>
      </div>

      {/* ── RSVP card ──────────────────────────────────────────────────── */}
      <section className="bs-rsvp-card bs-animate-in bs-delay-3" id="rsvp">
        <div className="bs-divider"><span>🌸</span></div>
        <h2 className="bs-rsvp-title">Kindly RSVP</h2>
        <p className="bs-rsvp-sub">
          Please respond by August 1st, 2026 · We'd love to celebrate with you! 💛
        </p>

        {verifying && (
          <div className="bs-verifying">
            <div className="bs-verifying-spinner" />
            <p>Checking your RSVP…</p>
          </div>
        )}

        {!verifying && view === 'banner' && saved && (
          <div className="bs-already">
            <div className="bs-ab-emoji">🎉</div>
            <h2 className="bs-ab-title">You're on the list!</h2>
            <p className="bs-ab-text">
              Thanks {saved.name ? saved.name.split(' ')[0] : ''}, we've already got your RSVP.<br />
              We can't wait to celebrate with you! 💛
            </p>
            <div className="bs-summary">
              <div className="bs-sum-row"><span>Name</span><strong>{saved.name}</strong></div>
              <div className="bs-sum-row"><span>Email</span><strong>{saved.email}</strong></div>
              <div className="bs-sum-row"><span>Attending</span><strong>{partyText(saved)}</strong></div>
              {saved.dietary && (
                <div className="bs-sum-row"><span>Dietary</span><strong>{saved.dietary}</strong></div>
              )}
              {saved.message && (
                <div className="bs-sum-row"><span>Wishes</span><strong>{saved.message}</strong></div>
              )}
            </div>
            <button type="button" className="bs-edit-btn" onClick={startEdit}>
              ✏️ Edit my RSVP
            </button>
            <br />
            <button type="button" className="bs-remove-btn" onClick={handleRemove} disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Removing…' : 'Remove my RSVP'}
            </button>
          </div>
        )}


        {view === 'thanks' && (
          <div className="bs-thankyou">
            <div className="bs-ty-emoji">{wasUpdate ? '💛🌸💛' : '🎉🌸🎉'}</div>
            <h3 className="bs-ty-title">
              {wasUpdate ? 'Thanks for keeping us updated!' : 'We\'re so excited you can make it!'}
            </h3>
            <p className="bs-ty-text">
              {wasUpdate
                ? <>We've noted your changes and have everything updated.<br />
                    Can't wait to celebrate with you on August 16th! 💛</>
                : <>Your RSVP is confirmed and we are absolutely thrilled you'll be joining us!<br />
                    We can't wait to celebrate this beautiful milestone together. 🌸</>}
            </p>
            <p className="bs-ty-edit">
              A confirmation has been sent to your email. Need to make a change?{' '}
              <a onClick={startEdit}>Edit my RSVP</a>
            </p>
          </div>
        )}

        {!verifying && view === 'form' && !editing && (
          <div className="bs-lookup">
            <p className="bs-lookup-prompt">
              Already RSVP'd on another device?{' '}
              <a onClick={() => setLookupOpen(o => !o)}>Find your RSVP →</a>
            </p>
            {lookupOpen && (
              <div className="bs-lookup-fields">
                <input
                  ref={lookupRef}
                  type="email"
                  placeholder="Enter the email you used"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLookup(); } }}
                />
                <button type="button" className="bs-lookup-btn" onClick={handleLookup} disabled={lookupBusy}>
                  {lookupBusy ? 'Searching…' : 'Find my RSVP'}
                </button>
                {lookupStatus && (
                  <p className={`bs-lookup-status ${lookupStatus.kind}`}>{lookupStatus.msg}</p>
                )}
              </div>
            )}
          </div>
        )}

        {view === 'removed' && (
          <div className="bs-thankyou">
            <div className="bs-ty-emoji">💔</div>
            <h3 className="bs-ty-title">We'll Miss You!</h3>
            <p className="bs-ty-text">
              We're so sad you won't be able to make it. 💛<br />
              We'll be thinking of you and hope your plans change!
            </p>
            <p className="bs-ty-edit">
              Changed your mind?{' '}
              <a onClick={() => { setView('form'); setEditing(false); setLookupOpen(false); setLookupStatus(null); }}>RSVP again</a>
            </p>
          </div>
        )}

        {!verifying && view === 'form' && (
          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            <div className="bs-form-group">
              <label htmlFor="bs-name">Full Name <span className="bs-req">*</span></label>
              <input
                id="bs-name" type="text" name="name" placeholder="Your full name" required
                className={errors.name ? 'bs-input-error' : ''}
                onChange={() => errors.name && setErrors(e => ({ ...e, name: '' }))}
              />
              {errors.name && <p className="bs-field-error">{errors.name}</p>}
            </div>

            <div className="bs-form-group">
              <label htmlFor="bs-email">Email Address <span className="bs-req">*</span></label>
              <input
                id="bs-email" type="email" name="email" placeholder="you@example.com" required
                className={errors.email ? 'bs-input-error' : ''}
                onChange={() => errors.email && setErrors(e => ({ ...e, email: '' }))}
              />
              {errors.email && <p className="bs-field-error">{errors.email}</p>}
            </div>

            <div className="bs-form-group">
              <label htmlFor="bs-phone">
                Phone Number <span className="bs-opt">(optional)</span>
              </label>
              <input
                id="bs-phone" type="tel" name="phone" placeholder="(704) 555-0000"
                className={errors.phone ? 'bs-input-error' : ''}
                onChange={() => errors.phone && setErrors(e => ({ ...e, phone: '' }))}
              />
              {errors.phone && <p className="bs-field-error">{errors.phone}</p>}
            </div>

            <div className="bs-form-row">
              <div className="bs-form-group">
                <label htmlFor="bs-adults">Adults <span className="bs-req">*</span></label>
                <select id="bs-adults" name="adults" required>
                  {['1','2','3','4','5','6+'].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="bs-form-group">
                <label htmlFor="bs-children">Children</label>
                <select id="bs-children" name="children">
                  {['0','1','2','3','4+'].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div className="bs-form-group">
              <label htmlFor="bs-dietary">
                Dietary Requirements <span className="bs-opt">(optional)</span>
              </label>
              <input
                id="bs-dietary"
                type="text"
                name="dietary"
                placeholder="e.g. Vegetarian, Vegan, Gluten-free, Nut allergy…"
              />
            </div>

            <div className="bs-form-group">
              <label htmlFor="bs-message">Wishes for Sravya &amp; Venkata Aditya 💛</label>
              <textarea
                id="bs-message"
                name="message"
                rows={3}
                placeholder="Share your love and blessings for the growing family..."
              />
            </div>

            {status === 'error' && (
              <div className="bs-error">
                Something went wrong. Please try again or email{' '}
                <a href="mailto:venkata@korada.in">venkata@korada.in</a>.
              </div>
            )}

            <button type="submit" className="bs-submit-btn" disabled={status === 'submitting'}>
              {status === 'submitting'
                ? (editing ? 'Updating… 🌸' : 'Sending… 🌸')
                : (editing ? 'Update My RSVP 🌸' : 'Send RSVP 🌸')}
            </button>

            {editing && (
              <div className="bs-cancel-edit">
                <a onClick={cancelEdit}>Cancel</a>
              </div>
            )}
          </form>
        )}
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="bs-footer">
        <div className="bs-marigold">🌸 · 🌼 · 🌸 · 🌼 · 🌸</div>
        <span className="bs-footer-script">Sravya &amp; Venkata Aditya</span>
        <span>With love and joy</span>
      </footer>

      <div className="bs-gold-bar" />

      {/* ── Debug panel (activate with ?debug=1 or #debug in the URL) ─── */}
      {DEBUG && (
        <>
          <button
            id="bs-debug-toggle"
            className="bs-debug-toggle"
            type="button"
            onClick={() => {
              const p = document.getElementById('bs-debug-panel');
              if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none';
            }}
          >
            🐞 Debug
          </button>
          <div id="bs-debug-panel" className="bs-debug-panel">
            <div className="bs-debug-head">
              <span>RSVP debug log</span>
              <button
                type="button"
                className="bs-debug-clear"
                onClick={() => { const b = document.getElementById('bs-debug-log'); if (b) b.innerHTML = ''; }}
              >
                clear
              </button>
            </div>
            <div id="bs-debug-log" />
          </div>
        </>
      )}
    </div>
  );
}
