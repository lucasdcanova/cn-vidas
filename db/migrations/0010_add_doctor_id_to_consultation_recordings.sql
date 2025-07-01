-- Adicionar coluna doctor_id na tabela consultation_recordings
ALTER TABLE consultation_recordings 
ADD COLUMN IF NOT EXISTS doctor_id INTEGER REFERENCES doctors(id);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_consultation_recordings_doctor_id 
ON consultation_recordings(doctor_id);

-- Atualizar registros existentes com o doctor_id baseado no appointment
UPDATE consultation_recordings cr
SET doctor_id = a.doctor_id
FROM appointments a
WHERE cr.appointment_id = a.id
AND cr.doctor_id IS NULL
AND a.doctor_id IS NOT NULL;