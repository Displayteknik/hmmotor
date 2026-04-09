/* ═══════════════════════════════════════════════════════
   HM MOTOR — Supabase client + data loading
   ═══════════════════════════════════════════════════════ */

const HM_SUPABASE_URL = 'https://liunepzrmygiaaibsbni.supabase.co';
const HM_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpdW5lcHpybXlnaWFhaWJzYm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NjgxMjUsImV4cCI6MjA4NzU0NDEyNX0.n9dBUFVrcNfFbiTzesgHx25vXvyjC9h4IGi7jUmWdxc';

let _supabase = null;

function getSupabase() {
  if (!_supabase) {
    if (typeof window.supabase === 'undefined') {
      console.warn('Supabase JS not loaded');
      return null;
    }
    _supabase = window.supabase.createClient(HM_SUPABASE_URL, HM_SUPABASE_KEY);
  }
  return _supabase;
}

/* ─── Vehicle functions ─── */

async function loadVehicles(category, options = {}) {
  const sb = getSupabase();
  if (!sb) return [];
  let query = sb.from('hm_vehicles').select('*');
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }
  if (options.featured) {
    query = query.eq('is_featured', true);
  }
  if (options.brand) {
    query = query.eq('brand', options.brand);
  }
  query = query.order('sort_order', { ascending: true });
  if (options.limit) {
    query = query.limit(options.limit);
  }
  const { data, error } = await query;
  if (error) { console.error('loadVehicles error:', error); return []; }
  return data || [];
}

async function loadFeaturedVehicles(limit = 6) {
  return loadVehicles(null, { featured: true, limit });
}

async function loadVehicleBySlug(slug) {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('hm_vehicles').select('*').eq('slug', slug).single();
  if (error) return null;
  return data;
}

/* ─── Blog functions ─── */

async function loadBlogPosts(limit = 20) {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('hm_blog')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('loadBlogPosts error:', error); return []; }
  return data || [];
}

async function loadBlogPost(slug) {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('hm_blog').select('*').eq('slug', slug).eq('published', true).single();
  if (error) return null;
  return data;
}

/* ─── Rendering helpers ─── */

function formatPrice(num) {
  if (!num) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' kr';
}

function renderVehicleCard(v, darkBg = false) {
  const specs = v.specs || {};
  const specEntries = Object.values(specs).filter(Boolean).slice(0, 3);
  const badgeClass = v.is_sold ? 'vehicle-badge--sold' :
                     v.badge === 'Populär' ? 'vehicle-badge--popular' :
                     v.badge === 'Ny' ? 'vehicle-badge--new' :
                     'vehicle-badge--brand';
  const badgeText = v.is_sold ? 'Såld' : (v.badge || v.brand || '');

  const link = v.slug ? `fordon.html#${v.slug}` : '#';

  return `
    <article class="vehicle-card" onclick="window.location.href='${link}'" style="cursor:pointer">
      <div class="vehicle-card-img">
        ${badgeText ? `<span class="vehicle-badge ${badgeClass}">${badgeText}</span>` : ''}
        ${v.image_url
          ? `<img src="${v.image_url}" alt="${v.title}" loading="lazy">`
          : `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.7">
              <circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/>
              <path d="M6 15V7h4l5 4h3l2 4"/><path d="M18 15V9"/>
            </svg>`
        }
      </div>
      <div class="vehicle-card-body">
        <h3>${v.title || v.brand + ' ' + v.model}</h3>
        <p class="vehicle-card-desc">${v.description || ''}</p>
        ${specEntries.length ? `
          <div class="vehicle-specs">
            ${specEntries.map(s => `<span class="vehicle-spec">${s}</span>`).join('')}
          </div>
        ` : ''}
        ${v.price ? `
          <div class="vehicle-price-row">
            <span class="vehicle-price-label">${v.price_label || 'Från'}</span>
            <span class="vehicle-price">${formatPrice(v.price)}</span>
          </div>
          <span class="vehicle-financing">Finansiering via Wasa Kredit</span>
        ` : ''}
        ${!v.is_sold ? `
          <a href="tel:+46703218232" class="vehicle-card-cta" onclick="event.stopPropagation()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.11 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Ring om denna
          </a>
        ` : ''}
      </div>
    </article>
  `;
}

