// Emissions breakdown chart for emissions.html

document.addEventListener('DOMContentLoaded', async () => {
  const ctx = document.getElementById('emissionsBreakdownChart');
  if (!ctx) return;

  const res = await fetch('data/emissions_and_cooling.json').then(r => r.json()).catch(() => null);
  if (!res || !res.campus_co2_balance_annual) return;

  const sources = res.campus_co2_balance_annual.gross_emissions_sources_tons_per_year_2024;

  const labels = [
    'Net Grid Electricity (23,968 t)',
    'Canteen LPG Combustion (2,525 t)',
    'Transport Diesel Vehicles (943 t)',
    'Emergency DG Sets (766 t)',
    'Campus Petrol Fleet (13 t)'
  ];

  const data = [
    sources.grid_electricity,
    sources.canteen_lpg,
    sources.transport_diesel,
    sources.diesel_generators_emergency,
    sources.petrol_vehicles
  ];

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#183358', // Deep Navy for Grid
          '#b45309', // Amber for LPG
          '#475569', // Slate for Transport
          '#8b2626', // Crimson for DGs
          '#64748b'  // Grey for Petrol
        ],
        borderWidth: 1,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: { family: "'IBM Plex Sans', sans-serif", size: 12 },
            boxWidth: 14,
            padding: 12
          }
        },
        tooltip: {
          callbacks: {
            label: (item) => {
              const val = item.raw;
              const pct = ((val / 30757) * 100).toFixed(1);
              return ` ${val.toLocaleString()} tonnes CO₂e (${pct}%)`;
            }
          }
        }
      }
    }
  });
});