-- Criar tabela de gravações de consultas
CREATE TABLE IF NOT EXISTS consultation_recordings (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id),
  audio_url TEXT NOT NULL,
  duration INTEGER, -- duração em segundos
  file_size INTEGER, -- tamanho em bytes
  
  -- Status do processamento
  transcription_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  transcription TEXT,
  transcription_error TEXT,
  
  -- Dados gerados pela IA
  soap_note JSON,
  prescription JSON,
  summary TEXT,
  ai_processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  ai_processing_error TEXT,
  
  -- Timestamps
  processing_started_at TIMESTAMP,
  processing_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Índices
  UNIQUE(appointment_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_consultation_recordings_doctor_id ON consultation_recordings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultation_recordings_status ON consultation_recordings(transcription_status);
CREATE INDEX IF NOT EXISTS idx_consultation_recordings_created_at ON consultation_recordings(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_consultation_recordings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER consultation_recordings_updated_at
BEFORE UPDATE ON consultation_recordings
FOR EACH ROW
EXECUTE FUNCTION update_consultation_recordings_updated_at();