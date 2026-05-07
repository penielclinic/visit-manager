'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Upload, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react'
import * as XLSX from 'xlsx'

export interface ParsedMember {
  full_name: string
  relation: 'head' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other'
  gender: 'male' | 'female' | 'undisclosed'
  birth_year: number | null
  phone: string | null
  faith_status: 'registered' | 'baptized' | 'long_absent' | 'unbaptized' | 'confirmed' | 'withdrawn'
  is_primary: boolean
}

export interface ParsedHousehold {
  district_name: string
  cell_name: string
  household_name: string
  representative_name: string
  address_full: string | null
  phone_primary: string | null
  phone_secondary: string | null
  members: ParsedMember[]
}

// ── 파서 헬퍼 ──────────────────────────────────────────

function cleanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  if (digits.length === 10) {
    if (digits.startsWith('02')) return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  if (digits.length === 9 && digits.startsWith('02'))
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
  return raw.trim()
}

function parsePhones(col: string): { primary: string | null; secondary: string | null } {
  const lines = col.split('\n')
  const phoneLine = lines[1]?.trim() ?? ''
  if (!phoneLine) return { primary: null, secondary: null }
  const parts = phoneLine.split(/\s{2,}/).map((s) => s.trim()).filter(Boolean)
  return {
    primary: parts[0] ? cleanPhone(parts[0]) : null,
    secondary: parts[1] ? cleanPhone(parts[1]) : null,
  }
}

function parseGenderBirth(raw: string): { gender: ParsedMember['gender']; birth_year: number | null } {
  const lines = raw.split('\n')
  const g = lines[0]?.split('/')?.[0]?.trim()
  const gender: ParsedMember['gender'] = g === '남' ? 'male' : g === '여' ? 'female' : 'undisclosed'
  const dateLine = lines[1]?.trim() ?? ''
  const y = dateLine ? parseInt(dateLine.split('-')[0]) : NaN
  return { gender, birth_year: isNaN(y) || y < 1900 || y > 2100 ? null : y }
}

function parseRelation(raw: string): ParsedMember['relation'] {
  const r = raw.trim()
  if (r === '본인') return 'head'
  if (['처', '남편', '배우자', '아내', '부인'].includes(r)) return 'spouse'
  if (['아들', '딸', '장남', '장녀', '차남', '차녀', '막내', '자녀'].includes(r)) return 'child'
  if (['부', '모', '아버지', '어머니', '아버님', '어머님', '장모', '시부', '시모', '장인'].includes(r)) return 'parent'
  if (['형', '오빠', '남동생', '언니', '누나', '여동생', '동생'].includes(r)) return 'sibling'
  return 'other'
}

function parseFaithStatus(col: string): ParsedMember['faith_status'] {
  const lines = col.split('\n')
  const type = lines[0]?.trim()
  const state = lines[2]?.trim()
  if (type === '새가족') return 'registered'
  if (state === '미출석') return 'long_absent'
  return 'baptized'
}

// 시트에서 선교회/순 이름 추출
function parseSheetInfo(rawData: unknown[][]): { district: string; cell: string } | null {
  for (let r = 0; r < Math.min(15, rawData.length); r++) {
    const row = rawData[r] as string[]
    for (const cell of row) {
      if (typeof cell === 'string' && cell.includes('선교회') && (cell.includes('_순') || cell.includes('순'))) {
        const parts = cell.split('/')
        const rawD = parts.find((p) => p.includes('선교회')) ?? ''
        const rawC = parts.find((p) => (p.includes('_순') || p.endsWith('순')) && !p.includes('선교회')) ?? ''
        // "04_선교회" → "4선교회", "11_순" → "11순"
        const district = rawD.replace(/_/g, '').replace(/^0+(\d)/, '$1')
        const cellName = rawC.replace(/_/g, '')
        if (district && cellName) return { district, cell: cellName }
      }
    }
  }
  return null
}

// 시트 1개 파싱
function parseSheet(ws: XLSX.WorkSheet, districtName: string, cellName: string): ParsedHousehold[] {
  const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][]
  const result: ParsedHousehold[] = []
  let current: ParsedHousehold | null = null

  // 고정 컬럼 인덱스 (B=0 기준)
  const C_NO = 4
  const C_HEAD = 8
  const C_RELATION = 12
  const C_NAME = 18
  const C_GENDERBIRTH = 19
  const C_STATUS = 24
  const C_ADDRESS = 28

  for (let r = 25; r < rawData.length; r++) {
    const row = rawData[r]
    if (!row || row.length < C_NAME + 1) continue

    const noCell = row[C_NO]
    const headCell = String(row[C_HEAD] ?? '').trim()
    const relation = String(row[C_RELATION] ?? '').trim()
    const name = String(row[C_NAME] ?? '').trim()
    const genderBirth = String(row[C_GENDERBIRTH] ?? '')
    const statusInfo = String(row[C_STATUS] ?? '')
    const addressInfo = String(row[C_ADDRESS] ?? '')

    if (!name) continue

    const isNewHousehold =
      typeof noCell === 'number' ||
      (typeof noCell === 'string' && /^\d+$/.test(String(noCell).trim()) && String(noCell).trim() !== '')
    const isMember = headCell === '〃'

    if (!isNewHousehold && !isMember) continue

    if (isNewHousehold) {
      if (current) result.push(current)

      const headLines = headCell.split('\n')
      const headName = headLines[0].replace(/\(-\)/g, '').trim() || name
      const { primary, secondary } = parsePhones(addressInfo)
      const address = addressInfo.split('\n')[0].trim() || null

      current = {
        district_name: districtName,
        cell_name: cellName,
        household_name: `${headName} 가구`,
        representative_name: headName,
        address_full: address,
        phone_primary: primary,
        phone_secondary: secondary,
        members: [],
      }
    }

    if (current && name) {
      const { gender, birth_year } = parseGenderBirth(genderBirth)
      current.members.push({
        full_name: name,
        relation: parseRelation(relation),
        gender,
        birth_year,
        phone: null,
        faith_status: parseFaithStatus(statusInfo),
        is_primary: relation === '본인',
      })
    }
  }

  if (current) result.push(current)

  // is_primary 없는 가구는 첫 번째 멤버를 primary로
  for (const h of result) {
    if (h.members.length > 0 && !h.members.some((m) => m.is_primary)) {
      h.members[0].is_primary = true
    }
  }

  return result
}

