/* ═══════════════════════════════════════════════════════
   HM MOTOR — Admin CRUD
   Simple client-side admin for vehicles & blog posts
   ═══════════════════════════════════════════════════════ */

const ADMIN_PASSWORD = 'hmmotor2026';

/* ─── Auth ─── */

function checkAuth() {
  return sessionStorage.getItem('hm_admin') === 'true';
}

function login(pwd) {
  if (pwd === ADMIN_PASSWORD) {
    sessionStorage.setItem('hm_admin', 'true');
    return true;
  }
  return false;
}

function handleLogin(e) {
  e.preventDefault();
  const pwd = document.getElementById('adminPassword').value;
  if (login(pwd)) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    adminLoadVehicles();
  } else {
    document.getElementById('loginError').textContent = 'Fel lösenord';
  }
}

/* ─── Slug generation ─── */

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/* ─── Tab switching ─── */

function switchTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

  document.getElementById('vehiclesPanel').style.display = tab === 'vehicles' ? 'block' : 'none';
  document.getElementById('blogPanel').style.display = tab === 'blog' ? 'block' : 'none';

  if (tab === 'vehicles') adminLoadVehicles();
  if (tab === 'blog') adminLoadBlog();
}

/* ─── Modal ─── */

function closeModal() {
  document.querySelectorAll('.admin-modal').forEach(m => m.classList.remove('open'));
}

/* ═══════════════════ VEHICLE CRUD ═══════════════════ */

async function adminLoadVehicles() {
  const sb = getSupabase();
  if (!sb) return;

  const { data, error } = await sb
    .from('hm_vehicles')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) { console.error(error); return; }

  const tbody = document.getElementById('vehicleTableBody');
  if (!tbody) return;

  if (!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-dark-muted)">Inga fordon</td></tr>';
    return;
  }

  const countEl = document.getElementById('vehicleCount');
  if (countEl) countEl.textContent = data.length + ' fordon';

  tbody.innerHTML = data.map(v => `
    <tr>
      <td>${v.image_url ? `<img class="thumb" src="${v.image_url}" alt="">` : '<div class="thumb" style="display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:10px">—</div>'}</td>
      <td><strong>${v.title || v.brand + ' ' + v.model}</strong></td>
      <td>${v.category || ''}</td>
      <td>${v.price ? formatPrice(v.price) : '—'}</td>
      <td>${v.is_featured ? '<span class="badge-featured">Utvald</span>' : ''}${v.is_sold ? '<span class="badge-sold">Såld</span>' : ''}</td>
      <td class="actions">
        <button class="edit" onclick="showVehicleForm(${JSON.stringify(v).replace(/"/g, '&quot;')})">Redigera</button>
        <button class="del" onclick="adminDeleteVehicle('${v.id}')">Ta bort</button>
      </td>
    </tr>
  `).join('');
}

async function adminSaveVehicle(formData) {
  const sb = getSupabase();
  if (!sb) return;

  const record = {
    title: formData.title,
    slug: formData.slug || generateSlug(formData.title),
    category: formData.category,
    brand: formData.brand,
    model: formData.model,
    year: formData.year ? parseInt(formData.year) : null,
    price: formData.price ? parseInt(formData.price) : null,
    price_label: formData.price_label || 'Pris',
    mileage: formData.mileage || null,
    fuel: formData.fuel || null,
    transmission: formData.transmission || null,
    description: formData.description || null,
    image_url: formData.image_url || null,
    badge: formData.badge || null,
    is_featured: formData.is_featured || false,
    is_sold: formData.is_sold || false,
    specs: {},
    sort_order: formData.sort_order ? parseInt(formData.sort_order) : 100,
  };

  // Build specs object
  if (formData.spec_motor) record.specs.motor = formData.spec_motor;
  if (formData.spec_drivlina) record.specs['drivlina/typ'] = formData.spec_drivlina;
  if (formData.spec_utrustning) record.specs.utrustning = formData.spec_utrustning;

  let result;
  if (formData.id) {
    result = await sb.from('hm_vehicles').update(record).eq('id', formData.id);
  } else {
    result = await sb.from('hm_vehicles').insert(record);
  }

  if (result.error) {
    alert('Fel: ' + result.error.message);
    return;
  }

  closeModal();
  adminLoadVehicles();
}

async function adminDeleteVehicle(id) {
  if (!confirm('Vill du verkligen ta bort detta fordon?')) return;

  const sb = getSupabase();
  if (!sb) return;

  const { error } = await sb.from('hm_vehicles').delete().eq('id', id);
  if (error) { alert('Fel: ' + error.message); return; }

  adminLoadVehicles();
}

