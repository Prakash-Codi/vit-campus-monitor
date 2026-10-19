// Charts & Climate Data Integration for VIT Vellore Environment Monitor

document.addEventListener('DOMContentLoaded', async () => {
  const isElectricityPage = !!document.getElementById('monthlyEnergyChart');
  const isClimatePage = !!document.getElementById('tempVsEnergyChart');

  if (isElectricityPage) {
    initElectricityCharts();
  }

  if (isClimatePage) {
    initClimateCharts();
  }
});

async function fetchJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Could not fetch ${path}:`, err);
    return null;
  }
}

async function initElectricityCharts() {
  const monthlyData = await fetchJSON('data/energy_monthly_2019_2021.json');
  const yearlyData = await fetchJSON('data/energy_yearly_2014_2023.json');

  if (monthlyData && monthlyData.records) {
    renderMonthlyChart(monthlyData.records);
  }

  if (yearlyData && yearlyData.records) {
    renderYearlyChart(yearlyData.records);
    renderYearlyTable(yearlyData.records);
  }
}

function renderMonthlyChart(records) {
  const ctx = document.getElementById('monthlyEnergyChart');
  if (!ctx) return;

  const labels = records.map(r => r.month_name + ' ' + (r.year % 100));
  const units = records.map(r => r.ht_units_kwh / 100000); // in Lakh kWh
  const demand = records.map(r => r.max_demand_kva);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'HT Consumption (Lakh kWh)',
          data: units,
          backgroundColor: records.map(r => {
            if (r.month === '2019-04') return '#8b2626'; // Peak
            if (r.year === 2020 && ['04','05','06'].some(m => r.month.endsWith(m))) return '#a0aec0'; // Lockdown
            return '#183358';
          }),
          yAxisID: 'yUnits',
          order: 2
        },
        {
          label: 'Max Demand (kVA)',
          data: demand,
          type: 'line',
          borderColor: '#b45309',
          borderWidth: 2,
          pointRadius: 2.5,
          pointHoverRadius: 5,
          yAxisID: 'yDemand',
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { family: "'IBM Plex Mono', monospace", size: 11 }, boxWidth: 12 }
        },
        tooltip: {
          callbacks: {
            afterBody: (items) => {
              const idx = items[0].dataIndex;
              const r = records[idx];
              const billStr = r.bill_amount_inr ? `Bill: ₹${(r.bill_amount_inr / 100000).toFixed(2)} Lakhs` : '';
              return `\nExact Units: ${r.ht_units_kwh.toLocaleString()} kWh\n${billStr}\nStatus: ${r.status}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: "'IBM Plex Mono', monospace", size: 10 }, maxRotation: 45 }
        },
        yUnits: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'HT Consumption (Lakh kWh)', font: { family: "'IBM Plex Sans', sans-serif", size: 11 } },
          grid: { color: '#eae7df' },
          ticks: { font: { family: "'IBM Plex Mono', monospace", size: 10 } }
        },
        yDemand: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'Max Demand (kVA)', font: { family: "'IBM Plex Sans', sans-serif", size: 11 } },
          grid: { display: false },
          ticks: { font: { family: "'IBM Plex Mono', monospace", size: 10 } }
        }
      }
    }
  });
}

