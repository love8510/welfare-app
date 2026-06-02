-- ============================================================
-- Phase 8: 미접촉 모니터링 및 알림 (실제 DB 컬럼 기준)
-- clients.worker_id → users.id, users.mobile = 전화번호
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

DROP POLICY IF EXISTS "org members can manage alert_settings" ON alert_settings;
CREATE POLICY "org members can manage alert_settings"
  ON alert_settings
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS alert_settings_updated_at ON alert_settings;
CREATE TRIGGER alert_settings_updated_at
  BEFORE UPDATE ON alert_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- alerts 테이블 컬럼 추가
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS kakao_msg_id text;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS send_type text DEFAULT 'auto';
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS error_msg text;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS is_success boolean DEFAULT true;

-- clients_with_contact_status 뷰 갱신
-- 변경: status='이용' 필터, worker_phone(users.mobile), age 추가, 임계값 14/7일로 수정
DROP VIEW IF EXISTS clients_with_contact_status;
CREATE VIEW clients_with_contact_status AS
SELECT
  c.id,
  c.org_id,
  c.worker_id,
  c.name,
  c.gender,
  c.birth_date,
  c.id_number,
  c.phone_mobile,
  c.phone_home,
  c.zipcode,
  c.address,
  c.address_detail,
  c.resident_address,
  c.client_type,
  c.care_grade,
  c.disability,
  c.disability_type,
  c.living_alone,
  c.national_basic,
  c.status,
  c.contract_start,
  c.contract_end,
  c.first_contact_at,
  c.last_contact_at,
  c.memo,
  c.photo_url,
  c.created_at,
  c.updated_at,
  u.name AS worker_name,
  u.mobile AS worker_phone,
  EXTRACT(year FROM age(c.birth_date))::integer AS age,
  CASE
    WHEN c.last_contact_at IS NULL THEN NULL::integer
    ELSE CURRENT_DATE - c.last_contact_at::date
  END AS days_no_contact,
  CASE
    WHEN c.last_contact_at IS NULL THEN 'never'::text
    WHEN (CURRENT_DATE - c.last_contact_at::date) >= 14 THEN 'danger'::text
    WHEN (CURRENT_DATE - c.last_contact_at::date) >= 7 THEN 'warning'::text
    ELSE 'normal'::text
  END AS contact_status
FROM clients c
LEFT JOIN users u ON u.id = c.worker_id
WHERE c.status = '이용';
