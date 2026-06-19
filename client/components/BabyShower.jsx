import React, { useState, useEffect, useRef } from 'react';
import inviteImg from '../assets/images/seemantham-invite.jpg';
import '../assets/css/BabyShower.scss';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzI9DrVsevBS3jsbK419GDYH2IlSlS1RR62SeNzzQIOSUyGDOXUJJ32vgf7Kxa-fZEn/exec';
const STORAGE_KEY = 'seemantham_rsvp_v1';

const PETALS = ['🌸', '🌼', '🌸', '🌷', '🌼', '🌸', '🌼', '🌷', '🌸', '🌼'];

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
  const [lookupStatus, setLookupStatus] = useState(null); // { kind, msg }
  const [lookupBusy, setLookupBusy] = useState(false);
  const lookupRef = useRef(null);
  const formRef = useRef(null);

  // On mount: returning guests see their saved RSVP
  useEffect(() => {
    const s = getSaved();
    if (s && s.name) { setSaved(s); setView('banner'); }
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
    // JSONP so we can confirm the row was actually deleted server-side.
    jsonp({ action: 'cancel', email: current.email, name: current.name || '' }, (res) => {
      if (res && res.success && (res.cancelled || res.found === false)) {
        localStorage.removeItem(STORAGE_KEY);
        setSaved(null);
        setStatus('idle');
        setView('removed');
      } else {
        setStatus('idle');
        window.alert('Something went wrong removing your RSVP. Please try again.');
      }
    });
  }

  function handleLookup() {
    const email = (lookupRef.current && lookupRef.current.value.trim()) || '';
    if (!email) { setLookupStatus({ kind: 'error', msg: 'Please enter your email.' }); return; }
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

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    if (!name || !email) { alert('Please fill in your name and email.'); return; }

    const prior = getSaved();
    const isUpdate = !!(prior && prior.email);
    const data = {
      name,
      email,
      phone: form.phone.value.trim(),
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
      burstConfetti();
    };

    if (GAS_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
      console.log('RSVP (GAS not configured):', data);
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
      .catch(() => setStatus('error'));
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

        {view === 'banner' && saved && (
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
            <div className="bs-ty-emoji">🌸💛🌼</div>
            <h3 className="bs-ty-title">{wasUpdate ? 'All updated!' : 'Thank you!'}</h3>
            <p className="bs-ty-text">
              {wasUpdate
                ? <>Your RSVP has been updated.<br />We can't wait to celebrate with you! 💛</>
                : <>Sravya &amp; Venkata Aditya are so grateful for your love and blessings.<br />
                    We can't wait to celebrate this special milestone with you!</>}
            </p>
            <p className="bs-ty-edit">
              A confirmation has been sent to your email. Need to make a change?{' '}
              <a onClick={startEdit}>Edit my RSVP</a>
            </p>
          </div>
        )}

        {view === 'form' && !editing && (
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
            <h3 className="bs-ty-title">RSVP Removed</h3>
            <p className="bs-ty-text">We're so sad you won't be joining us. 💛</p>
            <p className="bs-ty-edit">
              Changed your mind?{' '}
              <a onClick={() => { setView('form'); setEditing(false); setLookupOpen(false); setLookupStatus(null); }}>RSVP again</a>
            </p>
          </div>
        )}

        {view === 'form' && (
          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            <div className="bs-form-group">
              <label htmlFor="bs-name">Full Name <span className="bs-req">*</span></label>
              <input id="bs-name" type="text" name="name" placeholder="Your full name" required />
            </div>

            <div className="bs-form-group">
              <label htmlFor="bs-email">Email Address <span className="bs-req">*</span></label>
              <input id="bs-email" type="email" name="email" placeholder="you@example.com" required />
            </div>

            <div className="bs-form-group">
              <label htmlFor="bs-phone">
                Phone Number <span className="bs-opt">(optional)</span>
              </label>
              <input id="bs-phone" type="tel" name="phone" placeholder="(704) 555-0000" />
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
        <span>With love and joy · Concord, NC · 2026</span>
      </footer>

      <div className="bs-gold-bar" />
    </div>
  );
}
