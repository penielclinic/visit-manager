/** 현재 날짜를 한국 시간(KST, UTC+9) 기준 YYYY-MM-DD 문자열로 반환 */
export function todayKST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}

/** 현재 월의 1일을 KST 기준 YYYY-MM-DD 문자열로 반환 */
export function monthStartKST(): string {
  const d = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
  return d.slice(0, 8) + '01'
}

/** N개월 전 1일을 KST 기준 YYYY-MM-DD 문자열로 반환 */
export function monthsAgoStartKST(months: number): string {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
  now.setMonth(now.getMonth() - months)
  now.setDate(1)
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

/** N일 후 날짜를 KST 기준 YYYY-MM-DD 문자열로 반환 */
export function daysFromNowKST(days: number): string {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
  now.setDate(now.getDate() + days)
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
}
