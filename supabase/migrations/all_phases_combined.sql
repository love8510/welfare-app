-- ============================================================
-- Phase 6: 보고서 및 통계 관련 테이블/뷰 생성
-- ============================================================

-- updated_at 자동 갱신 함수 (없는 경우 생성)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 중분류 보고서 카테고리 테이블
CREATE TABLE IF NOT EXISTS report_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  year integer NOT NULL,
  mid_category text NOT NULL,
  service_name text NOT NULL,
  target_count integer DEFAULT 0,
  actual_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (org_id, year, mid_category, service_name)
);

ALTER TABLE report_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org members can manage report_categories" ON report_categories;
CREATE POLICY "org members can manage report_categories"
  ON report_categories
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM staff WHERE user_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS report_categories_updated_at ON report_categories;
CREATE TRIGGER report_categories_updated_at
  BEFORE UPDATE ON report_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 월별 서비스 통계 뷰
CREATE OR REPLACE VIEW monthly_service_stats AS
SELECT
  sr.org_id,
  date_trunc('month', sr.service_date)::date AS month,
  sr.service_type,
  COUNT(DISTINCT sr.client_id) AS client_count,
  COUNT(*) AS session_count,
  COALESCE(SUM(sr.duration_minutes), 0) AS total_minutes,
  COUNT(DISTINCT sr.worker_id) AS worker_count
FROM service_records sr
GROUP BY sr.org_id, date_trunc('month', sr.service_date), sr.service_type;

-- 직원별 월간 근무 통계 뷰
CREATE OR REPLACE VIEW worker_monthly_stats AS
SELECT
  sr.org_id,
  sr.worker_id,
  w.name AS worker_name,
  w.position AS worker_position,
  date_trunc('month', sr.service_date)::date AS month,
  COUNT(DISTINCT sr.client_id) AS client_count,
  COUNT(*) AS session_count,
  COALESCE(SUM(sr.duration_minutes), 0) AS total_minutes,
  COUNT(DISTINCT sr.service_type) AS service_type_count
FROM service_records sr
JOIN staff w ON w.id = sr.worker_id
GROUP BY sr.org_id, sr.worker_id, w.name, w.position, date_trunc('month', sr.service_date);

-- 분기별 보고서 집계 뷰
CREATE OR REPLACE VIEW report_quarterly_summary AS
SELECT
  sr.org_id,
  date_trunc('quarter', sr.service_date)::date AS quarter,
  EXTRACT(year FROM sr.service_date)::integer AS year,
  EXTRACT(quarter FROM sr.service_date)::integer AS quarter_num,
  sr.service_type,
  COUNT(DISTINCT sr.client_id) AS client_count,
  COUNT(*) AS session_count,
  COALESCE(SUM(sr.duration_minutes), 0) AS total_minutes,
  COUNT(DISTINCT sr.worker_id) AS worker_count
FROM service_records sr
GROUP BY sr.org_id, date_trunc('quarter', sr.service_date), sr.service_type,
         EXTRACT(year FROM sr.service_date), EXTRACT(quarter FROM sr.service_date);
-- ============================================================
-- Phase 7: 급여관리 및 재무회계 관련 테이블/뷰/트리거 생성
-- ============================================================

-- 급여 기록 테이블
CREATE TABLE IF NOT EXISTS salary_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  -- 지급항목
  base_salary integer DEFAULT 0,
  position_allowance integer DEFAULT 0,
  meal_allowance integer DEFAULT 0,
  transport_allowance integer DEFAULT 0,
  overtime_pay integer DEFAULT 0,
  holiday_pay integer DEFAULT 0,
  other_pay integer DEFAULT 0,
  gross_pay integer DEFAULT 0,
  -- 공제항목 (직원부담)
  national_pension_emp integer DEFAULT 0,
  health_insurance_emp integer DEFAULT 0,
  long_term_care_emp integer DEFAULT 0,
  employment_ins_emp integer DEFAULT 0,
  income_tax integer DEFAULT 0,
  local_income_tax integer DEFAULT 0,
  other_deduction integer DEFAULT 0,
  total_deduction integer DEFAULT 0,
  -- 실수령액
  net_pay integer DEFAULT 0,
  -- 사업주부담
  national_pension_employer integer DEFAULT 0,
  health_insurance_employer integer DEFAULT 0,
  long_term_care_employer integer DEFAULT 0,
  employment_ins_employer integer DEFAULT 0,
  employment_dev_employer integer DEFAULT 0,
  industrial_ins_employer integer DEFAULT 0,
  severance_pay integer DEFAULT 0,
  total_employer_burden integer DEFAULT 0,
  -- 상태
  is_confirmed boolean DEFAULT false,
  confirmed_at timestamptz,
  memo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (org_id, worker_id, year, month)
);