function renderYearlyChart(records) {
  const ctx = document.getElementById('yearlyEnergyChart');
  if (!ctx) return;

  // Filter out 2021 part-year anomaly from regular chart comparison or annotate it
  const chartRecords = records.filter(r => !r.is_part_year);
  const labels = chartRecords.map(r => r.year.toString());
  const gridPower = chartRecords.map(r => (r.energy_consumed_kwh - (r.solar_generation_kwh + r.wind_power_purchased_kwh)) / 1000000); // Million kWh
  const solarPower = chartRecords.map(r => r.solar_generation_kwh / 1000000);
  const windPower = chartRecords.map(r => (r.wind_power_purchased_kwh || 0) / 1000000);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Thermal Grid Sourced (M kWh)',
          data: gridPower,
          backgroundColor: '#4a5568'
        },
        {
          label: 'Rooftop Solar PV (M kWh)',
          data: solarPower,
          backgroundColor: '#d97706'
        },
        {
          label: 'Contracted Wind Wheeling (M kWh)',
          data: windPower,
          backgroundColor: '#059669'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { font: { family: "'IBM Plex Mono', monospace", size: 11 } }
        },
        y: {
          stacked: true,
          title: { display: true, text: 'Total Electricity (Million kWh)', font: { family: "'IBM Plex Sans', sans-serif", size: 11 } },
          grid: { color: '#eae7df' },
          ticks: { font: { family: "'IBM Plex Mono', monospace", size: 10 } }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { family: "'IBM Plex Mono', monospace", size: 11 }, boxWidth: 12 }
        },
        tooltip: {
          callbacks: {
            afterBody: (items) => {
              const idx = items[0].dataIndex;
              const r = chartRecords[idx];
              return `\nRenewable Share (RES): ${r.res_percentage.toFixed(2)}%\nTotal: ${(r.energy_consumed_kwh / 1000000).toFixed(2)}M kWh\nNotes: ${r.notes}`;
            }
          }
        }
      }
    }
  });
}

function renderYearlyTable(records) {
  const tbody = document.getElementById('yearlyTableBody');
  if (!tbody) return;

  tbody.innerHTML = records.map(r => {
    const isQuirk = r.is_part_year;
    const resDisplay = isQuirk 
      ? `<span style="color: #8b2626; font-weight: 600;" title="${r.anomaly_warning}">${r.res_percentage.toFixed(1)}%* (Part-Year)</span>` 
      : `${r.res_percentage.toFixed(2)}%`;
    const rowClass = isQuirk ? 'style="background-color: #fff8f8;"' : '';
    
    return `
      <tr ${rowClass}>
        <td><strong>${r.year}</strong>${isQuirk ? '*' : ''}</td>
        <td class="num-cell">${r.sanctioned_demand_kw ? r.sanctioned_demand_kw.toLocaleString() : '—'}</td>
        <td class="num-cell">${r.energy_consumed_kwh ? r.energy_consumed_kwh.toLocaleString() : '—'}</td>
        <td class="num-cell">${r.solar_generation_kwh ? r.solar_generation_kwh.toLocaleString() : '0'}</td>
        <td class="num-cell">${r.solar_pv_capacity_kwp ? r.solar_pv_capacity_kwp.toLocaleString() : '0'}</td>
        <td class="num-cell">${r.wind_power_purchased_kwh ? r.wind_power_purchased_kwh.toLocaleString() : '0'}</td>
        <td class="num-cell">${resDisplay}</td>
        <td style="font-size: 0.82rem;">${r.notes || r.anomaly_warning || ''}</td>
      </tr>
    `;
  }).join('');
}

async function initClimateCharts() {
  const climateData = await fetchJSON('data/vellore_climate_historical.json');
  const energyData = await fetchJSON('data/energy_monthly_2019_2021.json');
  const aqData = await fetchJSON('data/vellore_air_quality_cache.json');

  if (climateData && energyData) {
    renderTempVsEnergyChart(climateData.monthly, energyData.records);
    renderClimateNormalsTable(climateData.monthly);
  }

  if (aqData) {
    renderLiveEnvironmentWidgets(aqData);
  }
}

