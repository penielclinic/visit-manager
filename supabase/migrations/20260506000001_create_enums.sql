-- =============================================================================
-- S2 Migration 1/6: ENUM 타입 정의
-- =============================================================================

-- 역할 (교회 직분 계층)
CREATE TYPE public.user_role AS ENUM (
  'senior_pastor',    -- 담임목사
  'associate_pastor', -- 부목사/전도사
  'officer',          -- 장로/권사/집사 (임원)
  'district_leader',  -- 구역장
  'cell_leader',      -- 순장
  'member'            -- 일반교인
);

-- 심방 상태
CREATE TYPE public.visit_status AS ENUM (
  'scheduled',    -- 예정
  'in_progress',  -- 진행 중
  'completed',    -- 완료
  'cancelled',    -- 취소
  'postponed'     -- 연기
);

-- 심방 유형
CREATE TYPE public.visit_type AS ENUM (
  'regular',      -- 정기 대심방
  'special',      -- 특별 심방 (병문안 등)
  'new_member',   -- 새가족 심방
  'follow_up'     -- 후속 심방
);

-- 가구 상태
CREATE TYPE public.household_status AS ENUM (
  'active',       -- 활성
  'inactive',     -- 비활성
  'moved',        -- 이전
  'withdrawn'     -- 탈퇴
);

-- 구성원 관계
CREATE TYPE public.member_relation AS ENUM (
  'head',         -- 세대주
  'spouse',       -- 배우자
  'child',        -- 자녀
  'parent',       -- 부모
  'sibling',      -- 형제자매
  'other'         -- 기타
);

-- 구성원 신앙 상태
CREATE TYPE public.faith_status AS ENUM (
  'registered',   -- 등록
  'unbaptized',   -- 미세례
  'baptized',     -- 세례
  'confirmed',    -- 입교
  'long_absent',  -- 장기결석
  'withdrawn'     -- 탈퇴
);

-- 성별
CREATE TYPE public.gender AS ENUM (
  'male',
  'female',
  'undisclosed'
);

-- 음성 녹음 처리 상태
CREATE TYPE public.recording_status AS ENUM (
  'uploading',    -- 업로드 중
  'processing',   -- AI 처리 중
  'completed',    -- 완료
  'failed'        -- 실패
);
