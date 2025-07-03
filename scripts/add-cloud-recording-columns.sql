-- Adicionar colunas de cloud recording na tabela consultation_recordings
ALTER TABLE consultation_recordings
ADD COLUMN IF NOT EXISTS cloud_recording_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS cloud_recording_url TEXT,
ADD COLUMN IF NOT EXISTS cloud_recording_status VARCHAR(50) DEFAULT 'pending';

-- Adicionar índice para cloud_recording_id
CREATE INDEX IF NOT EXISTS idx_consultation_recordings_cloud_recording_id 
ON consultation_recordings(cloud_recording_id);

-- Adicionar índice para cloud_recording_status
CREATE INDEX IF NOT EXISTS idx_consultation_recordings_cloud_recording_status 
ON consultation_recordings(cloud_recording_status);

-- Adicionar comentários nas colunas
COMMENT ON COLUMN consultation_recordings.cloud_recording_id IS 'ID da gravação no Daily.co';
COMMENT ON COLUMN consultation_recordings.cloud_recording_url IS 'URL de download da gravação no Daily.co';
COMMENT ON COLUMN consultation_recordings.cloud_recording_status IS 'Status da gravação na nuvem: pending, recording, stopped, completed, error';