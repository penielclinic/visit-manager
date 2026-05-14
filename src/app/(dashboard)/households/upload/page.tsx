import Link from 'next/link'
import { ExcelUpload } from '@/components/households/excel-upload'
import { ChurchRecordUpload } from '@/components/households/church-record-upload'
import { ChevronRight } from 'lucide-react'

export default function UploadPage() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link href="/households" className="hover:text-slate-700 whitespace-nowrap">
          세대 관리
        </Link>
        <ChevronRight className="w-4 h-4 flex-shrink-0" />
        <span className="text-slate-900 whitespace-nowrap">엑셀 업로드</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">엑셀 업로드</h1>
        <p className="text-sm text-slate-500 mt-0.5" style={{ wordBreak: 'keep-all' }}>
          엑셀 파일로 가구를 일괄 등록합니다.
        </p>
      </div>

      {/* 교구록 업로드 */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">교구록 업로드</h2>
          <p className="text-sm text-slate-500 mt-0.5" style={{ wordBreak: 'keep-all' }}>
            장년부 교구록 양식(xls/xlsx)을 그대로 업로드하면 가구·구성원을 자동 등록합니다.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <ChurchRecordUpload />
        </div>
      </div>

      <div className="border-t border-slate-100" />

      {/* 일반 양식 업로드 */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">일반 양식 업로드</h2>
          <p className="text-sm text-slate-500 mt-0.5" style={{ wordBreak: 'keep-all' }}>
            직접 작성한 엑셀 양식으로 가구를 등록합니다.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          <p className="font-medium mb-1">엑셀 형식 안내</p>
          <ul className="list-disc list-inside space-y-0.5" style={{ wordBreak: 'keep-all' }}>
            <li>1행은 헤더(열 이름)여야 합니다</li>
            <li>필수 열: 가구명, 대표자명, 선교회명, 순명</li>
            <li>선택 열: 주소(전체), 주소(상세), 전화1, 전화2, 메모</li>
            <li>선교회·순이 DB에 없으면 자동 생성됩니다</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <ExcelUpload />
        </div>
      </div>
    </div>
  )
}
