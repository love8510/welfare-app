-- users 테이블 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_type   text DEFAULT '정규직' CHECK (employment_type IN ('정규직','계약직'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_status text DEFAULT '재직' CHECK (employment_status IN ('재직','휴직','퇴사'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_start_date   date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS main_duties       text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url         text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address           text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_detail    text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS zipcode           text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender            text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date        date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_number         text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id_login     text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_cert_no text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS residence_type    text;

-- 급여기초등록 테이블
CREATE TABLE IF NOT EXISTS salary_base (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id              uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  national_pension     numeric(12,2) DEFAULT 0,
  health_insurance     numeric(12,2) DEFAULT 0,
  employment_insurance numeric(12,2) DEFAULT 0,
  industrial_insurance numeric(12,2) DEFAULT 0,
  applied_from         date,
  applied_to           date,
  pension_base_amount  numeric(12,2) DEFAULT 0,
  pension_base_month   text,
  pension_auto_calc    boolean DEFAULT true,
  bank_name            text,
  account_holder       text,
  account_no           text,
  base_salary          numeric(12,2) DEFAULT 0,
  position_allowance   numeric(12,2) DEFAULT 0,
  meal_allowance       numeric(12,2) DEFAULT 0,
  transport_allowance  numeric(12,2) DEFAULT 0,
  other_allowance      numeric(12,2) DEFAULT 0,
  note                 text,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- 근로계약서 테이블
CREATE TABLE IF NOT EXISTS employment_contracts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contract_start date,
  contract_end   date,
  contract_type  text,
  work_start     text DEFAULT '09:00',
  work_end       text DEFAULT '18:00',
  work_days      text[] DEFAULT '{월,화,수,목,금}',
  wage_type      text DEFAULT '월급제',
  wage_amount    numeric(12,2),
  work_location  text,
  duties         text,
  file_url       text,
  file_name      text,
  created_at     timestamptz DEFAULT now()
);

-- 초기상담기록 테이블
CREATE TABLE IF NOT EXISTS staff_counsel_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  counsel_date date,
  counselor    text,
  content      text,
  note         text,
  created_at   timestamptz DEFAULT now()
);

-- RLS 활성화
ALTER TABLE salary_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_counsel_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_iso ON salary_base;
DROP POLICY IF EXISTS org_iso ON employment_contracts;
DROP POLICY IF EXISTS org_iso ON staff_counsel_logs;

CREATE POLICY org_iso ON salary_base
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
CREATE POLICY org_iso ON employment_contracts
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
CREATE POLICY org_iso ON staff_counsel_logs
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
