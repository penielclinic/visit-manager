export type MonthlyVisitData = {
  month: string
  label: string
  completed: number
}

export type DistrictVisitData = {
  districtName: string
  completed: number
  total: number
  notVisited: number
}

export type VisitTypeData = {
  type: string
  label: string
  count: number
  percentage: number
}

export type UnvisitedHousehold = {
  id: string
  household_name: string
  representative_name: string
  cell_name: string
  district_name: string
}
