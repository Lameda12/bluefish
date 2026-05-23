import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import type { MHWStatus } from '@/lib/types'

export async function GET(): Promise<NextResponse<MHWStatus[] | { error: string }>> {
  try {
    const file = await fs.readFile(path.join(process.cwd(), 'public/data/mhw_status.json'), 'utf-8')
    const data = JSON.parse(file) as MHWStatus[]
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to load MHW data' }, { status: 500 })
  }
}
