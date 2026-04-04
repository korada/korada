import React, { useState, useEffect } from 'react';
import '../assets/css/NavMenu.scss';

const NAV_SECTIONS = ['about', 'skills', 'experience', 'projects', 'education'];

export default function NavMenu() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <nav className={`site-nav${scrolled ? ' scrolled' : ''}`}>
      <button
        className="nav-brand"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
      >
        VAK ✨
      </button>

      <button
        className="hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      <ul className={`nav-links${menuOpen ? ' open' : ''}`} role="list">
        {NAV_SECTIONS.map(section => (
          <li key={section}>
            <button
              className="nav-link-btn"
              onClick={() => scrollTo(section)}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
