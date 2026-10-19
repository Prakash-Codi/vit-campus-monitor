// Interactive Leaflet Map for VIT Vellore Campus Environment Monitor

let map;
let allHotspots = [];
let monthlyRecords = [];
let activeMonthIdx = 0;
let isPlaying = false;
let playInterval = null;

// Layer Groups
const layerGroups = {
  electricity: L.layerGroup(),
  temperature: L.layerGroup(),
  co2: L.layerGroup(),
  hostels: L.layerGroup(),
  academic: L.layerGroup(),
  substations: L.layerGroup(),
  renewables: L.layerGroup()
};

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('campusMap')) return;

  initMap();
  await loadDataAndSeedLayers();
  setupTimelineControls();
  renderQuickHotspotList();
});

function initMap() {
  const campusCenter = [12.9698, 79.1575];

  // Base Tiles (no paid keys)
  const cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  });

  const osmStandard = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  });

  const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19
  });

  map = L.map('campusMap', {
    center: campusCenter,
    zoom: 16,
    minZoom: 15,
    maxZoom: 18,
    layers: [cartoLight, layerGroups.electricity, layerGroups.co2, layerGroups.renewables]
  });

  // Base map controls
  const baseMaps = {
    'Plain Light (Report)': cartoLight,
    'OpenStreetMap': osmStandard,
    'Satellite (Esri Imagery)': esriSatellite
  };

  // Overlay layers
  const overlayMaps = {
    '⚡ Electricity Load': layerGroups.electricity,
    '🌡️ Microclimate / Temp': layerGroups.temperature,
    '💨 CO₂ Emitters & Sinks': layerGroups.co2,
    '🏢 Hostels (32 Blocks)': layerGroups.hostels,
    '🔬 Labs & Academic': layerGroups.academic,
    '🔌 Substations / PH': layerGroups.substations,
    '🌱 Renewables & Cooling': layerGroups.renewables
  };

  L.control.layers(baseMaps, overlayMaps, { collapsed: false, position: 'topright' }).addTo(map);

  // Coords display
  map.on('mousemove', (e) => {
    const coordsEl = document.getElementById('hoverCoords');
    if (coordsEl) {
      coordsEl.textContent = `${e.latlng.lat.toFixed(4)}° N, ${e.latlng.lng.toFixed(4)}° E`;
    }
  });

  map.on('zoomend', () => {
    const zoomEl = document.getElementById('currentZoom');
    if (zoomEl) zoomEl.textContent = map.getZoom();
  });
}

async function loadDataAndSeedLayers() {
  const [hotspotData, monthlyData, boundaryData] = await Promise.all([
    fetch('data/hotspots_catalog.json').then(r => r.json()).catch(() => null),
    fetch('data/energy_monthly_2019_2021.json').then(r => r.json()).catch(() => null),
    fetch('data/campus_osm_boundary.json').then(r => r.json()).catch(() => null)
  ]);

  if (hotspotData && hotspotData.hotspots) {
    allHotspots = hotspotData.hotspots;
  }

  if (monthlyData && monthlyData.records) {
    monthlyRecords = monthlyData.records;
  }

  // Draw official OSM campus polygon if available
  if (boundaryData && boundaryData.geojson) {
    L.geoJSON(boundaryData.geojson, {
      style: {
        color: '#183358',
        weight: 1.5,
        dashArray: '4, 4',
        fillColor: '#2d5a3c',
        fillOpacity: 0.04
      }
    }).addTo(map);
  }

  buildLayerElements();
}

