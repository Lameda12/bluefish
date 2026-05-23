'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import type { SSTRecord } from '@/lib/types'

interface SSTChartProps {
  siteId: string
  history: SSTRecord[]
  threshold: number
}

interface TooltipPayload {
  value: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0f2040] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs">
      <p className="text-[#7fb3d3]">{label}</p>
      <p className="text-[#0ea5e9] font-bold">{payload[0].value}°C</p>
    </div>
  )
}

export default function SSTChart({ siteId, history, threshold }: SSTChartProps) {
  const data = history
    .filter(r => r.site_id === siteId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)
    .map(r => ({
      date: r.date,
      label: new Date(r.date + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
      sst: r.sst,
    }))

  const ticks = data.filter((_, i) => i % 5 === 0).map(d => d.date)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="#1e3a5f" strokeOpacity={0.5} />
        <XAxis
          dataKey="date"
          ticks={ticks}
          tickFormatter={d =>
            new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
          }
          tick={{ fill: '#7fb3d3', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={v => `${v}°C`}
          tick={{ fill: '#7fb3d3', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={threshold}
          stroke="#ef4444"
          strokeDasharray="4 4"
          label={{ value: 'MHW Threshold', fill: '#ef4444', fontSize: 11, position: 'insideTopRight' }}
        />
        <Line
          type="monotone"
          dataKey="sst"
          stroke="#0ea5e9"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#0ea5e9' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