function renderTempVsEnergyChart(climateMonthly, energyRecords) {
  const ctx = document.getElementById('tempVsEnergyChart');
  if (!ctx) return;

  // Filter 2019 months
  const months2019 = energyRecords.filter(r => r.year === 2019);
  const climate2019 = climateMonthly.filter(c => c.month.startsWith('2019'));

  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const temps = climate2019.map(c => c.temp_max_avg);
  const units = months2019.map(r => r.ht_units_kwh / 100000); // Lakh units

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Electricity Units (Lakh kWh)',
          data: units,
          backgroundColor: '#183358',
          yAxisID: 'yEnergy',
          order: 2
        },
        {
          label: 'Mean Daily Max Temp (°C)',
          data: temps,
          type: 'line',
          borderColor: '#8b2626',
          backgroundColor: '#8b2626',
          borderWidth: 2.5,
          pointRadius: 4,
          yAxisID: 'yTemp',
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { family: "'IBM Plex Mono', monospace", size: 11 }, boxWidth: 12 }
        },
        tooltip: {
          callbacks: {
            afterBody: (items) => {
              const idx = items[0].dataIndex;
              if (idx === 3) return '\nApril Peak: 46.88L units under 38.6°C mean max heat.';
              if (idx === 4) return '\nMay Vacation Shift: Exams ended May 25; consumption dropped by 62% despite 39.8°C heatwave.';
              return '';
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: "'IBM Plex Mono', monospace" } } },
        yEnergy: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Consumption (Lakh kWh)' },
          grid: { color: '#eae7df' }
        },
        yTemp: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'Max Temperature (°C)' },
          min: 25,
          max: 45,
          grid: { display: false }
        }
      }
    }
  });
}

function renderClimateNormalsTable(monthlyRecords) {
  const tbody = document.getElementById('climateNormalsBody');
  if (!tbody) return;

  // Aggregate by calendar month across available years
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const agg = Array.from({ length: 12 }, () => ({ max: [], min: [], mean: [], rh: [], p: [] }));

  monthlyRecords.forEach(r => {
    const mIdx = parseInt(r.month.split('-')[1], 10) - 1;
    if (r.temp_max_avg) agg[mIdx].max.push(r.temp_max_avg);
    if (r.temp_min_avg) agg[mIdx].min.push(r.temp_min_avg);
    if (r.temp_mean_avg) agg[mIdx].mean.push(r.temp_mean_avg);
    if (r.relative_humidity_avg) agg[mIdx].rh.push(r.relative_humidity_avg);
    if (r.precipitation_total_mm) agg[mIdx].p.push(r.precipitation_total_mm);
  });

  const avg = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '—';

  tbody.innerHTML = monthNames.map((name, i) => {
    const meanMax = parseFloat(avg(agg[i].max));
    let condition = 'Mild / Low AC Demand';
    if (meanMax >= 38.0) condition = '<span style="color: #8b2626; font-weight: 600;">Severe Summer Heat (Peak AC)</span>';
    else if (meanMax >= 34.0) condition = 'Warm / Moderate HVAC Load';
    else if (i >= 9) condition = 'Humid Monsoon Season';

    return `
      <tr>
        <td><strong>${name}</strong></td>
        <td class="num-cell">${avg(agg[i].max)}</td>
        <td class="num-cell">${avg(agg[i].min)}</td>
        <td class="num-cell">${avg(agg[i].mean)}</td>
        <td class="num-cell">${avg(agg[i].rh)}%</td>
        <td class="num-cell">${avg(agg[i].p)}</td>
        <td>${condition}</td>
      </tr>
    `;
  }).join('');
}

function renderLiveEnvironmentWidgets(aq) {
  const wx = aq.current_weather || {};
  const air = aq.current_air_quality || {};

  const tsEl = document.getElementById('weatherTimestamp');
  if (tsEl) tsEl.textContent = `Retrieved: ${aq.timestamp || 'Recent API Snapshot'}`;

  const setVal = (id, val, unit) => {
    const el = document.getElementById(id);
    if (el) el.textContent = (val !== undefined && val !== null) ? `${val} ${unit}` : 'data unavailable';
  };

  setVal('liveTemp', wx.temperature_2m, '°C');
  setVal('liveHumidity', wx.relative_humidity_2m, '%');
  setVal('liveApparent', wx.apparent_temperature, '°C');
  setVal('liveWind', wx.wind_speed_10m, 'km/h');

  setVal('aqPm25', air.pm2_5, 'µg/m³');
  setVal('aqPm10', air.pm10, 'µg/m³');
  setVal('aqNo2', air.nitrogen_dioxide, 'µg/m³');
  setVal('aqSo2', air.sulphur_dioxide, 'µg/m³');
  setVal('aqCo', air.carbon_monoxide ? (air.carbon_monoxide / 1000).toFixed(2) : null, 'mg/m³');
  setVal('aqAqi', air.european_aqi, '');
}