function renderBlogCard(post) {
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return `
    <a href="blogg-post.html?slug=${post.slug}" class="blog-card">
      <div class="blog-card-img">
        ${post.image_url
          ? `<img src="${post.image_url}" alt="${post.title}" loading="lazy">`
          : `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.15">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>`
        }
      </div>
      <div class="blog-card-body">
        ${date ? `<span class="blog-card-date">${date}</span>` : ''}
        <h3>${post.title}</h3>
        ${post.excerpt ? `<p>${post.excerpt}</p>` : ''}
      </div>
    </a>
  `;
}

/* Render vehicle grid into a container */
async function renderVehicleGrid(containerId, category, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Show skeleton
  container.innerHTML = Array(4).fill('<div class="vehicle-card"><div class="vehicle-card-img skeleton" style="height:200px"></div><div class="vehicle-card-body"><div class="skeleton" style="height:20px;width:60%;margin-bottom:8px"></div><div class="skeleton" style="height:14px;width:90%;margin-bottom:14px"></div><div class="skeleton" style="height:14px;width:40%"></div></div></div>').join('');

  const vehicles = await loadVehicles(category, options);

  if (!vehicles.length) {
    container.innerHTML = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="12" cy="12" r="10"/><path d="M8 15h8M9 9h.01M15 9h.01"/></svg><p>Inga fordon att visa just nu. Kontakta oss for aktuellt lager.</p></div>';
    return;
  }

  container.innerHTML = vehicles.map(v => renderVehicleCard(v)).join('');
}

/* Render featured vehicle carousel */
async function renderFeaturedCarousel(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const vehicles = await loadFeaturedVehicles(6);
  if (!vehicles.length) return;

  container.innerHTML = vehicles.map(v => renderVehicleCard(v)).join('');
}

/* Render blog grid */
async function renderBlogGrid(containerId, limit = 10) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = Array(3).fill('<div class="blog-card"><div class="blog-card-img skeleton" style="height:180px"></div><div class="blog-card-body"><div class="skeleton" style="height:14px;width:30%;margin-bottom:8px"></div><div class="skeleton" style="height:18px;width:80%"></div></div></div>').join('');

  const posts = await loadBlogPosts(limit);

  if (!posts.length) {
    container.innerHTML = '<div class="empty-state"><p>Inga inlagg publicerade an. Kom tillbaka snart!</p></div>';
    return;
  }

  container.innerHTML = posts.map(p => renderBlogCard(p)).join('');
}

/* Render single blog post */
async function renderBlogPost(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) {
    container.innerHTML = '<div class="empty-state"><p>Inget inlagg valt.</p></div>';
    return;
  }

  const post = await loadBlogPost(slug);
  if (!post) {
    container.innerHTML = '<div class="empty-state"><p>Inlägget kunde inte hittas.</p></div>';
    return;
  }

  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  // Simple markdown-to-html
  let html = post.content || '';
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" loading="lazy">');
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  html = html.replace(/<p><h([23])>/g, '<h$1>').replace(/<\/h([23])><\/p>/g, '</h$1>');

  // Update page title
  document.title = post.title + ' | HM Motor Blogg';

  container.innerHTML = `
    <h1>${post.title}</h1>
    <div class="blog-post-meta">
      ${date ? `<span>${date}</span>` : ''}
      <span>${post.author || 'HM Motor'}</span>
    </div>
    ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" style="border-radius:var(--radius-lg);margin-bottom:32px;width:100%">` : ''}
    ${html}
  `;
}
