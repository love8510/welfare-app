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
