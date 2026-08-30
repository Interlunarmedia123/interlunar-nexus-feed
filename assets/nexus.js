async function initNexusFeed(dataUrl) {
  const grid = document.getElementById('grid');
  const emptyState = document.getElementById('empty-state');
  const statCards = document.getElementById('stat-cards');
  const statSources = document.getElementById('stat-sources');
  const catFilters = document.getElementById('cat-filters');
  const srcFilters = document.getElementById('src-filters');
  const resetBtn = document.getElementById('reset-filters');

  const supabase = (window.supabase && window.NEXUS_SUPABASE_URL)
    ? window.supabase.createClient(window.NEXUS_SUPABASE_URL, window.NEXUS_SUPABASE_ANON_KEY)
    : null;

  const res = await fetch(dataUrl);
  const data = await res.json();
  const items = data.items || [];
  const issue = data.issue || '';

  const categories = [...new Set(items.map(i => i.category))];
  const sources = [...new Set(items.map(i => i.source))].sort();

  let activeCat = null;
  let activeSrc = null;

  function chip(label, onClick, container) {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.type = 'button';
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    container.appendChild(btn);
    return btn;
  }

  const catButtons = {};
  categories.forEach(cat => {
    catButtons[cat] = chip(cat, () => {
      activeCat = activeCat === cat ? null : cat;
      render();
    }, catFilters);
  });

  const srcButtons = {};
  sources.forEach(src => {
    srcButtons[src] = chip(src, () => {
      activeSrc = activeSrc === src ? null : src;
      render();
    }, srcFilters);
  });

  resetBtn.addEventListener('click', () => {
    activeCat = null;
    activeSrc = null;
    render();
  });

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  async function sendMark(itemId, mark, btnUp, btnDown) {
    if (!supabase) return;
    btnUp.disabled = true;
    btnDown.disabled = true;
    const { error } = await supabase.from('marks').insert({ item_id: itemId, issue, mark });
    if (!error) {
      (mark === 'up' ? btnUp : btnDown).classList.add('marked');
    } else {
      btnUp.disabled = false;
      btnDown.disabled = false;
    }
  }

  async function sendNote(itemId, textarea, saveBtn, statusEl) {
    if (!supabase) return;
    const note = textarea.value.trim();
    if (!note) return;
    saveBtn.disabled = true;
    const { error } = await supabase.from('notes').insert({ item_id: itemId, issue, note });
    if (!error) {
      statusEl.textContent = 'Saved';
      textarea.value = '';
    } else {
      statusEl.textContent = 'Could not save, try again';
      saveBtn.disabled = false;
    }
  }

  function render() {
    Object.entries(catButtons).forEach(([cat, btn]) => btn.classList.toggle('active', activeCat === cat));
    Object.entries(srcButtons).forEach(([src, btn]) => btn.classList.toggle('active', activeSrc === src));

    const filtered = items.filter(i =>
      (!activeCat || i.category === activeCat) &&
      (!activeSrc || i.source === activeSrc)
    );

    grid.innerHTML = filtered.map(i => {
      const statusBadge = i.status
        ? `<span class="status-badge status-${i.status.toLowerCase()}">${escapeHtml(i.status)}</span>`
        : '';
      return `
        <article class="card" data-item-id="${escapeHtml(i.id)}">
          <div class="cat">${escapeHtml(i.category)}</div>
          <h3><a href="${escapeHtml(i.url)}" target="_blank" rel="noopener">${escapeHtml(i.title)}</a></h3>
          <p class="why">${escapeHtml(i.why)}</p>
          <div class="rowmeta">
            <span>${escapeHtml(i.source)} &middot; ${escapeHtml(i.dateLabel || '')}</span>
            ${statusBadge}
          </div>
          <div class="footer-row">
            <div class="mark-btns">
              <button type="button" class="mark-btn mark-up" title="Relevant" aria-label="Mark relevant">&#128077;</button>
              <button type="button" class="mark-btn mark-down" title="Not relevant" aria-label="Mark not relevant">&#128078;</button>
            </div>
            <button type="button" class="note-toggle">Note</button>
          </div>
          <div class="note-box" hidden>
            <textarea rows="2" placeholder="What should change about picks like this?"></textarea>
            <div class="note-actions">
              <button type="button" class="note-save">Save note</button>
              <span class="note-status"></span>
            </div>
          </div>
        </article>
      `;
    }).join('');

    grid.querySelectorAll('.card').forEach(card => {
      const itemId = card.dataset.itemId;
      const btnUp = card.querySelector('.mark-up');
      const btnDown = card.querySelector('.mark-down');
      btnUp.addEventListener('click', () => sendMark(itemId, 'up', btnUp, btnDown));
      btnDown.addEventListener('click', () => sendMark(itemId, 'down', btnUp, btnDown));

      const noteToggle = card.querySelector('.note-toggle');
      const noteBox = card.querySelector('.note-box');
      noteToggle.addEventListener('click', () => {
        noteBox.hidden = !noteBox.hidden;
      });

      const textarea = card.querySelector('textarea');
      const saveBtn = card.querySelector('.note-save');
      const statusEl = card.querySelector('.note-status');
      saveBtn.addEventListener('click', () => sendNote(itemId, textarea, saveBtn, statusEl));
    });

    emptyState.style.display = filtered.length ? 'none' : 'block';
    statCards.textContent = `${filtered.length} card${filtered.length === 1 ? '' : 's'}`;
    const visibleSources = new Set(filtered.map(i => i.source));
    statSources.textContent = `${visibleSources.size} source${visibleSources.size === 1 ? '' : 's'}`;
  }

  render();
  initSourceForm(supabase);
}

function initSourceForm(supabase) {
  const form = document.getElementById('source-form');
  if (!form) return;
  const status = document.getElementById('source-form-status');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!supabase) return;
    const name = form.elements['name'].value.trim();
    const url = form.elements['url'].value.trim();
    const note = form.elements['note'].value.trim();
    if (!name) return;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    const { error } = await supabase.from('suggested_sources').insert({ name, url, note });
    if (!error) {
      status.textContent = 'Thanks, added to the review list.';
      form.reset();
    } else {
      status.textContent = 'Could not submit, try again.';
    }
    submitBtn.disabled = false;
  });
}