function showVehicleForm(vehicle) {
  // vehicle can be null (new) or an object (editing)
  // If called from onclick with JSON, it arrives as object already
  const v = vehicle || {};
  const specs = v.specs || {};
  const isEdit = !!v.id;

  const modal = document.getElementById('vehicleModal');
  document.getElementById('vehicleFormTitle').textContent = isEdit ? 'Redigera fordon' : 'Nytt fordon';

  document.getElementById('v_id').value = v.id || '';
  document.getElementById('v_title').value = v.title || '';
  document.getElementById('v_slug').value = v.slug || '';
  document.getElementById('v_category').value = v.category || 'car';
  document.getElementById('v_brand').value = v.brand || '';
  document.getElementById('v_model').value = v.model || '';
  document.getElementById('v_year').value = v.year || '';
  document.getElementById('v_price').value = v.price || '';
  document.getElementById('v_price_label').value = v.price_label || 'Pris';
  document.getElementById('v_mileage').value = v.mileage || '';
  document.getElementById('v_fuel').value = v.fuel || '';
  document.getElementById('v_transmission').value = v.transmission || '';
  document.getElementById('v_description').value = v.description || '';
  document.getElementById('v_image_url').value = v.image_url || '';
  document.getElementById('v_badge').value = v.badge || '';
  document.getElementById('v_is_featured').checked = v.is_featured || false;
  document.getElementById('v_is_sold').checked = v.is_sold || false;
  document.getElementById('v_spec_motor').value = specs.motor || '';
  document.getElementById('v_spec_drivlina').value = specs['drivlina/typ'] || '';
  document.getElementById('v_spec_utrustning').value = specs.utrustning || '';
  document.getElementById('v_sort_order').value = v.sort_order || 100;

  // Show image preview if exists
  updateImagePreview('v_image_url', 'v_image_preview');

  modal.classList.add('open');
}

function handleVehicleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  adminSaveVehicle({
    id: form.v_id.value || null,
    title: form.v_title.value,
    slug: form.v_slug.value || generateSlug(form.v_title.value),
    category: form.v_category.value,
    brand: form.v_brand.value,
    model: form.v_model.value,
    year: form.v_year.value,
    price: form.v_price.value,
    price_label: form.v_price_label.value,
    mileage: form.v_mileage.value,
    fuel: form.v_fuel.value,
    transmission: form.v_transmission.value,
    description: form.v_description.value,
    image_url: form.v_image_url.value,
    badge: form.v_badge.value,
    is_featured: form.v_is_featured.checked,
    is_sold: form.v_is_sold.checked,
    spec_motor: form.v_spec_motor.value,
    spec_drivlina: form.v_spec_drivlina.value,
    spec_utrustning: form.v_spec_utrustning.value,
    sort_order: form.v_sort_order.value,
  });
}

// Auto-generate slug from title
function autoSlugVehicle() {
  const title = document.getElementById('v_title').value;
  const slugField = document.getElementById('v_slug');
  if (!slugField.dataset.manual) {
    slugField.value = generateSlug(title);
  }
}

/* ═══════════════════ BLOG CRUD ═══════════════════ */

