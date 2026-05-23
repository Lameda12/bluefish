import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import type { Site } from '@/lib/types'

export async function GET(): Promise<NextResponse<Site[] | { error: string }>> {
  try {
    const file = await fs.readFile(path.join(process.cwd(), 'public/data/sites.json'), 'utf-8')
    const data = JSON.parse(file) as Site[]
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to load sites data' }, { status: 500 })
  }
}
