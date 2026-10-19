// Search, filter, and sorting logic for buildings.html

let allBuildings = [];
let currentCategory = 'ALL';
let currentSearch = '';
let sortDirection = {};

document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('buildingsTableBody');
  if (!tbody) return;

  const data = await fetch('data/buildings_catalog.json').then(r => r.json()).catch(() => null);
  if (data && data.buildings) {
    allBuildings = data.buildings;
    renderTable();
    setupFilters();
  }
});

function setupFilters() {
  const searchInput = document.getElementById('searchInput');
  const catSelect = document.getElementById('categoryFilter');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      renderTable();
    });
  }

  if (catSelect) {
    catSelect.addEventListener('change', (e) => {
      currentCategory = e.target.value;
      renderTable();
    });
  }
}

function renderTable() {
  const tbody = document.getElementById('buildingsTableBody');
  const countEl = document.getElementById('recordCount');
  if (!tbody) return;

  const filtered = allBuildings.filter(b => {
    const matchesCat = currentCategory === 'ALL' || b.category === currentCategory;
    const matchesSearch = !currentSearch || 
      b.name.toLowerCase().includes(currentSearch) ||
      b.type.toLowerCase().includes(currentSearch) ||
      b.features.toLowerCase().includes(currentSearch);
    return matchesCat && matchesSearch;
  });

  if (countEl) countEl.textContent = filtered.length;

  tbody.innerHTML = filtered.map(b => {
    return `
      <tr>
        <td><strong>${b.name}</strong></td>
        <td><span class="badge-category ${b.category}">${b.category}</span></td>
        <td style="font-size: 0.82rem;">${b.type}</td>
        <td class="num-cell">${b.floors || '—'}</td>
        <td class="num-cell">${b.capacity ? b.capacity.toLocaleString() : '—'}</td>
        <td class="num-cell">${b.area_sqm ? b.area_sqm.toLocaleString() : '—'}</td>
        <td style="font-size: 0.82rem; color: #444;">${b.features}</td>
        <td style="font-family: var(--font-mono); font-size: 0.75rem;">
          <a href="map.html" title="View on Campus Map" style="color: var(--accent-navy); text-decoration: underline;">
            ${b.lat.toFixed(4)}, ${b.lng.toFixed(4)}
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

window.sortTable = function(colIdx) {
  sortDirection[colIdx] = !sortDirection[colIdx];
  const isAsc = sortDirection[colIdx];

  allBuildings.sort((a, b) => {
    let valA, valB;
    if (colIdx === 0) { valA = a.name; valB = b.name; }
    else if (colIdx === 1) { valA = a.category; valB = b.category; }
    else if (colIdx === 3) { valA = a.floors || 0; valB = b.floors || 0; }
    else if (colIdx === 4) { valA = a.capacity || 0; valB = b.capacity || 0; }
    else if (colIdx === 5) { valA = a.area_sqm || 0; valB = b.area_sqm || 0; }
    else return 0;

    if (valA < valB) return isAsc ? -1 : 1;
    if (valA > valB) return isAsc ? 1 : -1;
    return 0;
  });

  renderTable();
};