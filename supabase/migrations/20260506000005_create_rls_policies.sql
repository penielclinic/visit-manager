-- =============================================================================
-- S2 Migration 5/6: RLS 정책
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 헬퍼 함수
-- -----------------------------------------------------------------------------

-- 현재 사용자 역할 반환
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 가구가 현재 사용자의 접근 범위 내에 있는지 확인
CREATE OR REPLACE FUNCTION public.can_access_household(p_household_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.households h
    JOIN public.cells c      ON h.cell_id = c.id
    JOIN public.districts d  ON c.district_id = d.id
    JOIN public.profiles p   ON p.id = auth.uid()
    WHERE h.id = p_household_id
      AND h.deleted_at IS NULL
      AND (
        p.role IN ('senior_pastor', 'associate_pastor')
        OR (p.role IN ('officer', 'district_leader') AND d.id = p.assigned_district_id)
        OR (p.role = 'cell_leader'                   AND c.id = p.assigned_cell_id)
      )
  );
$$;

-- -----------------------------------------------------------------------------
-- profiles RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR public.my_role() = 'senior_pastor'
    OR (
      public.my_role() IN ('associate_pastor', 'officer', 'district_leader')
      AND (
        assigned_district_id = (SELECT assigned_district_id FROM public.profiles WHERE id = auth.uid())
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('senior_pastor', 'associate_pastor')
      )
    )
    OR (
      public.my_role() = 'cell_leader'
      AND assigned_cell_id = (SELECT assigned_cell_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- 본인 프로필 수정 (role, is_active는 Service Role만 변경 가능)
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND is_active = (SELECT is_active FROM public.profiles WHERE id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- districts RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "districts_select" ON public.districts FOR SELECT
  USING (is_active = true);

CREATE POLICY "districts_insert" ON public.districts FOR INSERT
  WITH CHECK (public.my_role() = 'senior_pastor');

CREATE POLICY "districts_update" ON public.districts FOR UPDATE
  USING (public.my_role() = 'senior_pastor');

CREATE POLICY "districts_delete" ON public.districts FOR DELETE
  USING (false);

-- -----------------------------------------------------------------------------
-- cells RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.cells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cells_select" ON public.cells FOR SELECT
  USING (
    is_active = true
    AND (
      public.my_role() IN ('senior_pastor', 'associate_pastor')
      OR district_id = (SELECT assigned_district_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "cells_insert" ON public.cells FOR INSERT
  WITH CHECK (public.my_role() IN ('senior_pastor', 'associate_pastor'));

CREATE POLICY "cells_update" ON public.cells FOR UPDATE
  USING (public.my_role() IN ('senior_pastor', 'associate_pastor'));

CREATE POLICY "cells_delete" ON public.cells FOR DELETE
  USING (false);

-- -----------------------------------------------------------------------------
-- households RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

CREATE POLICY "households_select" ON public.households FOR SELECT
  USING (deleted_at IS NULL AND public.can_access_household(id));

CREATE POLICY "households_insert" ON public.households FOR INSERT
  WITH CHECK (
    public.my_role() IN ('officer', 'district_leader', 'cell_leader')
  );

CREATE POLICY "households_update" ON public.households FOR UPDATE
  USING (
    deleted_at IS NULL
    AND public.can_access_household(id)
    AND public.my_role() IN ('officer', 'district_leader', 'cell_leader')
  );

-- 하드 딜리트 금지 (소프트 딜리트만 허용)
CREATE POLICY "households_delete" ON public.households FOR DELETE
  USING (false);

-- -----------------------------------------------------------------------------
-- household_members RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select" ON public.household_members FOR SELECT
  USING (deleted_at IS NULL AND public.can_access_household(household_id));

CREATE POLICY "members_insert" ON public.household_members FOR INSERT
  WITH CHECK (
    public.my_role() IN ('officer', 'district_leader', 'cell_leader')
    AND public.can_access_household(household_id)
  );

CREATE POLICY "members_update" ON public.household_members FOR UPDATE
  USING (
    deleted_at IS NULL
    AND public.can_access_household(household_id)
    AND public.my_role() IN ('officer', 'district_leader', 'cell_leader')
  );

CREATE POLICY "members_delete" ON public.household_members FOR DELETE
  USING (false);

-- -----------------------------------------------------------------------------
-- visit_schedules RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.visit_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedules_select" ON public.visit_schedules FOR SELECT
  USING (deleted_at IS NULL AND public.can_access_household(household_id));

CREATE POLICY "schedules_insert" ON public.visit_schedules FOR INSERT
  WITH CHECK (
    public.my_role() IN ('officer', 'district_leader', 'cell_leader')
    AND public.can_access_household(household_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "schedules_update" ON public.visit_schedules FOR UPDATE
  USING (
    deleted_at IS NULL
    AND public.can_access_household(household_id)
    AND public.my_role() IN ('officer', 'district_leader', 'cell_leader')
  );

CREATE POLICY "schedules_delete" ON public.visit_schedules FOR DELETE
  USING (false);

-- -----------------------------------------------------------------------------
-- visit_records RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.visit_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "records_select" ON public.visit_records FOR SELECT
  USING (deleted_at IS NULL AND public.can_access_household(household_id));

CREATE POLICY "records_insert" ON public.visit_records FOR INSERT
  WITH CHECK (
    public.my_role() IN ('officer', 'district_leader', 'cell_leader')
    AND visited_by = auth.uid()
    AND public.can_access_household(household_id)
  );

CREATE POLICY "records_update" ON public.visit_records FOR UPDATE
  USING (
    deleted_at IS NULL
    AND visited_by = auth.uid()
    AND public.my_role() IN ('officer', 'district_leader', 'cell_leader')
  );

CREATE POLICY "records_delete" ON public.visit_records FOR DELETE
  USING (false);

-- -----------------------------------------------------------------------------
-- prayer_requests RLS (최고 민감 — senior_pastor/associate_pastor 직접 열람 불가)
-- -----------------------------------------------------------------------------
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prayer_select" ON public.prayer_requests FOR SELECT
  USING (
    deleted_at IS NULL
    AND public.my_role() IN ('officer', 'district_leader', 'cell_leader')
    AND public.can_access_household(household_id)
  );

CREATE POLICY "prayer_insert" ON public.prayer_requests FOR INSERT
  WITH CHECK (
    public.my_role() IN ('officer', 'district_leader', 'cell_leader')
    AND public.can_access_household(household_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "prayer_update" ON public.prayer_requests FOR UPDATE
  USING (
    deleted_at IS NULL
    AND created_by = auth.uid()
    AND public.my_role() IN ('officer', 'district_leader', 'cell_leader')
  );

CREATE POLICY "prayer_delete" ON public.prayer_requests FOR DELETE
  USING (false);

-- -----------------------------------------------------------------------------
-- voice_recordings RLS (최고 민감)
-- -----------------------------------------------------------------------------
ALTER TABLE public.voice_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recordings_select" ON public.voice_recordings FOR SELECT
  USING (
    deleted_at IS NULL
    AND public.my_role() IN ('officer', 'district_leader', 'cell_leader')
    AND public.can_access_household(household_id)
  );

CREATE POLICY "recordings_insert" ON public.voice_recordings FOR INSERT
  WITH CHECK (
    public.my_role() IN ('officer', 'district_leader', 'cell_leader')
    AND uploaded_by = auth.uid()
    AND public.can_access_household(household_id)
  );

CREATE POLICY "recordings_update" ON public.voice_recordings FOR UPDATE
  USING (
    uploaded_by = auth.uid()
    AND public.my_role() IN ('officer', 'district_leader', 'cell_leader')
  );

CREATE POLICY "recordings_delete" ON public.voice_recordings FOR DELETE
  USING (false);

-- -----------------------------------------------------------------------------
-- visit_routes RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.visit_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "routes_select" ON public.visit_routes FOR SELECT
  USING (
    public.my_role() IN ('senior_pastor', 'associate_pastor')
    OR created_by = auth.uid()
  );

CREATE POLICY "routes_insert" ON public.visit_routes FOR INSERT
  WITH CHECK (
    public.my_role() IN ('officer', 'district_leader', 'cell_leader')
    AND created_by = auth.uid()
  );

CREATE POLICY "routes_update" ON public.visit_routes FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "routes_delete" ON public.visit_routes FOR DELETE
  USING (created_by = auth.uid());

-- -----------------------------------------------------------------------------
-- audit_logs RLS (담임목사만 열람)
-- -----------------------------------------------------------------------------
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_select" ON public.audit_logs FOR SELECT
  USING (public.my_role() = 'senior_pastor');

CREATE POLICY "audit_insert" ON public.audit_logs FOR INSERT
  WITH CHECK (true); -- 서버(Service Role)에서만 INSERT
