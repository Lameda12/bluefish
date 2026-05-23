'use client'

import { useState } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps'
import type { Site, MHWCategory } from '@/lib/types'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface TooltipState {
  x: number
  y: number
  site: Site
}

interface MapProps {
  sites: Site[]
  selectedSiteId: string
  onSiteSelect: (siteId: string) => void
}

function categoryColor(cat: MHWCategory): string {
  if (cat === 0) return '#22c55e'
  if (cat <= 2) return '#eab308'
  if (cat === 3) return '#f97316'
  return '#ef4444'
}

function categoryLabel(cat: MHWCategory): string {
  if (cat === 0) return 'No Active MHW'
  if (cat === 1) return 'Category I'
  if (cat === 2) return 'Category II'
  if (cat === 3) return 'Category III'
  return 'Category IV'
}

export default function Map({ sites, selectedSiteId, onSiteSelect }: MapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  return (
    <div className="relative w-full h-full">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [-63.0, 45.0], scale: 3000 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#1e3a5f"
                stroke="#0a1628"
                strokeWidth={0.5}
                style={{
                  default: { outline: 'none' },
                  hover: { outline: 'none' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {sites.map(site => {
          const selected = site.site_id === selectedSiteId
          const r = selected ? 11 : 8
          const sw = selected ? 2.5 : 1.5
          return (
            <Marker
              key={site.site_id}
              coordinates={[site.lon, site.lat]}
              onClick={() => onSiteSelect(site.site_id)}
              onMouseEnter={(e: React.MouseEvent) => {
                const rect = (e.currentTarget as SVGElement)
                  .closest('svg')
                  ?.getBoundingClientRect()
                setTooltip({
                  x: e.clientX - (rect?.left ?? 0),
                  y: e.clientY - (rect?.top ?? 0),
                  site,
                })
              }}
              onMouseLeave={() => setTooltip(null)}
              tabIndex={0}
            >
              <circle
                r={r}
                fill={categoryColor(site.mhw_category)}
                stroke="white"
                strokeWidth={sw}
                className="cursor-pointer"
              />
            </Marker>
          )
        })}
      </ComposableMap>

      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 bg-[#0f2040] text-[#f0f9ff] rounded-lg shadow-lg px-3 py-2 text-xs"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="font-bold text-sm mb-1">{tooltip.site.name}</p>
          <p>SST: <span className="text-[#0ea5e9]">{tooltip.site.current_sst}°C</span></p>
          <p>{categoryLabel(tooltip.site.mhw_category)}</p>
        </div>
      )}
    </div>
  )
}
