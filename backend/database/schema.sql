-- ============================================================
-- Smart Health Risk Predictor — Reporting & Analytics Schema
-- Engine: InnoDB | Charset: utf8mb4
-- Optimised for 150,000+ records with composite indexes
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_health_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_health_db;

-- ─────────────────────────────────────────────────────────────
-- Table: reports
--   Stores aggregated health metrics per reporting period
--   together with the AI-predicted risk outcome.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id                    INT             NOT NULL AUTO_INCREMENT,
  user_id               INT             NOT NULL,
  report_type           ENUM('weekly','monthly') NOT NULL DEFAULT 'weekly',
  start_date            DATE            NOT NULL,
  end_date              DATE            NOT NULL,

  -- ── Lifestyle & Physical Metrics ──────────────────────────
  avg_sleep_duration    FLOAT           DEFAULT NULL COMMENT 'hours/night',
  avg_sleep_quality     FLOAT           DEFAULT NULL COMMENT '1-10 scale',
  avg_stress_level      FLOAT           DEFAULT NULL COMMENT '1-10 scale',
  avg_heart_rate        FLOAT           DEFAULT NULL COMMENT 'bpm',
  avg_blood_pressure    FLOAT           DEFAULT NULL COMMENT 'systolic mmHg',
  avg_bmi               FLOAT           DEFAULT NULL,
  avg_steps             INT             DEFAULT NULL COMMENT 'steps/day',
  avg_calories          FLOAT           DEFAULT NULL COMMENT 'kcal/day',
  avg_water_intake      FLOAT           DEFAULT NULL COMMENT 'litres/day',
  avg_screen_time       FLOAT           DEFAULT NULL COMMENT 'hours/day',
  avg_study_hours       FLOAT           DEFAULT NULL COMMENT 'hours/day',

  -- ── Mental Health Metrics ──────────────────────────────────
  avg_anxiety_score     FLOAT           DEFAULT NULL COMMENT '0-21 GAD scale',
  avg_depression_score  FLOAT           DEFAULT NULL COMMENT '0-27 PHQ scale',

  -- ── Demographic Snapshot (per report) ─────────────────────
  avg_age               FLOAT           DEFAULT NULL,
  avg_height            FLOAT           DEFAULT NULL COMMENT 'cm',
  avg_weight            FLOAT           DEFAULT NULL COMMENT 'kg',

  -- ── Categorical Feature Summaries ─────────────────────────
  smoking_status        VARCHAR(50)     DEFAULT NULL,
  alcohol_consumption   VARCHAR(50)     DEFAULT NULL,
  physical_activity     VARCHAR(50)     DEFAULT NULL,
  medical_history       TEXT            DEFAULT NULL,
  family_history        TEXT            DEFAULT NULL,
  gender                VARCHAR(20)     DEFAULT NULL,

  -- ── AI Prediction Results ─────────────────────────────────
  predicted_risk_score  FLOAT           DEFAULT NULL COMMENT '0.0 – 1.0 normalised',
  predicted_risk_level  VARCHAR(20)     DEFAULT NULL COMMENT 'low | moderate | high',

  created_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- ── Indexes for query performance at scale ─────────────────
  INDEX idx_user_id            (user_id),
  INDEX idx_user_dates         (user_id, start_date, end_date),
  INDEX idx_report_type        (report_type),
  INDEX idx_risk_level         (predicted_risk_level),
  INDEX idx_created_at         (created_at),
  INDEX idx_user_risk          (user_id, predicted_risk_level),

  CONSTRAINT chk_dates CHECK (end_date >= start_date)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Aggregated health reports with AI predictions';


-- ─────────────────────────────────────────────────────────────
-- Table: analytics_dashboard
--   Single-row summary per user, auto-refreshed on each
--   report create / update / delete via application logic.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_dashboard (
  id                    INT             NOT NULL AUTO_INCREMENT,
  user_id               INT             NOT NULL,
  total_reports         INT             NOT NULL DEFAULT 0,
  latest_risk_level     VARCHAR(20)     DEFAULT NULL,
  average_risk_score    FLOAT           DEFAULT NULL,
  high_risk_count       INT             NOT NULL DEFAULT 0,
  moderate_risk_count   INT             NOT NULL DEFAULT 0,
  low_risk_count        INT             NOT NULL DEFAULT 0,
  last_updated          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_user_dashboard (user_id),
  INDEX idx_dashboard_user (user_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Live analytics summary per user';
