'use client'

import type { SpeciesRisk } from '@/lib/types'

interface RiskCardsProps {
  species_risk: SpeciesRisk[]
}

const ICONS: Record<string, string> = {
  'Atlantic Salmon': '🐟',
  'Eastern Oyster': '🦪',
  'Blue Mussel': '🐚',
}

const RISK_COLORS: Record<string, string> = {
  Low: '#22c55e',
  Elevated: '#eab308',
  Critical: '#ef4444',
}

export default function RiskCards({ species_risk }: RiskCardsProps) {
  return (
    <div className="flex flex-row gap-3">
      {species_risk.map(r => (
        <div
          key={r.species}
          className={`flex-1 bg-[#0f2040] border border-[#1e3a5f] rounded-xl p-4 ${r.risk_level === 'Critical' ? 'border-l-4 border-l-red-500' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">{ICONS[r.species]}</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.risk_level === 'Critical' ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: RISK_COLORS[r.risk_level] + '33', color: RISK_COLORS[r.risk_level] }}
            >
              {r.risk_level}
            </span>
          </div>
          <p className="text-[#f0f9ff] font-bold text-sm mb-1">{r.species}</p>
          <p className="text-[#7fb3d3] text-xs">
            {r.delta >= 0
              ? `+${r.delta.toFixed(1)}°C above limit`
              : `${r.delta.toFixed(1)}°C below limit`}
          </p>
        </div>
      ))}
    </div>
  )
}
