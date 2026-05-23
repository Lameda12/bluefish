'use client'

import { useEffect, useState } from 'react'
import type { Site } from '@/lib/types'

interface AlertBannerProps {
  sites: Site[]
}

export default function AlertBanner({ sites }: AlertBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
  }, [])

  const criticalCount = sites.filter(s => s.mhw_category >= 3).length
  const warningCount = sites.filter(s => s.mhw_category >= 1).length

  if (criticalCount > 0) {
    return (
      <div
        className={`w-full bg-[#ef4444] py-3 px-6 flex flex-row justify-between items-center transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
      >
        <div className="flex items-center gap-3">
          <span className="animate-pulse w-3 h-3 rounded-full bg-white inline-block" />
          <span className="text-white font-semibold text-sm">
            ACTIVE MARINE HEATWAVE — {criticalCount} of 4 NS sites at Category IV (Extreme). Immediate risk to Atlantic Salmon.
          </span>
        </div>
        <span className="text-white/80 text-xs font-mono uppercase tracking-wide">CRITICAL ALERT</span>
      </div>
    )
  }

  if (warningCount > 0) {
    return (
      <div
        className={`w-full bg-[#eab308] py-3 px-6 flex flex-row justify-between items-center transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
      >
        <div className="flex items-center gap-3">
          <span className="animate-pulse w-3 h-3 rounded-full bg-white inline-block" />
          <span className="text-white font-semibold text-sm">
            MARINE HEATWAVE WARNING — elevated temperatures detected at {warningCount} NS aquaculture site(s).
          </span>
        </div>
        <span className="text-white/80 text-xs font-mono uppercase tracking-wide">WARNING</span>
      </div>
    )
  }

  return null
}
