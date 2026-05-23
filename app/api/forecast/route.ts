import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import type { SiteForecast } from '@/lib/types'

export async function GET(): Promise<NextResponse<SiteForecast[] | { error: string }>> {
  try {
    const file = await fs.readFile(path.join(process.cwd(), 'public/data/forecast.json'), 'utf-8')
    const data = JSON.parse(file) as SiteForecast[]
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to load forecast data' }, { status: 500 })
  }
}
