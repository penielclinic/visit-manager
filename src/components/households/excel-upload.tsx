'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ExcelRow } from '@/types/households'
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'

const REQUIRED_COLS: (keyof ExcelRow)[] = ['가구명', '대표자명', '구역명', '순명']

export function ExcelUpload() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ExcelRow[]>([])
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null)
  const [parseError, setParseError] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setParseError('')
    setResult(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target!.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
          defval: '',
        })

        const parsed: ExcelRow[] = rawRows.map((row, i) => {
          const errors: string[] = []
          REQUIRED_COLS.forEach((col) => {
            if (!row[col as string]) errors.push(`${col} 누락`)
          })
          return {
            rowIndex: i + 2, // header is row 1
            가구명: row['가구명'] ?? '',
            대표자명: row['대표자명'] ?? '',
            구역명: row['구역명'] ?? '',
            순명: row['순명'] ?? '',
            '주소(전체)': row['주소(전체)'] ?? '',
            '주소(상세)': row['주소(상세)'] ?? '',
            전화1: row['전화1'] ?? '',
            전화2: row['전화2'] ?? '',
            메모: row['메모'] ?? '',
            error: errors.length > 0 ? errors.join(', ') : undefined,
          }
        })
        setRows(parsed)
      } catch {
        setParseError('파일을 읽을 수 없습니다. xlsx/xls 형식인지 확인해주세요.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleUpload() {
    if (rows.length === 0) return
    setUploading(true)
    setResult(null)
    try {
      const res = await fetch('/api/households/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const json = await res.json()
      if (!res.ok) {
        setResult({ inserted: 0, errors: [json.error ?? '알 수 없는 오류'] })
      } else {
        setResult({ inserted: json.inserted, errors: json.errors ?? [] })
        if (json.inserted > 0) {
          setTimeout(() => router.push('/households'), 1500)
        }
      }
    } catch {
      setResult({ inserted: 0, errors: ['네트워크 오류가 발생했습니다.'] })
    } finally {
      setUploading(false)
    }
  }

  const validRows = rows.filter((r) => !r.error)
  const invalidRows = rows.filter((r) => r.error)

  return (
    <div className="space-y-6">
      {/* 파일 선택 */}
      <div
        className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-600" style={{ wordBreak: 'keep-all' }}>
          {fileName || 'xlsx 또는 xls 파일을 클릭하여 선택하세요'}
        </p>
        <p className="text-xs text-slate-400 mt-1" style={{ wordBreak: 'keep-all' }}>
          필수 열: 가구명, 대표자명, 구역명, 순명
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
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span style={{ wordBreak: 'keep-all' }}>{parseError}</span>
        </div>
      )}

      {/* 미리보기 */}
      {rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-600">
              총 <strong>{rows.length}</strong>행 |{' '}
              <span className="text-green-600">유효 {validRows.length}</span>
              {invalidRows.length > 0 && (
                <span className="text-red-500"> / 오류 {invalidRows.length}</span>
              )}
            </p>
            <Button
              onClick={handleUpload}
              disabled={uploading || validRows.length === 0}
              size="sm"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              {uploading ? '업로드 중...' : `${validRows.length}건 업로드`}
            </Button>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">행</TableHead>
                  <TableHead>가구명</TableHead>
                  <TableHead>대표자</TableHead>
                  <TableHead>구역</TableHead>
                  <TableHead>순</TableHead>
                  <TableHead>전화1</TableHead>
                  <TableHead>오류</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.rowIndex}
                    className={row.error ? 'bg-red-50' : undefined}
                  >
                    <TableCell className="text-slate-400 text-xs">{row.rowIndex}</TableCell>
                    <TableCell>
                      <span className="whitespace-nowrap">{row.가구명}</span>
                    </TableCell>
                    <TableCell>
                      <span className="whitespace-nowrap">{row.대표자명}</span>
                    </TableCell>
                    <TableCell>
                      <span className="whitespace-nowrap">{row.구역명}</span>
                    </TableCell>
                    <TableCell>
                      <span className="whitespace-nowrap">{row.순명}</span>
                    </TableCell>
                    <TableCell>
                      <span className="whitespace-nowrap">{row.전화1}</span>
                    </TableCell>
                    <TableCell>
                      {row.error && (
                        <span className="text-xs text-red-500 whitespace-nowrap">
                          {row.error}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* 결과 */}
      {result && (
        <div
          className={`rounded-lg p-4 text-sm ${
            result.inserted > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {result.inserted > 0 && (
            <p style={{ wordBreak: 'keep-all' }}>
              {result.inserted}개 가구가 성공적으로 등록되었습니다. 잠시 후 목록으로 이동합니다.
            </p>
          )}
          {result.errors.length > 0 && (
            <ul className="mt-2 space-y-1 list-disc list-inside">
              {result.errors.map((e, i) => (
                <li key={i} style={{ wordBreak: 'keep-all' }}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
