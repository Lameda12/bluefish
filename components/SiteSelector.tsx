'use client'

import type { Site } from '@/lib/types'

interface SiteSelectorProps {
  sites: Site[]
  selectedSiteId: string
  onSelect: (siteId: string) => void
}

export default function SiteSelector({ sites, selectedSiteId, onSelect }: SiteSelectorProps) {
  return (
    <div className="flex flex-row gap-2">
      {sites.map(site => (
        <button
          key={site.site_id}
          onClick={() => onSelect(site.site_id)}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${
            site.site_id === selectedSiteId
              ? 'bg-[#0ea5e9] text-[#0a1628] border-[#0ea5e9]'
              : 'bg-[#0f2040] text-[#7fb3d3] border-[#1e3a5f] hover:border-[#0ea5e9] hover:text-[#f0f9ff]'
          }`}
        >
          {site.name}
        </button>
      ))}
    </div>
  )
}
