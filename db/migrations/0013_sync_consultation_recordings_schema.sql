-- Sincronizar schema da tabela consultation_recordings com o código Drizzle

-- Adicionar colunas faltantes
ALTER TABLE consultation_recordings 
ADD COLUMN IF NOT EXISTS soap_note JSON,
ADD COLUMN IF NOT EXISTS prescription JSON,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS ai_processing_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ai_processing_error TEXT,
ADD COLUMN IF NOT EXISTS transcription_error TEXT;

-- Adicionar comentários para documentação
COMMENT ON COLUMN consultation_recordings.soap_note IS 'Nota SOAP gerada pela IA';
COMMENT ON COLUMN consultation_recordings.prescription IS 'Prescrição médica gerada pela IA';
COMMENT ON COLUMN consultation_recordings.summary IS 'Resumo da consulta gerado pela IA';
COMMENT ON COLUMN consultation_recordings.ai_processing_status IS 'Status do processamento da IA: pending, processing, completed, failed';
COMMENT ON COLUMN consultation_recordings.ai_processing_error IS 'Erro durante processamento da IA, se houver';
COMMENT ON COLUMN consultation_recordings.transcription_error IS 'Erro durante transcrição, se houver';