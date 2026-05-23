'use client'

import type { SiteForecast } from '@/lib/types'

interface ForecastStripProps {
  siteId: string
  forecasts: SiteForecast[]
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function ForecastStrip({ siteId, forecasts }: ForecastStripProps) {
  const site = forecasts.find(f => f.site_id === siteId)
  if (!site) return null

  const days = site.forecast.slice(0, 7)
  const temps = days.map(d => d.projected_sst)
  const minTemp = Math.min(...temps)
  const maxTemp = Math.max(...temps)
  const range = maxTemp - minTemp || 1

  const BAR_MAX_HEIGHT = 64

  return (
    <div className="bg-[#0f2040] rounded-xl p-4">
      <p className="text-xs text-[#7fb3d3] mb-3 uppercase tracking-wide">7-Day SST Forecast</p>
      <div className="relative flex flex-row gap-1">
        <div className="flex flex-row gap-1 w-full">
          {days.map((day, i) => {
            const barHeight = Math.round(((day.projected_sst - minTemp) / range) * BAR_MAX_HEIGHT) + 8
            const dayLabel = DAY_LABELS[new Date(day.date + 'T00:00:00').getDay()]
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1 text-center">
                <span className="text-[#7fb3d3] text-xs">{dayLabel}</span>
                <div className="flex flex-col justify-end" style={{ height: BAR_MAX_HEIGHT }}>
                  <div
                    className="w-full rounded-sm"
                    style={{
                      height: barHeight,
                      backgroundColor: day.above_threshold ? '#ef4444' : '#22c55e',
                      minWidth: 20,
                    }}
                  />
                </div>
                <span className="text-[#f0f9ff] text-xs font-medium">{day.projected_sst}°C</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
