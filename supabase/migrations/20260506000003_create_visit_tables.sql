-- =============================================================================
-- S2 Migration 3/6: 심방 관련 테이블
-- =============================================================================

-- -----------------------------------------------------------------------------
-- visit_schedules: 심방 일정
-- -----------------------------------------------------------------------------
CREATE TABLE public.visit_schedules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  assigned_to     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  visit_type      public.visit_type NOT NULL DEFAULT 'regular',
  status          public.visit_status NOT NULL DEFAULT 'scheduled',
  scheduled_date  date NOT NULL,
  scheduled_time  time,
  duration_min    smallint DEFAULT 30,
  visit_order     smallint,
  memo            text,
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT
);

CREATE INDEX idx_schedules_household_id ON public.visit_schedules(household_id);
CREATE INDEX idx_schedules_assigned_to  ON public.visit_schedules(assigned_to);
CREATE INDEX idx_schedules_date         ON public.visit_schedules(scheduled_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_schedules_status       ON public.visit_schedules(status) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- visit_records: 심방 기록 (민감 정보 포함)
-- -----------------------------------------------------------------------------
CREATE TABLE public.visit_records (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id           uuid REFERENCES public.visit_schedules(id) ON DELETE SET NULL,
  household_id          uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  visited_by            uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  visited_at            timestamptz NOT NULL DEFAULT now(),
  duration_actual_min   smallint,
  content               text,
  special_notes         text,
  ai_summary            text,
  ai_follow_up          text,
  attending_member_ids  uuid[],
  deleted_at            timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_records_household_id ON public.visit_records(household_id);
CREATE INDEX idx_records_visited_by   ON public.visit_records(visited_by);
CREATE INDEX idx_records_visited_at   ON public.visit_records(visited_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_records_schedule_id  ON public.visit_records(schedule_id);

-- -----------------------------------------------------------------------------
-- visit_routes: 동선 최적화 결과 (S5에서 활용)
-- -----------------------------------------------------------------------------
CREATE TABLE public.visit_routes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_date            date NOT NULL,
  created_by            uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ordered_schedule_ids  uuid[] NOT NULL,
  total_distance_m      integer,
  total_duration_sec    integer,
  optimization_algo     text DEFAULT 'nearest_neighbor',
  route_geojson         jsonb,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_routes_date       ON public.visit_routes(route_date);
CREATE INDEX idx_routes_created_by ON public.visit_routes(created_by);

-- -----------------------------------------------------------------------------
-- audit_logs: 감사 로그
-- -----------------------------------------------------------------------------
CREATE TABLE public.audit_logs (
  id            bigserial PRIMARY KEY,
  actor_id      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action        text NOT NULL,
  target_table  text NOT NULL,
  target_id     uuid,
  old_data      jsonb,
  new_data      jsonb,
  ip_address    inet,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_actor_id   ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_target     ON public.audit_logs(target_table, target_id);
CREATE INDEX idx_audit_created_at ON public.audit_logs(created_at DESC);