async function adminLoadBlog() {
  const sb = getSupabase();
  if (!sb) return;

  const { data, error } = await sb
    .from('hm_blog')
    .select('*')
    .order('published_at', { ascending: false });

  if (error) { console.error(error); return; }

  const tbody = document.getElementById('blogTableBody');
  if (!tbody) return;

  if (!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-dark-muted)">Inga inlägg</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(p => {
    const date = p.published_at
      ? new Date(p.published_at).toLocaleDateString('sv-SE')
      : '—';
    return `
      <tr>
        <td><strong>${p.title}</strong></td>
        <td>${p.published ? 'Ja' : 'Nej'}</td>
        <td>${date}</td>
        <td class="admin-actions">
          <button class="admin-btn" onclick='showBlogForm(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Redigera</button>
          <button class="admin-btn admin-btn--danger" onclick="adminDeleteBlogPost('${p.id}')">Ta bort</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function adminSaveBlogPost(formData) {
  const sb = getSupabase();
  if (!sb) return;

  const record = {
    title: formData.title,
    slug: formData.slug || generateSlug(formData.title),
    excerpt: formData.excerpt || null,
    content: formData.content || null,
    image_url: formData.image_url || null,
    author: formData.author || 'Håkan Mikaelsson',
    published: formData.published || false,
    published_at: formData.published ? new Date().toISOString() : null,
  };

  let result;
  if (formData.id) {
    // Keep existing published_at if already set
    if (formData.existing_published_at && formData.published) {
      record.published_at = formData.existing_published_at;
    }
    result = await sb.from('hm_blog').update(record).eq('id', formData.id);
  } else {
    result = await sb.from('hm_blog').insert(record);
  }

  if (result.error) {
    alert('Fel: ' + result.error.message);
    return;
  }

  closeModal();
  adminLoadBlog();
}

async function adminDeleteBlogPost(id) {
  if (!confirm('Vill du verkligen ta bort detta inlägg?')) return;

  const sb = getSupabase();
  if (!sb) return;

  const { error } = await sb.from('hm_blog').delete().eq('id', id);
  if (error) { alert('Fel: ' + error.message); return; }

  adminLoadBlog();
}

function showBlogForm(post) {
  const p = post || {};
  const isEdit = !!p.id;

  const modal = document.getElementById('blogModal');
  document.getElementById('blogFormTitle').textContent = isEdit ? 'Redigera inlägg' : 'Nytt inlägg';

  document.getElementById('b_id').value = p.id || '';
  document.getElementById('b_existing_published_at').value = p.published_at || '';
  document.getElementById('b_title').value = p.title || '';
  document.getElementById('b_slug').value = p.slug || '';
  document.getElementById('b_excerpt').value = p.excerpt || '';
  document.getElementById('b_content').value = p.content || '';
  document.getElementById('b_image_url').value = p.image_url || '';
  document.getElementById('b_author').value = p.author || 'Håkan Mikaelsson';
  document.getElementById('b_published').checked = p.published || false;

  // Show image preview if exists
  updateImagePreview('b_image_url', 'b_image_preview');

  modal.classList.add('open');
}

function handleBlogSubmit(e) {
  e.preventDefault();
  const form = e.target;
  adminSaveBlogPost({
    id: form.b_id.value || null,
    existing_published_at: form.b_existing_published_at.value || null,
    title: form.b_title.value,
    slug: form.b_slug.value || generateSlug(form.b_title.value),
    excerpt: form.b_excerpt.value,
    content: form.b_content.value,
    image_url: form.b_image_url.value,
    author: form.b_author.value,
    published: form.b_published.checked,
  });
}

// Auto-generate slug from title
function autoSlugBlog() {
  const title = document.getElementById('b_title').value;
  const slugField = document.getElementById('b_slug');
  if (!slugField.dataset.manual) {
    slugField.value = generateSlug(title);
  }
}

/* ─── Image upload (converts to Supabase Storage or dataURL) ─── */

async function handleImageUpload(fileInput, urlField, previewId) {
  const file = fileInput.files[0];
  if (!file) return;

  const preview = document.getElementById(previewId);

  // Show loading
  if (preview) preview.innerHTML = '<span style="color:var(--text-dark-muted);font-size:0.82rem">Laddar upp...</span>';

  // Try Supabase Storage first
  const sb = getSupabase();
  if (sb) {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${generateSlug(file.name.replace('.' + ext, ''))}.${ext}`;

    const { data, error } = await sb.storage
      .from('hm-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (!error && data) {
      const { data: urlData } = sb.storage.from('hm-images').getPublicUrl(data.path);
      if (urlData && urlData.publicUrl) {
        document.getElementById(urlField).value = urlData.publicUrl;
        if (preview) preview.innerHTML = `<img src="${urlData.publicUrl}" style="max-height:120px;border-radius:8px;margin-top:8px">`;
        return;
      }
    }
    console.warn('Storage upload failed, falling back to dataURL:', error);
  }

  // Fallback: convert to compressed dataURL
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxW = 800;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      document.getElementById(urlField).value = dataUrl;
      if (preview) preview.innerHTML = `<img src="${dataUrl}" style="max-height:120px;border-radius:8px;margin-top:8px">`;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Show preview when URL field changes
function updateImagePreview(urlField, previewId) {
  const url = document.getElementById(urlField).value;
  const preview = document.getElementById(previewId);
  if (!preview) return;
  if (url && (url.startsWith('http') || url.startsWith('data:'))) {
    preview.innerHTML = `<img src="${url}" style="max-height:120px;border-radius:8px;margin-top:8px">`;
  } else {
    preview.innerHTML = '';
  }
}

/* ─── Init on load ─── */

document.addEventListener('DOMContentLoaded', () => {
  if (checkAuth()) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    adminLoadVehicles();
  }

  // Close modal on backdrop click
  document.querySelectorAll('.admin-modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  });
});
