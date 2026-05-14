'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VISIT_TYPE_LABELS } from '@/types/records'
import type { RecordWithRelations } from '@/types/records'

function PrintContent({ record }: { record: RecordWithRelations }) {
  const district = record.households.cells?.districts?.name ?? ''
  const cell = record.households.cells?.name ?? ''

  return (
    <div className="p-8 max-w-2xl mx-auto font-sans text-sm text-gray-900">
      {/* 헤더 */}
      <div className="border-b-2 border-gray-800 pb-3 mb-6">
        <h1 className="text-xl font-bold">심방 기록</h1>
        <p className="text-gray-500 text-xs mt-1">해운대순복음교회 대심방 매니저</p>
      </div>

      {/* 기본 정보 */}
      <table className="w-full mb-6 border-collapse">
        <tbody>
          <tr className="border-b border-gray-200">
            <td className="py-2 pr-4 w-28 text-gray-500 font-medium">가정</td>
            <td className="py-2 font-semibold">
              {record.households.household_name} ({record.households.representative_name})
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-2 pr-4 text-gray-500 font-medium">선교회 / 순</td>
            <td className="py-2">{district && cell ? `${district} / ${cell}` : '-'}</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-2 pr-4 text-gray-500 font-medium">심방일</td>
            <td className="py-2">{record.visited_at.slice(0, 10)}</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-2 pr-4 text-gray-500 font-medium">심방 유형</td>
            <td className="py-2">{VISIT_TYPE_LABELS[record.visit_type]}</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-2 pr-4 text-gray-500 font-medium">기록자</td>
            <td className="py-2">{record.profiles?.full_name ?? '-'}</td>
          </tr>
          {record.duration_actual_min && (
            <tr className="border-b border-gray-200">
              <td className="py-2 pr-4 text-gray-500 font-medium">소요 시간</td>
              <td className="py-2">{record.duration_actual_min}분</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 심방 내용 */}
      <div className="mb-5">
        <h2 className="font-semibold text-gray-700 border-b border-gray-300 pb-1 mb-2">심방 내용</h2>
        <p className="whitespace-pre-wrap leading-relaxed">
          {record.content || '내용 없음'}
        </p>
      </div>

      {/* 기도제목 */}
      <div className="mb-5">
        <h2 className="font-semibold text-gray-700 border-b border-gray-300 pb-1 mb-2">기도제목</h2>
        <p className="whitespace-pre-wrap leading-relaxed">
          {record.prayer_notes || '없음'}
        </p>
      </div>

      {/* 특이사항 */}
      <div className="mb-5">
        <h2 className="font-semibold text-gray-700 border-b border-gray-300 pb-1 mb-2">특이사항</h2>
        <p className="whitespace-pre-wrap leading-relaxed">
          {record.special_notes || '없음'}
        </p>
      </div>

      {/* 푸터 */}
      <div className="mt-10 pt-3 border-t border-gray-200 text-xs text-gray-400 flex justify-between">
        <span>출력일: {new Date().toLocaleDateString('ko-KR')}</span>
        <span>대심방 매니저</span>
      </div>
    </div>
  )
}

export default function RecordPrintPage({ params }: { params: { id: string } }) {
  const [record, setRecord] = useState<RecordWithRelations | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('visit_records')
      .select(`
        *,
        households(
          id,
          household_name,
          representative_name,
          cells(id, name, districts(id, name))
        ),
        profiles!visit_records_visited_by_fkey(id, full_name)
      `)
      .eq('id', params.id)
      .is('deleted_at', null)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('기록을 불러올 수 없습니다.')
          return
        }
        setRecord(data as unknown as RecordWithRelations)
      })
  }, [params.id])

  useEffect(() => {
    if (record) {
      setTimeout(() => window.print(), 300)
    }
  }, [record])

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>
  }

  if (!record) {
    return <div className="p-8 text-gray-400">불러오는 중...</div>
  }

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          button, .no-print { display: none !important; }
        }
      `}</style>
      <div className="no-print fixed top-4 right-4 flex gap-2 z-10">
        <button
          onClick={() => window.print()}
          className="bg-slate-800 text-white px-4 py-2 rounded text-sm hover:bg-slate-700"
        >
          PDF 저장
        </button>
        <button
          onClick={() => window.close()}
          className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded text-sm hover:bg-slate-50"
        >
          닫기
        </button>
      </div>
      <PrintContent record={record} />
    </>
  )
}
