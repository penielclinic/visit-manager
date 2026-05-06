-- =============================================================================
-- S2 Migration 6/6: 트리거
-- - 카카오 로그인 시 profiles 자동 생성
-- - updated_at 자동 갱신
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 카카오 OAuth → profiles 자동 생성
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kakao_id   text;
  v_full_name  text;
  v_avatar_url text;
BEGIN
  v_kakao_id   := NEW.raw_user_meta_data->>'provider_id';
  v_full_name  := COALESCE(
                    NEW.raw_user_meta_data->>'full_name',
                    NEW.raw_user_meta_data->>'name',
                    split_part(NEW.email, '@', 1),
                    '이름없음'
                  );
  v_avatar_url := NEW.raw_user_meta_data->>'avatar_url';

  INSERT INTO public.profiles (
    id, kakao_id, full_name, avatar_url, role, is_active, created_at, updated_at
  ) VALUES (
    NEW.id, v_kakao_id, v_full_name, v_avatar_url, 'member', true, now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    kakao_id   = EXCLUDED.kakao_id,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
    -- full_name, role, is_active는 덮어쓰지 않음 (관리자 설정 보호)

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- updated_at 자동 갱신 (공통)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles', 'districts', 'cells', 'households',
    'household_members', 'visit_schedules', 'visit_records',
    'prayer_requests', 'voice_recordings'
  ]
  LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER trg_%I_updated_at
       BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;
