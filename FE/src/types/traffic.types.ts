export interface TrafficDay {
  date: string
  count: number
}

export interface MostViewedService {
  serviceId: string
  name: string
  views: number
}

export interface GrowthData {
  todayViews: number
  yesterdayViews: number
  growthPercent: number | null
}

export interface DashboardData {
  weekly: TrafficDay[]
  mostViewed: MostViewedService | null
  growth: GrowthData
  totalViews: number
  top5?: TopViewedItem[]
}

export interface TopViewedItem {
  serviceId: string
  serviceName: string
  imageUrl?: string
  viewCount: number
}
