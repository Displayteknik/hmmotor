/* ═══════════════════════════════════════════════════════
   HM MOTOR — Dynamic content loader
   Loads JSON from /content/pages/ (managed by Decap CMS)
   Falls back to existing hardcoded content if fetch fails
   ═══════════════════════════════════════════════════════ */

async function loadContent(filename) {
  try {
    const res = await fetch('/content/pages/' + filename + '.json?v=' + Date.now());
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('Content load failed for', filename, '— using fallback');
    return null;
  }
}

/* ─── Hero (index.html) ─── */
async function renderHeroContent() {
  const data = await loadContent('hero');
  if (!data) return;

  const badge = document.querySelector('.hero-badge');
  const h1 = document.querySelector('.hero-content h1, .hero-hybrid-text h1');
  const p = document.querySelector('.hero-content > p, .hero-hybrid-text > p');
  const img = document.querySelector('.hero-bg img');

  if (badge) badge.textContent = data.badge;
  if (h1) h1.textContent = data.title;
  if (p) p.textContent = data.subtitle;
  if (img && data.image_url) img.src = data.image_url;

  // CTAs
  const btns = document.querySelectorAll('.hero-actions .btn');
  if (btns[0] && data.cta1_text) {
    btns[0].href = data.cta1_url;
    btns[0].childNodes[0].textContent = data.cta1_text + ' ';
  }
  if (btns[1] && data.cta2_text) {
    btns[1].href = data.cta2_url;
    btns[1].textContent = data.cta2_text;
  }

  // Trust items
  const trustContainer = document.querySelector('.hero-trust');
  if (trustContainer && data.trust_items && data.trust_items.length) {
    trustContainer.innerHTML = data.trust_items.map(t =>
      `<div class="hero-trust-item"><strong>${t.bold}</strong> ${t.text}</div>`
    ).join('');
  }
}

/* ─── FAQ (index.html) ─── */
async function renderFAQContent() {
  const data = await loadContent('faq');
  if (!data || !data.items) return;

  const list = document.querySelector('.faq-list');
  if (!list) return;

  list.innerHTML = data.items.map(item => `
    <details class="faq-item">
      <summary>${item.question}<span class="faq-toggle">+</span></summary>
      <p>${item.answer}</p>
    </details>
  `).join('');
}

/* ─── Just nu (index.html) ─── */
async function renderJustNuContent() {
  const data = await loadContent('just-nu');
  if (!data || !data.cards) return;

  const grid = document.querySelector('.just-nu-grid');
  if (!grid) return;

  grid.innerHTML = data.cards.map((card, i) => `
    <div class="just-nu-card ${i === 0 ? 'just-nu-card--highlight' : ''}">
      <span class="just-nu-label">${card.label}</span>
      <h3>${card.title}</h3>
      <p>${card.text}</p>
      <a href="${card.link}">${card.link_text || 'Läs mer →'}</a>
    </div>
  `).join('');
}

/* ─── Services / Varför oss (index.html) ─── */
async function renderServicesContent() {
  const data = await loadContent('services');
  if (!data) return;

  const titleEl = document.querySelector('.why-text h2');
  const text1El = document.querySelector('.why-text > p:first-of-type');
  const text2El = document.querySelector('.why-text > p:nth-of-type(2)');
  const pointsContainer = document.querySelector('.why-points');

  if (titleEl) titleEl.textContent = data.title;
  if (text1El) text1El.textContent = data.text1;
  if (text2El) text2El.textContent = data.text2;

  if (pointsContainer && data.points) {
    const icons = pointsContainer.querySelectorAll('.why-point-icon');
    data.points.forEach((point, i) => {
      const el = pointsContainer.querySelectorAll('.why-point')[i];
      if (el) {
        el.querySelector('h4').textContent = point.title;
        el.querySelector('p').textContent = point.text;
      }
    });
  }
}

/* ─── About page (om-oss.html) ─── */
async function renderAboutContent() {
  const data = await loadContent('about');
  if (!data) return;

  // Header
  const h1 = document.querySelector('.page-header h1');
  const intro = document.querySelector('.page-header p');
  if (h1) h1.textContent = data.title;
  if (intro) intro.textContent = data.intro;

  // Timeline
  const timeline = document.querySelector('.timeline');
  if (timeline && data.timeline) {
    timeline.innerHTML = data.timeline.map(item => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-year">${item.year}</div>
        <h3>${item.title}</h3>
        <p>${item.text}</p>
      </div>
    `).join('');
  }

  // Values
  const valuesGrid = document.querySelector('.values-grid');
  if (valuesGrid && data.values) {
    const icons = ['<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
                   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
                   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'];
    valuesGrid.innerHTML = data.values.map((val, i) => `
      <div class="value-card">
        <div class="value-icon">${icons[i] || icons[0]}</div>
        <h3>${val.title}</h3>
        <p>${val.text}</p>
      </div>
    `).join('');
  }
}