ALTER TABLE salary_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage salary_records"
  ON salary_records
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM staff WHERE user_id = auth.uid()
    )
  );

-- 급여 합계 자동계산 함수
CREATE OR REPLACE FUNCTION calc_salary_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- 지급 합계
  NEW.gross_pay := COALESCE(NEW.base_salary, 0)
    + COALESCE(NEW.position_allowance, 0)
    + COALESCE(NEW.meal_allowance, 0)
    + COALESCE(NEW.transport_allowance, 0)
    + COALESCE(NEW.overtime_pay, 0)
    + COALESCE(NEW.holiday_pay, 0)
    + COALESCE(NEW.other_pay, 0);

  -- 공제 합계
  NEW.total_deduction := COALESCE(NEW.national_pension_emp, 0)
    + COALESCE(NEW.health_insurance_emp, 0)
    + COALESCE(NEW.long_term_care_emp, 0)
    + COALESCE(NEW.employment_ins_emp, 0)
    + COALESCE(NEW.income_tax, 0)
    + COALESCE(NEW.local_income_tax, 0)
    + COALESCE(NEW.other_deduction, 0);

  -- 실수령액
  NEW.net_pay := NEW.gross_pay - NEW.total_deduction;

  -- 사업주부담 합계
  NEW.total_employer_burden := COALESCE(NEW.national_pension_employer, 0)
    + COALESCE(NEW.health_insurance_employer, 0)
    + COALESCE(NEW.long_term_care_employer, 0)
    + COALESCE(NEW.employment_ins_employer, 0)
    + COALESCE(NEW.employment_dev_employer, 0)
    + COALESCE(NEW.industrial_ins_employer, 0)
    + COALESCE(NEW.severance_pay, 0);

  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calc_salary ON salary_records;
CREATE TRIGGER trg_calc_salary
  BEFORE INSERT OR UPDATE ON salary_records
  FOR EACH ROW EXECUTE FUNCTION calc_salary_totals();

-- 예산 항목 테이블
CREATE TABLE IF NOT EXISTS budget_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  year integer NOT NULL,
  budget_type text NOT NULL CHECK (budget_type IN ('income', 'expense')),
  category text NOT NULL,
  sub_category text,
  item_name text NOT NULL,
  planned_amount bigint DEFAULT 0,
  memo text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage budget_items"
  ON budget_items
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM staff WHERE user_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS budget_items_updated_at ON budget_items;
CREATE TRIGGER budget_items_updated_at
  BEFORE UPDATE ON budget_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 예산 집행 테이블
CREATE TABLE IF NOT EXISTS budget_executions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  budget_item_id uuid REFERENCES budget_items(id) ON DELETE CASCADE,
  execution_date date NOT NULL,
  amount bigint NOT NULL,
  description text,
  receipt_url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budget_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage budget_executions"
  ON budget_executions
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM staff WHERE user_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS budget_executions_updated_at ON budget_executions;
CREATE TRIGGER budget_executions_updated_at
  BEFORE UPDATE ON budget_executions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 예산 집행률 요약 뷰
CREATE OR REPLACE VIEW budget_execution_summary AS
SELECT
  bi.id AS budget_item_id,
  bi.org_id,
  bi.year,
  bi.budget_type,
  bi.category,
  bi.sub_category,
  bi.item_name,
  bi.planned_amount,
  bi.sort_order,
  COALESCE(SUM(be.amount), 0) AS executed_amount,
  CASE
    WHEN bi.planned_amount = 0 THEN 0
    ELSE ROUND(COALESCE(SUM(be.amount), 0)::numeric / bi.planned_amount * 100, 1)
  END AS execution_rate,
  bi.planned_amount - COALESCE(SUM(be.amount), 0) AS remaining_amount,
  COUNT(be.id) AS execution_count
FROM budget_items bi
LEFT JOIN budget_executions be ON be.budget_item_id = bi.id
GROUP BY bi.id, bi.org_id, bi.year, bi.budget_type, bi.category, bi.sub_category,
         bi.item_name, bi.planned_amount, bi.sort_order;
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
