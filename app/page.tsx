'use client'

import { useState, useEffect } from 'react'
import type { Site, SSTRecord, MHWStatus, SiteForecast } from '@/lib/types'
import AlertBanner from '@/components/AlertBanner'
import Map from '@/components/Map'
import SiteSelector from '@/components/SiteSelector'
import SSTChart from '@/components/SSTChart'
import RiskCards from '@/components/RiskCards'
import ForecastStrip from '@/components/ForecastStrip'
import { MetricCard } from '@/components/ui/metric-card'
import { MHWBadge } from '@/components/ui/mhw-badge'

export default function Home() {
  const [sites, setSites] = useState<Site[]>([])
  const [history, setHistory] = useState<SSTRecord[]>([])
  const [mhwStatus, setMhwStatus] = useState<MHWStatus[]>([])
  const [forecasts, setForecasts] = useState<SiteForecast[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/sites').then(r => r.json()) as Promise<Site[]>,
      fetch('/api/sst').then(r => r.json()) as Promise<SSTRecord[]>,
      fetch('/api/mhw').then(r => r.json()) as Promise<MHWStatus[]>,
      fetch('/api/forecast').then(r => r.json()) as Promise<SiteForecast[]>,
    ]).then(([s, h, m, f]) => {
      setSites(s)
      setHistory(h)
      setMhwStatus(m)
      setForecasts(f)
      if (s.length > 0) setSelectedSiteId(s[0].site_id)
      setLoading(false)
    })
  }, [])

  const selectedSite = sites.find(s => s.site_id === selectedSiteId)
  const selectedMHW = mhwStatus.find(m => m.site_id === selectedSiteId)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a1628]">
        <div className="w-10 h-10 border-4 border-[#0ea5e9] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a1628] overflow-hidden">
      <AlertBanner sites={sites} />

      <div className="flex flex-row flex-1 min-h-0">
        {/* Map — 40% */}
        <div className="w-[40%] bg-[#0a1628] border-r border-[#1e3a5f]">
          <Map
            sites={sites}
            selectedSiteId={selectedSiteId}
            onSiteSelect={setSelectedSiteId}
          />
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col gap-3 p-4 overflow-y-auto">
          <SiteSelector
            sites={sites}
            selectedSiteId={selectedSiteId}
            onSelect={setSelectedSiteId}
          />

          {/* Stat bar */}
          {selectedSite && selectedMHW && (
            <div className="flex flex-row gap-3">
              <MetricCard
                label="Current SST"
                value={`${selectedSite.current_sst}°C`}
                sublabel={`Threshold ${selectedMHW.threshold}°C`}
              />
              <div className="flex-1 bg-[#0f2040] border border-[#1e3a5f] rounded-xl p-3">
                <p className="text-xs uppercase tracking-wide text-[#7fb3d3] mb-2">MHW Category</p>
                <MHWBadge category={selectedMHW.category} />
              </div>
              <MetricCard
                label="Active Days"
                value={String(selectedMHW.days_duration)}
                sublabel={selectedMHW.active ? 'Ongoing' : 'Resolved'}
              />
            </div>
          )}

          {selectedSite && selectedMHW && (
            <div className="bg-[#0f2040] border border-[#1e3a5f] rounded-xl p-3">
              <SSTChart
                siteId={selectedSiteId}
                history={history}
                threshold={selectedMHW.threshold}
              />
            </div>
          )}

          {selectedSite && (
            <RiskCards species_risk={selectedSite.species_risk} />
          )}

          {selectedSite && (
            <ForecastStrip siteId={selectedSiteId} forecasts={forecasts} />
          )}
        </div>
      </div>

      <footer className="text-center text-[#7fb3d3] text-xs py-2 border-t border-[#1e3a5f]">
        BlueFish · Data: NOAA CoralTemp · Built for Hack the Elements 2026
      </footer>
    </div>
  )
}
