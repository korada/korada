import React, { useState, useEffect } from 'react';
import { resumeData } from '../data/resumeData';

// ── Typewriter hook ────────────────────────────────────────────────────────────
function useTypewriter(texts, speed = 80, pause = 2200) {
  const [display, setDisplay] = useState('');
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[idx];
    let timer;

    if (!deleting && charIdx < current.length) {
      timer = setTimeout(() => {
        setDisplay(current.substring(0, charIdx + 1));
        setCharIdx(c => c + 1);
      }, speed);
    } else if (!deleting && charIdx === current.length) {
      timer = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timer = setTimeout(() => {
        setDisplay(current.substring(0, charIdx - 1));
        setCharIdx(c => c - 1);
      }, speed / 2);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setIdx(i => (i + 1) % texts.length);
    }

    return () => clearTimeout(timer);
  }, [charIdx, deleting, idx, texts, speed, pause]);

  return display;
}

// ── Scroll reveal hook ─────────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries =>
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add('visible');
        }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ── Starfield canvas ───────────────────────────────────────────────────────────
function useStarfield(canvasId) {
  useEffect(() => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 180; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = Math.random() * 1.8;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.7})`;
        ctx.fill();
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [canvasId]);
}

// ── Chip colour cycling ────────────────────────────────────────────────────────
const CHIP_COLORS = [
  'chip-purple',
  'chip-pink',
  'chip-cyan',
  'chip-green',
  'chip-orange',
  'chip-yellow',
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function Resume() {
  useScrollReveal();
  useStarfield('starfield');
  const typedText = useTypewriter(resumeData.titles);
  const { name, about, contact, skills, experience, education, projects } =
    resumeData;

  return (
    <div className="resume-page">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero-section">
        <canvas id="starfield" className="starfield" aria-hidden="true" />
        <div className="hero-content">
          <p className="hero-greeting">👋 Hi, I'm</p>
          <h1 className="hero-name">{name}</h1>
          <div className="hero-typewriter" aria-live="polite">
            <span className="typed-text">{typedText}</span>
            <span className="cursor" aria-hidden="true">|</span>
          </div>
          <p className="hero-location">📍 {contact.location}</p>
          <div className="hero-actions">
            <a
              href={`mailto:${contact.email}`}
              className="btn-hero btn-hero-primary"
            >
              ✉️ Contact Me
            </a>
            <a
              href={contact.github}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-hero btn-hero-outline"
            >
              🐙 GitHub
            </a>
            <a
              href={contact.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-hero btn-hero-outline"
            >
              💼 LinkedIn
            </a>
          </div>
        </div>
      </section>

      <div className="content-wrapper">

        {/* ── About ──────────────────────────────────────────────────────── */}
        <section id="about" className="section reveal">
          <div className="section-card">
            <h2 className="section-title">🙋 About Me</h2>
            <p className="about-text">{about}</p>
          </div>
        </section>

        {/* ── Skills ─────────────────────────────────────────────────────── */}
        <section id="skills" className="section reveal">
          <div className="section-card">
            <h2 className="section-title">🛠️ Skills</h2>
            <div className="skills-grid">
              {Object.entries(skills).map(([category, items]) => (
                <div key={category} className="skill-category">
                  <h4 className="skill-category-title">{category}</h4>
                  <div className="chip-group">
                    {items.map((skill, i) => (
                      <span
                        key={skill}
                        className={`chip ${CHIP_COLORS[i % CHIP_COLORS.length]}`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Experience ─────────────────────────────────────────────────── */}
        <section id="experience" className="section reveal">
          <div className="section-card">
            <h2 className="section-title">💼 Experience</h2>
            <div className="timeline">
              {experience.map((job, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-dot" aria-hidden="true" />
                  <div className="timeline-content">
                    <h3 className="job-role">{job.role}</h3>
                    <h4 className="job-company">{job.company}</h4>
                    <p className="job-dates">{job.dates}</p>
                    <ul className="job-bullets">
                      {job.bullets.map((bullet, j) => (
                        <li key={j}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Projects ───────────────────────────────────────────────────── */}
        <section id="projects" className="section">
          <h2 className="section-title section-title-standalone reveal">
            🚀 Projects
          </h2>
          <div className="projects-grid">
            {projects.map((project, i) => (
              <div
                key={i}
                className="project-card reveal"
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div className="project-emoji" aria-hidden="true">
                  {project.emoji}
                </div>
                <h3 className="project-name">{project.name}</h3>
                <p className="project-desc">{project.description}</p>
                <div className="chip-group">
                  {project.tech.map(t => (
                    <span key={t} className="chip chip-small chip-gray">
                      {t}
                    </span>
                  ))}
                </div>
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link"
                  >
                    View on GitHub →
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Education ──────────────────────────────────────────────────── */}
        <section id="education" className="section reveal">
          <div className="section-card">
            <h2 className="section-title">🎓 Education</h2>
            {education.map((edu, i) => (
              <div key={i} className="edu-item">
                <h3 className="edu-school">{edu.school}</h3>
                <p className="edu-degree">
                  {edu.degree} · {edu.year}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>{/* /content-wrapper */}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="site-footer">
        <p className="footer-text">Built with ❤️ by {name}</p>
        <div className="footer-links">
          <a href={`mailto:${contact.email}`}>✉️ {contact.email}</a>
          <a
            href={contact.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            🐙 GitHub
          </a>
          <a
            href={contact.linkedin}
            target="_blank"
            rel="noopener noreferrer"
          >
            💼 LinkedIn
          </a>
        </div>
      </footer>

    </div>
  );
}
