import type { Tables, Enums } from './database.types'

export type Household = Tables<'households'>
export type HouseholdMember = Tables<'household_members'>
export type District = Tables<'districts'>
export type Cell = Tables<'cells'>

export type CellWithDistrict = Cell & {
  districts: District
}

export type HouseholdWithCell = Household & {
  cells: (Cell & {
    districts: Pick<District, 'id' | 'name'>
  }) | null
}

export type HouseholdWithDetails = HouseholdWithCell & {
  household_members: HouseholdMember[]
}

export type DistrictWithCells = District & {
  cells: Cell[]
}

export type HouseholdFormValues = {
  cell_id: string
  household_name: string
  representative_name: string
  address_full: string
  address_detail: string
  phone_primary: string
  phone_secondary: string
  status: Enums<'household_status'>
  notes: string
}

export type MemberFormValues = {
  full_name: string
  relation: Enums<'member_relation'>
  gender: Enums<'gender'>
  birth_year: string
  phone: string
  faith_status: Enums<'faith_status'>
  is_primary: boolean
}

export type ExcelRow = {
  rowIndex: number
  가구명: string
  대표자명: string
  선교회명: string
  순명: string
  '주소(전체)': string
  '주소(상세)': string
  전화1: string
  전화2: string
  메모: string
  error?: string
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export type ParsedMember = {
  full_name: string
  relation: 'head' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other'
  gender: 'male' | 'female' | 'undisclosed'
  birth_year: number | null
  phone: string | null
  faith_status: 'registered' | 'baptized' | 'long_absent' | 'unbaptized' | 'confirmed' | 'withdrawn'
  is_primary: boolean
}

export type ParsedHousehold = {
  district_name: string
  cell_name: string
  household_name: string
  representative_name: string
  address_full: string | null
  phone_primary: string | null
  phone_secondary: string | null
  members: ParsedMember[]
}