function buildLayerElements() {
  // Clear existing
  Object.values(layerGroups).forEach(g => g.clearLayers());

  const currentMonth = monthlyRecords[activeMonthIdx] || { ht_units_kwh: 37162080 / 12 };
  // Baseline scaling factor based on current month consumption relative to 2019 average (~3.1M)
  const monthScale = Math.max(0.2, (currentMonth.ht_units_kwh / 3100000));

  allHotspots.forEach(spot => {
    const latlng = [spot.lat, spot.lng];
    const isMeasured = spot.is_measured;
    const badgeHtml = isMeasured 
      ? '<span class="popup-badge measured">[Measured Feeder / Meter]</span>' 
      : '<span class="popup-badge modelled">[Modelled Estimate]</span>';

    // 1. Electricity Load Layer
    const baseRadius = spot.estimated_peak_load_kw ? Math.sqrt(spot.estimated_peak_load_kw) * 1.8 : 20;
    const dynamicRadius = baseRadius * Math.sqrt(monthScale);

    const elecCircle = L.circle(latlng, {
      radius: dynamicRadius,
      color: isMeasured ? '#183358' : '#b45309',
      weight: isMeasured ? 2 : 1.5,
      dashArray: isMeasured ? null : '4, 4',
      fillColor: isMeasured ? '#183358' : '#f59e0b',
      fillOpacity: 0.35
    });

    elecCircle.bindPopup(`
      <div class="popup-title">${spot.name}</div>
      ${badgeHtml}
      <div class="popup-detail"><strong>Estimated Peak Load:</strong> ${spot.estimated_peak_load_kw ? spot.estimated_peak_load_kw + ' kW' : 'N/A'}</div>
      ${spot.substation_measured_transformer_kva ? `<div class="popup-detail"><strong>Transformer Rating:</strong> ${spot.substation_measured_transformer_kva} kVA</div>` : ''}
      <div class="popup-detail"><strong>Method:</strong> ${spot.model_method}</div>
      <div class="popup-detail"><strong>Month Scaled Factor:</strong> ${(monthScale * 100).toFixed(0)}% of 2019 baseline</div>
      <div class="popup-source">Source: ${spot.notes} (Energy Audit 2020 / Notes)</div>
    `);
    layerGroups.electricity.addLayer(elecCircle);

    // 2. Microclimate / Temperature Layer
    // Distinguish shaded campus areas vs hot concrete/workshop zones
    const isCoolZone = spot.id.includes('LAKE') || spot.id.includes('GANDHI');
    const isHotZone = spot.id.includes('SMEC') || spot.id.includes('SELECT') || spot.id.includes('CHILLER');

    if (isCoolZone || isHotZone) {
      const tempCircle = L.circle(latlng, {
        radius: isCoolZone ? 90 : 70,
        color: isCoolZone ? '#15803d' : '#dc2626',
        weight: 1,
        dashArray: '3, 3',
        fillColor: isCoolZone ? '#22c55e' : '#ef4444',
        fillOpacity: isCoolZone ? 0.25 : 0.25
      });
      tempCircle.bindPopup(`
        <div class="popup-title">${spot.name} — Microclimate</div>
        <div class="popup-detail"><strong>Thermal Class:</strong> ${isCoolZone ? 'Vegetative Microclimate Buffer (−3°C)' : 'High Heat Dissipation Zone'}</div>
        <div class="popup-detail">${isCoolZone ? 'Canopy shading and water surface evaporation reduces localized surface temperature.' : 'Industrial laboratory equipment and chiller heat rejection create localized thermal plume.'}</div>
        <div class="popup-source">Source: Green Audit 2023, p. 73</div>
      `);
      layerGroups.temperature.addLayer(tempCircle);
    }

    // 3. CO2 Emitters & Sinks Layer
    if (spot.category.includes('CO2') || spot.id.includes('LAKE')) {
      const isSink = spot.annual_emissions_co2_tons < 0;
      const co2Marker = L.circleMarker(latlng, {
        radius: isSink ? 10 : 8,
        color: isSink ? '#14532d' : '#991b1b',
        weight: 2,
        fillColor: isSink ? '#15803d' : '#dc2626',
        fillOpacity: 0.8
      });
      co2Marker.bindPopup(`
        <div class="popup-title">${spot.name}</div>
        <div class="popup-badge ${isSink ? 'measured' : 'modelled'}">${isSink ? 'Natural Carbon Sink' : 'Point Source Emitter'}</div>
        <div class="popup-detail"><strong>Annual Impact:</strong> ${spot.annual_emissions_co2_tons > 0 ? '+' : ''}${spot.annual_emissions_co2_tons} t CO₂e/yr</div>
        <div class="popup-detail"><strong>Process:</strong> ${spot.notes}</div>
        <div class="popup-source">Source: Field Notes & Environmental Audit 2024</div>
      `);
      layerGroups.co2.addLayer(co2Marker);
    }

    // 4. Hostels Layer
    if (spot.id.includes('HOSTEL') || spot.id.includes('LH')) {
      const hostelMarker = L.circleMarker(latlng, {
        radius: 7,
        color: '#1e3a8a',
        weight: 1.5,
        fillColor: '#3b82f6',
        fillOpacity: 0.7
      });
      hostelMarker.bindPopup(`
        <div class="popup-title">${spot.name}</div>
        <span class="popup-badge measured">[Residential Substation Feeder]</span>
        <div class="popup-detail"><strong>Transformer Capacity:</strong> ${spot.substation_measured_transformer_kva || 'Dedicated Substation'} kVA</div>
        <div class="popup-detail"><strong>Features:</strong> ${spot.notes}</div>
        <div class="popup-source">Source: Green Audit 2023, p. 20, 46</div>
      `);
      layerGroups.hostels.addLayer(hostelMarker);
    }

    // 5. Labs & Academic Layer
    if (spot.type.includes('Academic') || spot.type.includes('Research')) {
      const labMarker = L.circleMarker(latlng, {
        radius: 6.5,
        color: '#334155',
        weight: 1.5,
        fillColor: '#64748b',
        fillOpacity: 0.75
      });
      labMarker.bindPopup(`
        <div class="popup-title">${spot.name}</div>
        ${badgeHtml}
        <div class="popup-detail"><strong>Classification:</strong> ${spot.category}</div>
        <div class="popup-detail"><strong>Equipment:</strong> ${spot.model_method}</div>
        <div class="popup-source">Source: Field Notes & Energy Audit 2020</div>
      `);
      layerGroups.academic.addLayer(labMarker);
    }

    // 6. Substations & Powerhouses Layer
    if (spot.substation_measured_transformer_kva > 0) {
      const subMarker = L.circleMarker(latlng, {
        radius: 9,
        color: '#0f172a',
        weight: 2,
        fillColor: '#0f172a',
        fillOpacity: 0.9
      });
      subMarker.bindPopup(`
        <div class="popup-title">${spot.name}</div>
        <span class="popup-badge measured">[Utility Substation]</span>
        <div class="popup-detail"><strong>Installed Transformer:</strong> ${spot.substation_measured_transformer_kva} kVA</div>
        <div class="popup-source">Source: Green Audit 2023, Table 10</div>
      `);
      layerGroups.substations.addLayer(subMarker);
    }

    // 7. Renewables & Cooling Layer
    if (spot.id.includes('CHILLER') || spot.id.includes('GANDHI') || spot.id.includes('SJT') || spot.id.includes('LAKE')) {
      const renMarker = L.circleMarker(latlng, {
        radius: 8,
        color: '#047857',
        weight: 2,
        fillColor: '#10b981',
        fillOpacity: 0.85
      });
      renMarker.bindPopup(`
        <div class="popup-title">${spot.name} — Green Asset</div>
        <div class="popup-detail"><strong>Technology:</strong> ${spot.notes}</div>
        <div class="popup-source">Source: Energy Audit 2020 & Green Audit 2023</div>
      `);
      layerGroups.renewables.addLayer(renMarker);
    }
  });
}

