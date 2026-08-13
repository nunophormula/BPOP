-- Adiciona workflow de sugestao/aprovacao a platforms/antibodies para que
-- adminHospital/repHospitalar possam propor novos registos sem o admin
-- ter de os pre-criar. Aplicada manualmente (sem migration runner - ver
-- 2026-07-14-add-roles-and-logs.sql).

ALTER TABLE platforms
  MODIFY admin_id INT NULL,                                   -- NULL até aprovação (era NOT NULL)
  ADD COLUMN status ENUM('approved','pending','rejected')
    NOT NULL DEFAULT 'approved' AFTER nome,                   -- registos existentes ficam 'approved' automaticamente
  ADD COLUMN created_by INT NULL AFTER admin_id,               -- quem submeteu (admin ou utilizador do hospital)
  ADD COLUMN hospital_id INT NULL AFTER created_by,            -- hospital que sugeriu (NULL para criação direta do admin)
  ADD COLUMN reviewed_by INT NULL AFTER hospital_id,           -- admin que aprovou/rejeitou
  ADD COLUMN reviewed_at DATETIME NULL AFTER reviewed_by,
  ADD CONSTRAINT fk_platforms_created_by  FOREIGN KEY (created_by)  REFERENCES login(id)    ON DELETE SET NULL,
  ADD CONSTRAINT fk_platforms_hospital_id FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_platforms_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES login(id)    ON DELETE SET NULL,
  ADD INDEX idx_platforms_status (status);

ALTER TABLE antibodies
  MODIFY admin_id INT NULL,
  ADD COLUMN status ENUM('approved','pending','rejected')
    NOT NULL DEFAULT 'approved' AFTER nome,
  ADD COLUMN created_by INT NULL AFTER admin_id,
  ADD COLUMN hospital_id INT NULL AFTER created_by,
  ADD COLUMN reviewed_by INT NULL AFTER hospital_id,
  ADD COLUMN reviewed_at DATETIME NULL AFTER reviewed_by,
  ADD CONSTRAINT fk_antibodies_created_by  FOREIGN KEY (created_by)  REFERENCES login(id)    ON DELETE SET NULL,
  ADD CONSTRAINT fk_antibodies_hospital_id FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_antibodies_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES login(id)    ON DELETE SET NULL,
  ADD INDEX idx_antibodies_status (status);

-- Backfill de auditoria: para registos pre-existentes, admin_id ja identifica
-- quem criou, por isso espelha-se em created_by (idempotente, so toca NULLs).
UPDATE platforms  SET created_by = admin_id WHERE created_by IS NULL AND admin_id IS NOT NULL;
UPDATE antibodies SET created_by = admin_id WHERE created_by IS NULL AND admin_id IS NOT NULL;
