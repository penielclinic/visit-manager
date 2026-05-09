-- 가구 등록 권한: 모든 인증된 사용자 허용
DROP POLICY IF EXISTS "households_insert" ON public.households;
CREATE POLICY "households_insert" ON public.households FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 가족 구성원 등록 권한: 모든 인증된 사용자 허용
DROP POLICY IF EXISTS "members_insert" ON public.household_members;
CREATE POLICY "members_insert" ON public.household_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
