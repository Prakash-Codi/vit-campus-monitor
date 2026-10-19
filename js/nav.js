// Common navigation and footer injection for VIT Vellore Campus Environment Monitor

const NAV_ITEMS = [
  { href: 'index.html', label: '01. Overview', id: 'nav-overview' },
  { href: 'electricity.html', label: '02. Electricity', id: 'nav-electricity' },
  { href: 'climate.html', label: '03. Climate', id: 'nav-climate' },
  { href: 'emissions.html', label: '04. CO2 Emissions', id: 'nav-emissions' },
  { href: 'map.html', label: '05. Hotspot Map', id: 'nav-map' },
  { href: 'buildings.html', label: '06. Buildings & Facilities', id: 'nav-buildings' },
  { href: 'methods.html', label: '07. Method & Sources', id: 'nav-methods' }
];

function initSiteHeader(activePageId) {
  const headerContainer = document.getElementById('site-header-container');
  if (!headerContainer) return;

  const navLinks = NAV_ITEMS.map(item => {
    const isActive = item.id === activePageId ? ' class="active" aria-current="page"' : '';
    return `<li class="nav-item"><a href="${item.href}"${isActive}>${item.label}</a></li>`;
  }).join('');

  headerContainer.innerHTML = `
    <header class="site-header">
      <div class="header-inner">
        <div class="project-meta-strip">
          <span>MDP-2024 • Academic Multidisciplinary Project</span>
          <span>Vellore Institute of Technology • Katpadi Campus (12.969° N, 79.156° E)</span>
          <span>Status: Verified Field & Audit Data</span>
        </div>
        <div class="site-title-row">
          <div>
            <div class="section-label">Campus Environment Monitor</div>
            <h1 class="site-title"><a href="index.html">VIT Vellore Environment Monitor</a></h1>
          </div>
          <p class="site-subtitle">A spatial and empirical investigation into electricity demand peaks, microclimate variation, cooling efficiency, and decarbonisation pathways across 372 acres.</p>
        </div>
        <nav class="main-nav" aria-label="Section navigation">
          <ul class="nav-list">
            ${navLinks}
          </ul>
        </nav>
      </div>
    </header>
  `;
}

function initSiteFooter() {
  const footerContainer = document.getElementById('site-footer-container');
  if (!footerContainer) return;

  footerContainer.innerHTML = `
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-col" style="max-width: 320px;">
          <h4>Project Metadata</h4>
          <p style="font-size: 0.8rem; line-height: 1.4;">
            <strong>Project:</strong> VIT Vellore Campus Environment Monitor<br>
            <strong>Curriculum:</strong> Multidisciplinary Project (MDP)<br>
            <strong>Investigating Schools:</strong> SMEC (Mechanical) & SELECT (Electrical)<br>
            <strong>Supervision:</strong> Dept. of Energy & Power Electronics
          </p>
        </div>
        <div class="footer-col" style="max-width: 340px;">
          <h4>Primary Audit Baselines</h4>
          <p style="font-size: 0.8rem; line-height: 1.4;">
            • <em>Energy Audit Report (2020)</em>, Certified Energy Auditor EA3024<br>
            • <em>Green Audit Report (2023)</em>, Eco Services India Pvt. Ltd.<br>
            • <em>Environmental Audit Report (2024)</em>, Eco Services India Pvt. Ltd.<br>
            • <em>Field Measurements & Substation Logbooks</em>
          </p>
        </div>
        <div class="footer-col" style="max-width: 280px;">
          <h4>Data Standard</h4>
          <p style="font-size: 0.8rem; line-height: 1.4;">
            Measured readings originate from substation billing meters & TANGEDCO invoices. Lab and building allocations are transparent <span class="badge-tag estimate">Modelled Estimates</span> derived from connected loads.
          </p>
          <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-faint); margin-top: 0.5rem;">
            Last data update: October 2024
          </div>
        </div>
      </div>
    </footer>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const activeId = document.body.dataset.pageId;
  initSiteHeader(activeId);
  initSiteFooter();
});