function setupTimelineControls() {
  const slider = document.getElementById('timeSlider');
  const monthLabel = document.getElementById('currentMonthLabel');
  const playBtn = document.getElementById('playBtn');
  const resetBtn = document.getElementById('resetBtn');

  if (!slider || !monthlyRecords.length) return;

  const updateTimeline = (idx) => {
    activeMonthIdx = parseInt(idx, 10);
    const rec = monthlyRecords[activeMonthIdx];
    if (rec && monthLabel) {
      monthLabel.textContent = `${rec.month_name} ${rec.year}`;
    }
    buildLayerElements();
  };

  slider.addEventListener('input', (e) => {
    updateTimeline(e.target.value);
  });

  playBtn.addEventListener('click', () => {
    if (isPlaying) {
      clearInterval(playInterval);
      playBtn.textContent = '▶ Play';
      isPlaying = false;
    } else {
      playBtn.textContent = '⏸ Pause';
      isPlaying = true;
      playInterval = setInterval(() => {
        let nextVal = (parseInt(slider.value, 10) + 1) % monthlyRecords.length;
        slider.value = nextVal;
        updateTimeline(nextVal);
      }, 750);
    }
  });

  resetBtn.addEventListener('click', () => {
    if (isPlaying) {
      clearInterval(playInterval);
      playBtn.textContent = '▶ Play';
      isPlaying = false;
    }
    slider.value = 0;
    updateTimeline(0);
  });
}

function renderQuickHotspotList() {
  const container = document.getElementById('quickHotspotList');
  if (!container || !allHotspots.length) return;

  const keySpots = allHotspots.slice(0, 8); // Top 8 hotspots
  container.innerHTML = keySpots.map(spot => {
    return `
      <button class="slider-btn" style="text-align: left; padding: 0.4rem 0.6rem;" onclick="focusHotspot('${spot.id}')">
        <strong>${spot.id}</strong>: ${spot.name.split('(')[0].trim()}
      </button>
    `;
  }).join('');
}

window.focusHotspot = function(id) {
  const spot = allHotspots.find(s => s.id === id);
  if (spot && map) {
    map.flyTo([spot.lat, spot.lng], 17, { duration: 1.2 });
  }
};