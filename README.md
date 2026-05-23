# BlueFish 🐟

Marine heatwave early warning dashboard for Nova Scotia aquaculture.
Built for Hack the Elements 2026 — Water theme.

**Live:** https://bluefish-ivory.vercel.app

## The Problem
Nova Scotia's aquaculture industry ($430M/year) has no real-time early warning
system for marine heatwaves. All 4 monitored NS sites are currently under an
active Category IV marine heatwave — the worst tier. Farmers find out water
is too hot after fish start dying, not before.

## What BlueFish Does
- Real-time SST monitoring for 4 NS aquaculture sites
- Marine heatwave detection using Hobday et al. 2016 framework (Category I–IV)
- Species-specific risk thresholds (Atlantic Salmon 23°C, Blue Mussel 25°C, Eastern Oyster 30°C)
- 7-day SST forecast strip
- Plain-language risk alerts designed for non-technical operators

## Data Sources
- NOAA CoralTemp via ERDDAP (no API key, open data)
- Hobday et al. (2016) MHW classification framework
- NS Aquaculture Association site coordinates

## Stack
Next.js 14 · TypeScript · Tailwind CSS · react-simple-maps · Recharts · Vercel

## Team
Alamedin (frontend, UX) · Neo (data pipeline, MHW detection)
Dalhousie University — Hack the Elements 2026
