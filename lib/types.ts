export type MHWCategory = 0 | 1 | 2 | 3 | 4 | null

export interface SpeciesRisk {
  species: 'Atlantic Salmon' | 'Eastern Oyster' | 'Blue Mussel'
  risk_level: 'Low' | 'Elevated' | 'Critical'
  threshold: number
  delta: number
}

export interface Site {
  site_id: string
  name: string
  lat: number
  lon: number
  mhw_category: MHWCategory
  current_sst: number
  species_risk: SpeciesRisk[]
}

export interface SSTRecord {
  site_id: string
  date: string
  sst: number
}

export interface MHWStatus {
  site_id: string
  active: boolean
  category: MHWCategory
  days_duration: number
  current_sst: number
  threshold: number
}

export interface ForecastDay {
  date: string
  projected_sst: number
  above_threshold: boolean
}

export interface SiteForecast {
  site_id: string
  forecast: ForecastDay[]
}
