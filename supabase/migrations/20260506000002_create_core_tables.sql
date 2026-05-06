-- =============================================================================
-- S2 Migration 2/6: 핵심 테이블 (조직 구조 + 가구)
-- 순환 참조 해결: profiles 먼저 생성 → districts/cells → ALTER TABLE로 FK 추가
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles: 사용자 프로필 (auth.users와 1:1)
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  kakao_id        text UNIQUE,
  full_name       text NOT NULL,
  display_name    text,
  phone           text,
  avatar_url      text,
  role            public.user_role NOT NULL DEFAULT 'member',
  is_active       boolean NOT NULL DEFAULT true,
  -- assigned_*는 districts/cells 생성 후 ALTER TABLE로 추가
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- districts: 구역
-- -----------------------------------------------------------------------------
CREATE TABLE public.districts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  description     text,
  leader_id       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  sort_order      smallint NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- cells: 순
-- -----------------------------------------------------------------------------
CREATE TABLE public.cells (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id     uuid NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  leader_id       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  sort_order      smallint NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 순환 참조 해결: profiles에 FK 컬럼 추가
ALTER TABLE public.profiles
  ADD COLUMN assigned_district_id uuid REFERENCES public.districts(id) ON DELETE SET NULL,
  ADD COLUMN assigned_cell_id     uuid REFERENCES public.cells(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- households: 가구
-- -----------------------------------------------------------------------------
CREATE TABLE public.households (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_id             uuid NOT NULL REFERENCES public.cells(id) ON DELETE RESTRICT,
  household_name      text NOT NULL,
  representative_name text NOT NULL,

  -- 주소 (동선 최적화용)
  address_full        text,
  address_detail      text,
  latitude            numeric(10, 7),
  longitude           numeric(10, 7),
  geocoded_at         timestamptz,

  -- 연락처
  phone_primary       text,
  phone_secondary     text,

  -- 상태
  status              public.household_status NOT NULL DEFAULT 'active',
  notes               text,

  -- 엑셀 업로드 추적
  imported_at         timestamptz,
  import_batch_id     uuid,

  -- 소프트 딜리트
  deleted_at          timestamptz,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX idx_households_cell_id   ON public.households(cell_id);
CREATE INDEX idx_households_status    ON public.households(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_households_location  ON public.households(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_households_deleted   ON public.households(deleted_at) WHERE deleted_at IS NOT NULL;

-- -----------------------------------------------------------------------------
-- household_members: 가구 구성원
-- -----------------------------------------------------------------------------
CREATE TABLE public.household_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  full_name       text NOT NULL,
  relation        public.member_relation NOT NULL DEFAULT 'other',
  gender          public.gender NOT NULL DEFAULT 'undisclosed',
  birth_year      smallint,
  phone           text,
  faith_status    public.faith_status NOT NULL DEFAULT 'registered',
  is_primary      boolean NOT NULL DEFAULT false,
  is_active       boolean NOT NULL DEFAULT true,
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_members_household_id ON public.household_members(household_id);
CREATE INDEX idx_members_faith_status ON public.household_members(faith_status) WHERE deleted_at IS NULL;
