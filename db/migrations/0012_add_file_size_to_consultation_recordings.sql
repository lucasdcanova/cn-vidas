-- Adicionar coluna file_size se ela não existir
ALTER TABLE consultation_recordings 
ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Adicionar comentário para documentação
COMMENT ON COLUMN consultation_recordings.file_size IS 'Tamanho do arquivo de áudio em bytes';