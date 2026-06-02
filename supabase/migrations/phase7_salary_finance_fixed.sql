-- ============================================================
-- Phase 7: 급여관리 및 재무회계 (실제 DB 컬럼 기준)
-- users 테이블 사용 (staff 아님)
-- ============================================================

-- update_updated_at 함수 (없으면 생성)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 급여 기록 테이블
CREATE TABLE IF NOT EXISTS salary_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES users(id) ON DELETE CASCADE,
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

DROP POLICY IF EXISTS "org members can manage salary_records" ON salary_records;
CREATE POLICY "org members can manage salary_records"
  ON salary_records
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid()
    )
  );

-- 급여 합계 자동계산 함수
CREATE OR REPLACE FUNCTION calc_salary_totals()
RETURNS TRIGGER AS $$
BEGIN
  NEW.gross_pay := COALESCE(NEW.base_salary, 0)
    + COALESCE(NEW.position_allowance, 0)
    + COALESCE(NEW.meal_allowance, 0)
    + COALESCE(NEW.transport_allowance, 0)
    + COALESCE(NEW.overtime_pay, 0)
    + COALESCE(NEW.holiday_pay, 0)
    + COALESCE(NEW.other_pay, 0);

  NEW.total_deduction := COALESCE(NEW.national_pension_emp, 0)
    + COALESCE(NEW.health_insurance_emp, 0)
    + COALESCE(NEW.long_term_care_emp, 0)
    + COALESCE(NEW.employment_ins_emp, 0)
    + COALESCE(NEW.income_tax, 0)
    + COALESCE(NEW.local_income_tax, 0)
    + COALESCE(NEW.other_deduction, 0);

  NEW.net_pay := NEW.gross_pay - NEW.total_deduction;

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

DROP POLICY IF EXISTS "org members can manage budget_items" ON budget_items;
CREATE POLICY "org members can manage budget_items"
  ON budget_items
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid()
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

DROP POLICY IF EXISTS "org members can manage budget_executions" ON budget_executions;
CREATE POLICY "org members can manage budget_executions"
  ON budget_executions
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid()
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
    WHEN bi.planned_amount = 0 THEN 0::numeric
    ELSE ROUND(COALESCE(SUM(be.amount), 0)::numeric / bi.planned_amount * 100, 1)
  END AS execution_rate,
  bi.planned_amount - COALESCE(SUM(be.amount), 0) AS remaining_amount,
  COUNT(be.id) AS execution_count
FROM budget_items bi
LEFT JOIN budget_executions be ON be.budget_item_id = bi.id
GROUP BY bi.id, bi.org_id, bi.year, bi.budget_type, bi.category, bi.sub_category,
         bi.item_name, bi.planned_amount, bi.sort_order;
