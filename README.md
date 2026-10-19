# VIT Vellore Campus Environment Monitor

A multi-page, map-driven static website developed for an academic Multidisciplinary Project (MDP) at **Vellore Institute of Technology (VIT), Vellore**. 

The monitor visualises campus electricity demand peaks, microclimatic buffering, greenhouse gas emissions, renewable generation, and spatial hotspots across the 372-acre campus at Katpadi.

---

## 1. Project Structure

```
vit-campus-monitor/
├── index.html                  # 01. Overview (key indicators & executive findings)
├── electricity.html            # 02. Electricity (monthly 2019-21, 10-year generation mix)
├── climate.html                # 03. Climate (temperature, humidity, summer AC coupling)
├── emissions.html              # 04. CO2 Emissions (carbon accounting & avoided emissions)
├── map.html                    # 05. Hotspot Map (Leaflet spatial investigation & timeline)
├── buildings.html              # 06. Buildings & Facilities (searchable & sortable directory)
├── methods.html                # 07. Method & Sources (formulas, standards, audit trail)
├── css/
│   └── main.css                # Institutional data-journalism stylesheet (AAA contrast)
├── js/
│   ├── nav.js                  # Global header & footer with project metadata
│   ├── charts.js               # Chart.js rendering for electricity & climate
│   ├── map.js                  # Leaflet layers, time slider animation & hotspot popups
│   ├── emissions.js            # Scope 1 & 2 carbon breakdown doughnut chart
│   └── buildings.js            # Client-side multi-column sorting and filtering
├── data/
│   ├── campus_facts.json       # Population, area, hostels, sports, facilities
│   ├── energy_monthly_2019_2021.json # 30 months of HT units, demand (kVA) & bills (₹)
│   ├── energy_yearly_2014_2023.json  # 10-year trends: grid vs solar vs wind
│   ├── infrastructure_equipment.json # Substation, 12 powerhouses, transformers & 31 DGs
│   ├── emissions_and_cooling.json    # District Cooling, Gandhi block, sinks & factors
│   ├── water_and_waste.json    # 7,233 KLD water balance, 9 STPs, solid waste
│   ├── hotspots_catalog.json   # 15 geo-located nodes with estimation models
│   ├── buildings_catalog.json  # Comprehensive facilities index
│   ├── grid_and_tariff_benchmarks.json # TNPDCL HT 1A tariff & CEA baseline
│   ├── vellore_climate_historical.json # Open-Meteo ERA5-Land monthly normals
│   ├── vellore_air_quality_cache.json  # Open-Meteo air quality & CPCB limits
│   └── campus_osm_boundary.json        # OpenStreetMap Katpadi boundary polygon
└── README.md                   # This documentation
```

---

## 2. Primary Data Sources & Citations

1. **Energy Audit Report (Year 2020):**
   - Author: Dr. K. Palanisamy, Certified Energy Auditor EA3024 (Dept. of Energy & Power Electronics, SELECT, VIT).
   - Extracted: 30-month billing table (Jan 2019 – Jun 2021), 10-year renewable history, transformer allocations, 5,500 TR District Cooling System specs, Gandhi block radiant cooling data, and 2018 rolling load-shedding schedules.
2. **Green Audit Report (Period: June 2022 to August 2023):**
   - Prepared by: Eco Services India Pvt. Ltd. (NABET/QCI Accredited Consultant).
   - Extracted: Campus land classification (372 acres / 8,27,747 m²), 30,552 trees, 12 powerhouse inventories, 2.113 MWp rooftop solar array generation, and water balance.
3. **Environmental Audit Report (Period: September 2023 to August 2024):**
   - Prepared by: Eco Services India Pvt. Ltd.
   - Extracted: TNPCB Consent to Operate (CTO Expansion Order 2307250173231), 31 DG stack heights, 7,233 KLD water requirement, and 2024 certified carbon footprint.
4. **Student Field Notes:**
   - Documented heavy laboratory loads (SMEC, SELECT, CFM, CBST, simulation labs) and direct combustion exhausts (IC engine rigs, chemical synthesis).

---

## 3. External APIs & Refresh Instructions

All external API responses are cached in `/data/` so the site runs completely offline without network dependencies. To refresh live data, run:

```bash
python3 scripts/fetch_external_data.py
```

- **Climate Normals:** Open-Meteo Historical Weather API (`https://archive-api.open-meteo.com/v1/archive`) for coordinates `12.9692° N, 79.1559° E` (ERA5-Land reanalysis).
- **Air Quality:** Open-Meteo Air Quality API (`https://air-quality-api.open-meteo.com/v1/air-quality`) retrieving PM2.5, PM10, NO₂, SO₂, CO, and AQI.
- **Campus Geometry:** OpenStreetMap Nominatim and Overpass API for Katpadi campus boundaries.

---

## 4. Key Assumptions, Estimates & Quirks Handled

- **Modelled vs Measured Data:** VIT operates bulk metering at the 33/11 kV substation and 12 powerhouses; per-room IoT sub-metering does not exist. All building-level intensities are transparently labelled as **Modelled Estimates** and derived from transformer capacity, equipment manifests, and student occupancy.
- **April 2019 Meter Ledger vs Narrative:** The Energy Audit narrative mentions ~40 lakh units in April 2019, whereas the official billing ledger recorded 46,88,760 kWh (₹3.44 Cr). The verified meter ledger value is used throughout.
- **2021 Part-Year RES% Quirk:** The 2020 Energy Audit lists RES% as 103.659% for 2021. As documented in the audit, this was an artifact of dividing 6 months of contracted wind wheeling over lockdown-restricted campus consumption (2.74M kWh). It is flagged and not presented as full-year reality.
- **Grid Emission Factors:** The environmental audit applies 0.813 kg CO₂/kWh, while the 2020 energy audit implies 0.910 kg/kWh. For comparison, the official Central Electricity Authority (CEA) Version 19 baseline for the Southern regional grid documents 0.716 kg CO₂/kWh.

---

## 5. Local Execution & Deployment

This project is completely static (no build step, no Node.js required).

To run locally:
```bash
cd vit-campus-monitor
python3 -m http.server 8000
```
Open `http://localhost:8000` in any web browser.

Deployable directly to **GitHub Pages**, **Netlify**, or **Vercel** with zero configuration.