// ── 컴포넌트 ──────────────────────────────────────────

const RELATION_LABEL: Record<ParsedMember['relation'], string> = {
  head: '본인',
  spouse: '배우자',
  child: '자녀',
  parent: '부모',
  sibling: '형제',
  other: '기타',
}

export function ChurchRecordUpload() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [households, setHouseholds] = useState<ParsedHousehold[]>([])
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null)
  const [parseError, setParseError] = useState('')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setParseError('')
    setHouseholds([])
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result as ArrayBuffer, { type: 'array' })
        const parsed: ParsedHousehold[] = []

        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName]
          const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][]
          const info = parseSheetInfo(rawData)
          if (!info) continue
          parsed.push(...parseSheet(ws, info.district, info.cell))
        }

        if (parsed.length === 0) {
          setParseError('교구록 형식을 인식하지 못했습니다. 시트에 "선교회/순" 헤더가 있는지 확인해주세요.')
        } else {
          setHouseholds(parsed)
        }
      } catch {
        setParseError('파일을 읽을 수 없습니다. xlsx/xls 형식인지 확인해주세요.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleUpload() {
    if (households.length === 0) return
    setUploading(true)
    setResult(null)
    try {
      const res = await fetch('/api/households/upload-church-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ households }),
      })
      const json = await res.json()
      setResult({ inserted: json.inserted ?? 0, errors: json.errors ?? [] })
      if (json.inserted > 0) {
        setTimeout(() => router.push('/households'), 1500)
      }
    } catch {
      setResult({ inserted: 0, errors: ['네트워크 오류가 발생했습니다.'] })
    } finally {
      setUploading(false)
    }
  }

  const totalMembers = households.reduce((s, h) => s + h.members.length, 0)

  return (
    <div className="space-y-6">
      {/* 파일 선택 */}
      <div
        className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-600" style={{ wordBreak: 'keep-all' }}>
          {fileName || '교구록 xlsx/xls 파일을 클릭하여 선택하세요'}
        </p>
        <p className="text-xs text-slate-400 mt-1" style={{ wordBreak: 'keep-all' }}>
          시트별 순 자동 인식 — 장년/선교회/순 형식
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {parseError && (
        <p className="text-sm text-red-500" style={{ wordBreak: 'keep-all' }}>{parseError}</p>
      )}

      {/* 파싱 결과 미리보기 */}
      {households.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              {households.length}가구 · {totalMembers}명 인식됨
            </p>
            <Button onClick={handleUpload} disabled={uploading} size="sm">
              <Upload className="w-4 h-4 mr-1.5" />
              {uploading ? '등록 중...' : '전체 등록'}
            </Button>
          </div>

          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {households.map((h, i) => (
              <div key={i} className="text-sm">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-left gap-3"
                  onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs bg-slate-100 text-slate-500 rounded px-1.5 py-0.5 whitespace-nowrap flex-shrink-0">
                      {h.district_name} · {h.cell_name}
                    </span>
                    <span className="font-medium text-slate-800 whitespace-nowrap">{h.household_name}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">{h.members.length}명</span>
                  </div>
                  {expandedIdx === i
                    ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                </button>

                {expandedIdx === i && (
                  <div className="px-4 pb-3 bg-slate-50 space-y-2">
                    {h.address_full && (
                      <p className="text-xs text-slate-500 truncate">{h.address_full}</p>
                    )}
                    {(h.phone_primary || h.phone_secondary) && (
                      <p className="text-xs text-slate-500">
                        {[h.phone_primary, h.phone_secondary].filter(Boolean).join(' / ')}
                      </p>
                    )}
                    <div className="mt-1 space-y-0.5">
                      {h.members.map((m, j) => (
                        <div key={j} className="flex gap-2 text-xs">
                          <span className="w-10 text-slate-400 whitespace-nowrap flex-shrink-0">
                            {RELATION_LABEL[m.relation]}
                          </span>
                          <span className="font-medium text-slate-700 whitespace-nowrap">{m.full_name}</span>
                          <span className="text-slate-400">
                            {m.gender === 'male' ? '남' : m.gender === 'female' ? '여' : ''}
                            {m.birth_year ? ` ${m.birth_year}년생` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 결과 */}
      {result && (
        <div
          className={`rounded-lg p-4 text-sm ${
            result.inserted > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          <p className="font-medium">{result.inserted}가구 등록 완료</p>
          {result.errors.length > 0 && (
            <ul className="mt-1.5 space-y-0.5 text-xs">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
