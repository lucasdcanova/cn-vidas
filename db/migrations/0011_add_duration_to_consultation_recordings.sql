-- Adicionar coluna duration na tabela consultation_recordings se não existir
ALTER TABLE consultation_recordings 
ADD COLUMN IF NOT EXISTS duration INTEGER;

-- Comentário: duração em segundos da gravação
COMMENT ON COLUMN consultation_recordings.duration IS 'Duração da gravação em segundos';