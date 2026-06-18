import React, { useState } from 'react';
import inviteImg from '../assets/images/seemantham-invite.jpg';
import '../assets/css/BabyShower.scss';

// 👇 After deploying the Google Apps Script, paste your Web App URL here
const GAS_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';

export default function BabyShower() {
  const [status, setStatus] = useState('idle'); // idle | submitting | done | error

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const name  = form.name.value.trim();
    const email = form.email.value.trim();
    if (!name || !email) { alert('Please fill in your name and email.'); return; }

    const data = {
      name,
      email,
      phone:    form.phone.value.trim(),
      adults:   form.adults.value,
      children: form.children.value,
      message:  form.message.value.trim(),
      submittedAt: new Date().toISOString(),
    };

    setStatus('submitting');

    if (GAS_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
      console.log('RSVP (GAS not yet configured):', data);
      setStatus('done');
      return;
    }

    fetch(GAS_URL, {
      method:  'POST',
      mode:    'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body:    JSON.stringify(data),
    })
      .then(() => setStatus('done'))
      .catch(() => setStatus('error'));
  }

  return (
    <div className="bs-page">
      <div className="bs-gold-bar" />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="bs-header">
        <div className="bs-marigold">🌼 · 🌸 · 🌼 · 🌸 · 🌼 · 🌸 · 🌼</div>
        <p className="bs-sub">Join us in celebrating</p>
        <h1 className="bs-title">Seemantham</h1>
        <p className="bs-and">✦ &nbsp; and Gender Reveal &nbsp; ✦</p>
      </header>

      {/* ── Invite image ───────────────────────────────────────────────── */}
      <div className="bs-img-wrap">
        <img
          src={inviteImg}
          alt="Seemantham invitation — Sravya & Venkata Aditya, 16th August 2026"
        />
      </div>

      {/* ── Event details ──────────────────────────────────────────────── */}
      <div className="bs-event-banner">
        <p className="bs-label">📅 Date &amp; Time</p>
        <p className="bs-date">16th August 2026</p>
        <p className="bs-time">Muhurtham · 11:45 AM</p>
        <p className="bs-venue-name">🏡 Golden Meadows Farm</p>
        <p className="bs-venue-addr">9009 Poplar Tent Rd, Concord, NC 28027</p>
        <a
          href="https://maps.google.com/?q=9009+Poplar+Tent+Rd+Concord+NC+28027"
          target="_blank"
          rel="noopener noreferrer"
          className="bs-maps-link"
        >
          📍 Open in Maps
        </a>
      </div>

      {/* ── RSVP card ──────────────────────────────────────────────────── */}
      <section className="bs-rsvp-card" id="rsvp">
        <div className="bs-divider"><span>🌸</span></div>
        <h2 className="bs-rsvp-title">Kindly RSVP</h2>
        <p className="bs-rsvp-sub">
          Please respond by August 1st, 2026 · We'd love to celebrate with you! 💛
        </p>

        {status === 'done' ? (
          <div className="bs-thankyou">
            <div className="bs-ty-emoji">🌸💛🌼</div>
            <h3 className="bs-ty-title">Thank you!</h3>
            <p className="bs-ty-text">
              Sravya &amp; Venkata Aditya are so grateful for your love and blessings.<br />
              We can't wait to celebrate this special milestone with you!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
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
              {status === 'submitting' ? 'Sending… 🌸' : 'Send RSVP 🌸'}
            </button>
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
