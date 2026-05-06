-- =============================================================================
-- S2 Migration 4/6: 민감 정보 테이블
-- ⚠️  이 파일의 RLS 정책은 보안 검토 필수
-- prayer_requests: 기도제목 (담임목사도 직접 열람 불가)
-- voice_recordings: 음성 녹음 (officer 이상만 접근)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- prayer_requests: 기도제목 (최고 민감)
-- -----------------------------------------------------------------------------
CREATE TABLE public.prayer_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id     uuid NOT NULL REFERENCES public.visit_records(id) ON DELETE CASCADE,
  household_id  uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  member_id     uuid REFERENCES public.household_members(id) ON DELETE SET NULL,
  content       text NOT NULL,
  is_answered   boolean NOT NULL DEFAULT false,
  answered_at   timestamptz,
  answered_note text,
  deleted_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT
);

CREATE INDEX idx_prayer_record_id    ON public.prayer_requests(record_id);
CREATE INDEX idx_prayer_household_id ON public.prayer_requests(household_id);
CREATE INDEX idx_prayer_answered     ON public.prayer_requests(is_answered) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- voice_recordings: 음성 녹음 (최고 민감)
-- -----------------------------------------------------------------------------
CREATE TABLE public.voice_recordings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id       uuid NOT NULL REFERENCES public.visit_records(id) ON DELETE CASCADE,
  household_id    uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  storage_path    text NOT NULL,
  file_name       text NOT NULL,
  file_size_bytes integer,
  duration_sec    integer,
  mime_type       text NOT NULL DEFAULT 'audio/webm',
  status          public.recording_status NOT NULL DEFAULT 'uploading',
  transcript      text,
  ai_result       jsonb,
  processed_at    timestamptz,
  error_message   text,
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  uploaded_by     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT
);

CREATE INDEX idx_recordings_record_id    ON public.voice_recordings(record_id);
CREATE INDEX idx_recordings_household_id ON public.voice_recordings(household_id);
CREATE INDEX idx_recordings_status       ON public.voice_recordings(status) WHERE deleted_at IS NULL;
