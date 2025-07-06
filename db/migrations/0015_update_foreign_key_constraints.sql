-- Migration para atualizar constraints de chave estrangeira
-- Permite exclusão em cascata para evitar erros de constraint

-- Atualizar auditLogs para SET NULL
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Atualizar medicalRecords para CASCADE
ALTER TABLE medical_records DROP CONSTRAINT IF EXISTS medical_records_patient_id_fkey;
ALTER TABLE medical_records ADD CONSTRAINT medical_records_patient_id_fkey 
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE medical_records DROP CONSTRAINT IF EXISTS medical_records_doctor_id_fkey;
ALTER TABLE medical_records ADD CONSTRAINT medical_records_doctor_id_fkey 
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE;

-- Atualizar medicalRecordEntries para CASCADE
ALTER TABLE medical_record_entries DROP CONSTRAINT IF EXISTS medical_record_entries_author_id_fkey;
ALTER TABLE medical_record_entries ADD CONSTRAINT medical_record_entries_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;

-- Atualizar medicalRecordAccess para CASCADE
ALTER TABLE medical_record_access DROP CONSTRAINT IF EXISTS medical_record_access_user_id_fkey;
ALTER TABLE medical_record_access ADD CONSTRAINT medical_record_access_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Commit da transação
COMMIT;