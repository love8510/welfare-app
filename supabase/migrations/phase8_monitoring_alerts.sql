-- ============================================================
-- Phase 8: 미접촉 모니터링 및 알림 관련 테이블/뷰 수정
-- ============================================================

-- 알림 설정 테이블
CREATE TABLE IF NOT EXISTS alert_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  warning_days integer DEFAULT 7,
  danger_days integer DEFAULT 14,
  send_days integer[] DEFAULT '{1,2,3,4,5}'::integer[],
  send_time time DEFAULT '09:00',
  kakao_api_key text,
  kakao_sender_key text,
  kakao_template_code text,
  email_fallback text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage alert_settings"
  ON alert_settings
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM staff WHERE user_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS alert_settings_updated_at ON alert_settings;
CREATE TRIGGER alert_settings_updated_at
  BEFORE UPDATE ON alert_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- alerts 테이블 컬럼 추가 (없는 경우에만)
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS kakao_msg_id text;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS send_type text DEFAULT 'auto';
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS error_msg text;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS is_success boolean DEFAULT true;

-- contact_logs 테이블 컬럼 추가 (없는 경우에만)
ALTER TABLE contact_logs ADD COLUMN IF NOT EXISTS plan_date date;
ALTER TABLE contact_logs ADD COLUMN IF NOT EXISTS start_time time;
ALTER TABLE contact_logs ADD COLUMN IF NOT EXISTS end_time time;
ALTER TABLE contact_logs ADD COLUMN IF NOT EXISTS daily_plan_id uuid;

-- clients_with_contact_status 뷰 갱신 (worker_phone, age, living_alone 포함)
DROP VIEW IF EXISTS clients_with_contact_status CASCADE;

CREATE OR REPLACE VIEW clients_with_contact_status AS
SELECT
  c.id,
  c.org_id,
  c.name,
  c.gender,
  c.phone_mobile,
  c.address,
  c.client_type,
  c.living_alone,
  EXTRACT(year FROM age(c.birth_date))::integer AS age,
  cl_last.contact_date AS last_contact_at,
  c.assigned_worker_id AS worker_id,
  w.name AS worker_name,
  w.phone_mobile AS worker_phone,
  CASE
    WHEN cl_last.contact_date IS NULL THEN
      EXTRACT(day FROM now() - c.created_at)::integer
    ELSE
      EXTRACT(day FROM now() - cl_last.contact_date)::integer
  END AS days_no_contact,
  CASE
    WHEN cl_last.contact_date IS NULL AND EXTRACT(day FROM now() - c.created_at) > 14 THEN 'never'
    WHEN cl_last.contact_date IS NULL THEN 'never'
    WHEN EXTRACT(day FROM now() - cl_last.contact_date) >= 14 THEN 'danger'
    WHEN EXTRACT(day FROM now() - cl_last.contact_date) >= 7 THEN 'warning'
    ELSE 'normal'
  END AS contact_status
FROM clients c
LEFT JOIN staff w ON w.id = c.assigned_worker_id
LEFT JOIN LATERAL (
  SELECT contact_date
  FROM contact_logs
  WHERE client_id = c.id
  ORDER BY contact_date DESC
  LIMIT 1
) cl_last ON true
WHERE c.status = '이용';

-- last_contact_at 자동 업데이트 트리거 (contact_logs insert/update 시)
CREATE OR REPLACE FUNCTION update_client_last_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- 뷰가 처리하므로 실제 컬럼이 없는 경우 스킵
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- pg_cron extension 활성화 (사용 가능한 경우)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
