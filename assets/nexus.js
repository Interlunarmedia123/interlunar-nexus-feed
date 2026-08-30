async function initNexusFeed(dataUrl) {
  const grid = document.getElementById('grid');
  const emptyState = document.getElementById('empty-state');
  const statCards = document.getElementById('stat-cards');
  const statSources = document.getElementById('stat-sources');
  const catFilters = document.getElementById('cat-filters');
  const srcFilters = document.getElementById('src-filters');
  const resetBtn = document.getElementById('reset-filters');

  const res = await fetch(dataUrl);
  const data = await res.json();
  const items = data.items || [];

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
        <article class="card">
          <div class="cat">${escapeHtml(i.category)}</div>
          <h3><a href="${escapeHtml(i.url)}" target="_blank" rel="noopener">${escapeHtml(i.title)}</a></h3>
          <p class="why">${escapeHtml(i.why)}</p>
          <div class="rowmeta">
            <span>${escapeHtml(i.source)} &middot; ${escapeHtml(i.dateLabel || '')}</span>
            ${statusBadge}
          </div>
          <div class="footer-row">
            <a class="feedback-link" href="mailto:support@interlunarmedia.com.au?subject=Nexus%20Feed%20feedback%3A%20${encodeURIComponent(i.title)}">Feedback</a>
          </div>
        </article>
      `;
    }).join('');

    emptyState.style.display = filtered.length ? 'none' : 'block';
    statCards.textContent = `${filtered.length} card${filtered.length === 1 ? '' : 's'}`;
    const visibleSources = new Set(filtered.map(i => i.source));
    statSources.textContent = `${visibleSources.size} source${visibleSources.size === 1 ? '' : 's'}`;
  }

  render();
}
