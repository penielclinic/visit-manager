import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { UserRoleSelect } from '@/components/admin/user-role-select'
import { UserActiveToggle } from '@/components/admin/user-active-toggle'
import { ShieldCheck } from 'lucide-react'

const ROLE_LABELS = {
  senior_pastor: '담임목사',
  associate_pastor: '부목사',
  officer: '임원',
  district_leader: '선교회장',
  cell_leader: '구역장',
  member: '일반 성도',
}

const ROLE_BADGE_CLASS = {
  senior_pastor: 'bg-purple-100 text-purple-700',
  associate_pastor: 'bg-blue-100 text-blue-700',
  officer: 'bg-amber-100 text-amber-700',
  district_leader: 'bg-sky-100 text-sky-700',
  cell_leader: 'bg-teal-100 text-teal-700',
  member: 'bg-slate-100 text-slate-500',
}

const PERMISSION_TABLE = [
  {
    role: '담임목사',
    badge: 'bg-purple-100 text-purple-700',
    permissions: [
      '모든 가구 조회',
      '심방기록 작성·수정',
      '일정 관리',
      '동선 최적화',
      '통계 열람',
      '기도제목 전체 관리',
      '음성녹음 전체 열람',
      '사용자 관리',
    ],
    restricted: [],
  },
  {
    role: '부목사',
    badge: 'bg-blue-100 text-blue-700',
    permissions: [
      '모든 가구 조회',
      '심방기록 작성·수정',
      '일정 관리',
      '동선 최적화',
      '통계 열람',
    ],
    restricted: ['기도제목 접근 불가', '음성녹음 접근 불가', '사용자 관리 불가'],
  },
  {
    role: '임원',
    badge: 'bg-amber-100 text-amber-700',
    permissions: [
      '담당 선교회 가구 조회',
      '심방기록 작성·수정',
      '일정 관리',
    ],
    restricted: ['기도제목 접근 불가', '음성녹음 접근 불가', '타 선교회 접근 불가'],
  },
  {
    role: '선교회장',
    badge: 'bg-sky-100 text-sky-700',
    permissions: [
      '담당 선교회 가구 조회',
      '심방기록 작성·수정',
      '일정 관리',
    ],
    restricted: ['기도제목 접근 불가', '음성녹음 접근 불가', '타 선교회 접근 불가'],
  },
  {
    role: '구역장',
    badge: 'bg-teal-100 text-teal-700',
    permissions: [
      '담당 구역 가구 조회',
      '심방기록 작성·수정',
      '일정 관리',
    ],
    restricted: ['기도제목 접근 불가', '음성녹음 접근 불가', '타 구역 접근 불가'],
  },
  {
    role: '일반 성도',
    badge: 'bg-slate-100 text-slate-500',
    permissions: [],
    restricted: ['로그인 후 접근 불가 (대시보드 진입 차단)'],
  },
]

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (myProfile?.role !== 'senior_pastor') redirect('/dashboard')

  const admin = createAdminClient()
  const { data: profiles } = await admin
    .from('profiles')
    .select(`
      id, full_name, role, is_active, created_at,
      districts:assigned_district_id(name),
      cells:assigned_cell_id(name)
    `)
    .order('created_at', { ascending: true })

  const users = profiles ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-purple-600" />
          <h1 className="text-2xl font-bold text-slate-900">관리자 설정</h1>
        </div>
        <p className="text-sm text-slate-500" style={{ wordBreak: 'keep-all' }}>
          사용자 역할·활성화 상태를 관리합니다. 담임목사만 접근 가능합니다.
        </p>
      </div>

      {/* 사용자 목록 */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">사용자 관리</h2>
          <p className="text-xs text-slate-400 mt-0.5">총 {users.length}명</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-500">
                <th className="text-left px-6 py-3 whitespace-nowrap">이름</th>
                <th className="text-left px-6 py-3 whitespace-nowrap">현재 역할</th>
                <th className="text-left px-6 py-3 whitespace-nowrap">역할 변경</th>
                <th className="text-left px-6 py-3 whitespace-nowrap">담당 선교회/순</th>
                <th className="text-left px-6 py-3 whitespace-nowrap">활성</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === user.id
                const roleKey = u.role as keyof typeof ROLE_LABELS
                return (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium whitespace-nowrap">{u.full_name}</span>
                        {isSelf && (
                          <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">나</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${ROLE_BADGE_CLASS[roleKey]}`}>
                        {ROLE_LABELS[roleKey]}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <UserRoleSelect
                        userId={u.id}
                        currentRole={u.role}
                        isSelf={isSelf}
                      />
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {/* @ts-expect-error supabase join type */}
                      {u.districts?.name && u.cells?.name
                        // @ts-expect-error supabase join type
                        ? `${u.districts.name} / ${u.cells.name}`
                        // @ts-expect-error supabase join type
                        : u.districts?.name ?? u.cells?.name ?? '-'}
                    </td>
                    <td className="px-6 py-3">
                      <UserActiveToggle
                        userId={u.id}
                        isActive={u.is_active}
                        isSelf={isSelf}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 권한 안내 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">역할별 권한 안내</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERMISSION_TABLE.map((item) => (
            <div key={item.role} className="rounded-lg border border-slate-100 p-4">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.badge}`}>
                {item.role}
              </span>
              <ul className="mt-3 space-y-1">
                {item.permissions.map((p) => (
                  <li key={p} className="flex items-start gap-1.5 text-xs text-slate-600">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span style={{ wordBreak: 'keep-all' }}>{p}</span>
                  </li>
                ))}
                {item.restricted.map((r) => (
                  <li key={r} className="flex items-start gap-1.5 text-xs text-slate-400">
                    <span className="mt-0.5">✗</span>
                    <span style={{ wordBreak: 'keep-all' }}>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
