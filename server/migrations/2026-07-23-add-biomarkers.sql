-- Suporte à gestão de biomarcadores (nova tab em "Gestão de dados"): cada
-- biomarcador tem palavras-chave próprias (deteção do biomarcador em texto
-- livre) e uma lista de resultados possíveis, cada um com as suas próprias
-- palavras-chave (deteção do valor do resultado). Aplicada manualmente (sem
-- migration runner - ver 2026-07-14-add-roles-and-logs.sql).

CREATE TABLE biomarkers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  keywords JSON NOT NULL,
  admin_id INT NULL,
  created_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY nome_unique (nome),
  CONSTRAINT fk_biomarkers_admin FOREIGN KEY (admin_id) REFERENCES login(id),
  CONSTRAINT fk_biomarkers_created_by FOREIGN KEY (created_by) REFERENCES login(id) ON DELETE SET NULL
);

CREATE TABLE biomarker_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  biomarker_id INT NOT NULL,
  value VARCHAR(255) NOT NULL,
  keywords JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_biomarker_results_biomarker FOREIGN KEY (biomarker_id) REFERENCES biomarkers(id) ON DELETE CASCADE
);
