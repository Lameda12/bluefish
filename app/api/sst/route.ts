import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import type { SSTRecord } from '@/lib/types'

export async function GET(): Promise<NextResponse<SSTRecord[] | { error: string }>> {
  try {
    const file = await fs.readFile(path.join(process.cwd(), 'public/data/sst_history.json'), 'utf-8')
    const data = JSON.parse(file) as SSTRecord[]
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to load SST data' }, { status: 500 })
  }
}
