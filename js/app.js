(function () {
  'use strict';

  // ===== State =====
  let songs = [];
  let activeFilters = {}; // { dimensionKey: Set of values }
  let searchQuery = '';
  let commercialOnly = true;

  // ===== Dimension config =====
  const DIMENSIONS = [
    { key: 'productLine', label: '产品线' },
    { key: 'genre', label: '风格流派' },
    { key: 'mood', label: '情绪调性' },
    { key: 'whyPopular', label: '热度原因' },
    { key: 'targetAudience', label: '受众人群' },
    { key: 'lightColor', label: '光线色调' },
    { key: 'atmosphere', label: '氛围感受' },
    { key: 'rhythmCamera', label: '节奏运镜' },
    { key: 'space', label: '空间场景' },
    { key: 'seasonWeather', label: '季节天气' },
    { key: 'ownerPersona', label: '主人画像' },
    { key: 'petType', label: '宠物类型' },
    { key: 'petTemperament', label: '宠物气质' },
    { key: 'relationship', label: '人物关系' },
  ];

  const DISPLAY_DIMS = [
    { key: 'mood', label: '情绪' },
    { key: 'whyPopular', label: '热度' },
    { key: 'targetAudience', label: '受众' },
    { key: 'atmosphere', label: '氛围' },
    { key: 'productLine', label: '产品线' },
    { key: 'petType', label: '宠物' },
    { key: 'space', label: '场景' },
    { key: 'ownerPersona', label: '主人' },
  ];

  // ===== DOM refs =====
  const $grid = document.getElementById('songGrid');
  const $empty = document.getElementById('emptyState');
  const $count = document.getElementById('songCount');
  const $results = document.getElementById('resultsBar');
  const $groups = document.getElementById('filterGroups');
  const $search = document.getElementById('searchInput');
  const $toggle = document.getElementById('toggleCommercial');
  const $btnClear = document.getElementById('btnClear');
  const $btnReset = document.getElementById('btnReset');

  // ===== Load data =====
  async function load() {
    try {
      const res = await fetch('data/songs.json');
      const data = await res.json();
      songs = data.songs || [];
      buildFilters();
      render();
    } catch (e) {
      $grid.innerHTML = '<div class="empty-state"><p>加载曲库失败</p></div>';
    }
  }

  const STRING_DIMS = ['whyPopular', 'targetAudience'];

  // ===== Build filter tags from data =====
  function buildFilters() {
    // Collect all values per dimension
    const dimValues = {};
    DIMENSIONS.forEach(d => { dimValues[d.key] = new Set(); });

    songs.forEach(s => {
      DIMENSIONS.forEach(d => {
        const vals = s[d.key];
        if (!vals) return;
        if (Array.isArray(vals)) {
          vals.forEach(v => dimValues[d.key].add(v));
        } else if (STRING_DIMS.includes(d.key)) {
          // Split string fields by Chinese/English delimiters
          vals.split(/[·,，、]/).forEach(v => {
            const trimmed = v.trim();
            if (trimmed) dimValues[d.key].add(trimmed);
          });
        }
      });
    });

    // Render filter groups
    $groups.innerHTML = DIMENSIONS.map(d => {
      const values = [...dimValues[d.key]].sort();
      if (values.length === 0) return '';
      const tags = values.map(v => {
        const slug = `${d.key}:${v}`;
        return `<button class="filter-tag" data-dim="${d.key}" data-val="${v}" data-slug="${slug}">${v}</button>`;
      }).join('');
      return `<div class="filter-group">
        <div class="filter-group-title">${d.label}</div>
        <div class="filter-tags">${tags}</div>
      </div>`;
    }).join('');

    // Bind clicks
    $groups.querySelectorAll('.filter-tag').forEach(btn => {
      btn.addEventListener('click', () => toggleFilter(btn.dataset.dim, btn.dataset.val));
    });
  }

  // ===== Toggle filter =====
  function toggleFilter(dim, val) {
    if (!activeFilters[dim]) activeFilters[dim] = new Set();
    if (activeFilters[dim].has(val)) {
      activeFilters[dim].delete(val);
      if (activeFilters[dim].size === 0) delete activeFilters[dim];
    } else {
      activeFilters[dim].add(val);
    }
    render();
  }

  // ===== Clear all filters =====
  function clearFilters() {
    activeFilters = {};
    searchQuery = '';
    $search.value = '';
    render();
  }

  // ===== Filter logic =====
  function getFiltered() {
    let filtered = songs;

    // Commercial only
    if (commercialOnly) {
      filtered = filtered.filter(s => s.commercialUse === true);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(s =>
        s.song.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.genre.some(g => g.toLowerCase().includes(q)) ||
        s.mood.some(m => m.toLowerCase().includes(q))
      );
    }

    // Dimension filters (AND across dimensions, OR within a dimension)
    Object.entries(activeFilters).forEach(([dim, vals]) => {
      if (vals.size === 0) return;
      filtered = filtered.filter(s => {
        const songVals = s[dim];
        if (!songVals) return false;
        if (Array.isArray(songVals)) {
          return [...vals].some(v => songVals.includes(v));
        }
        // String field: check if any filter value is a substring
        return [...vals].some(v => songVals.includes(v));
      });
    });

    return filtered;
  }

  // ===== Render =====
  function render() {
    const filtered = getFiltered();

    // Update count
    $count.textContent = `${songs.length} 首 · 匹配 ${filtered.length} 首`;

    // Update clear button
    const hasFilters = Object.keys(activeFilters).length > 0 || searchQuery.trim() || !commercialOnly;
    $btnClear.disabled = !hasFilters;

    // Update filter tag active states
    $groups.querySelectorAll('.filter-tag').forEach(btn => {
      const dim = btn.dataset.dim;
      const val = btn.dataset.val;
      const isActive = activeFilters[dim] && activeFilters[dim].has(val);
      btn.classList.toggle('active', isActive);
    });

    // Active filter pills
    const pills = [];
    Object.entries(activeFilters).forEach(([dim, vals]) => {
      vals.forEach(v => {
        pills.push({ dim, val });
      });
    });
    if (searchQuery) pills.push({ dim: 'search', val: `"${searchQuery}"` });

    $results.innerHTML = pills.length > 0
      ? `<div class="active-tags">${pills.map(p =>
          `<span class="active-tag-pill">${p.val}<span class="remove" data-dim="${p.dim}" data-val="${p.val}">&times;</span></span>`
        ).join('')}</div>`
      : '';

    // Bind remove pill clicks
    $results.querySelectorAll('.remove').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.dim === 'search') {
          searchQuery = '';
          $search.value = '';
        } else {
          toggleFilter(btn.dataset.dim, btn.dataset.val);
        }
      });
    });

    // Empty state
    if (filtered.length === 0) {
      $grid.innerHTML = '';
      $empty.hidden = false;
      return;
    }
    $empty.hidden = true;

    // Render cards
    $grid.innerHTML = filtered.map(s => {
      const canUse = s.commercialUse;
      const badge = canUse
        ? '<span class="badge badge-ok">可商用</span>'
        : '<span class="badge badge-no">需授权</span>';

      const genreTags = (s.genre || []).map(g => `<span class="card-tag">${g}</span>`).join('');

      const dimRows = DISPLAY_DIMS.map(d => {
        const vals = s[d.key];
        if (!vals) return '';
        if (Array.isArray(vals) && vals.length === 0) return '';
        const display = Array.isArray(vals) ? vals.join(' · ') : vals;
        return `<span class="dim-label">${d.label}</span><span class="dim-value">${display}</span>`;
      }).filter(Boolean).join('');

      return `<div class="song-card">
        <div class="card-header">
          <div>
            <div class="card-title">${s.song}</div>
            <div class="card-artist">${s.artist}</div>
          </div>
          ${badge}
        </div>
        <div class="card-tags">${genreTags}</div>
        <div class="card-dimensions">${dimRows}</div>
        <div class="card-footer">
          <span>${s.copyrightOwner || ''}</span>
          ${s.alternativeSearch ? `<span class="alt-search">🔍 ${s.alternativeSearch}</span>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  // ===== Events =====
  $search.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    render();
  });

  $toggle.addEventListener('change', (e) => {
    commercialOnly = e.target.checked;
    // If toggling to commercial-only, hide the badge-no songs
    render();
  });

  $btnClear.addEventListener('click', clearFilters);
  $btnReset.addEventListener('click', clearFilters);

  // ===== Init =====
  load();
})();
