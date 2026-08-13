-- Adds the 3-tier role model to `login` and a `logs` audit table.
-- Applied by hand (no migration runner in this project).

-- 0. Pre-migration cleanup: two dev/test rows with is_admin=0 and no hospital_id
--    don't map to any of the new roles (adminHospital/repHospitalar both require
--    a hospital_id). Confirmed with the project owner to delete them.
DELETE FROM login WHERE is_admin = 0 AND hospital_id IS NULL;

-- 1. Schema change
ALTER TABLE login
  ADD COLUMN role ENUM('admin','adminHospital','repHospitalar') NOT NULL DEFAULT 'repHospitalar',
  ADD COLUMN created_by INT NULL,
  ADD CONSTRAINT fk_login_created_by FOREIGN KEY (created_by) REFERENCES login(id) ON DELETE SET NULL;

-- 2. Backfill from is_admin
UPDATE login SET role = 'admin'         WHERE is_admin = 1;
UPDATE login SET role = 'adminHospital' WHERE is_admin = 0 AND hospital_id IS NOT NULL;

-- 3. New audit log table (no FK constraints on purpose - logs must survive
--    hospital/login deletes; denormalized snapshot fields keep history readable)
CREATE TABLE logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  user_name VARCHAR(100) NULL,
  user_email VARCHAR(100) NULL,
  role VARCHAR(20) NULL,
  hospital_id INT NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NULL,
  entity_id INT NULL,
  details TEXT NULL,
  ip_address VARCHAR(64) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_hospital_id (hospital_id),
  INDEX idx_created_at (created_at)
);
