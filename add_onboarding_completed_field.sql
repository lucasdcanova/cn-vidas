-- Adicionar campo onboardingCompleted à tabela doctors
-- Este campo controla se o médico completou o processo de onboarding

ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL;

-- Adicionar campos adicionais do novo onboarding
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS consultation_price_description TEXT,
ADD COLUMN IF NOT EXISTS full_bio TEXT,
ADD COLUMN IF NOT EXISTS areas_of_expertise TEXT[],
ADD COLUMN IF NOT EXISTS languages_spoken TEXT[],
ADD COLUMN IF NOT EXISTS achievements TEXT;

-- Atualizar registros existentes
-- Se o médico já tinha welcomeCompleted como true, vamos considerar que ele também completou o onboarding
UPDATE doctors 
SET onboarding_completed = TRUE 
WHERE welcome_completed = TRUE;

-- Comentário explicativo sobre os campos
COMMENT ON COLUMN doctors.onboarding_completed IS 'Indica se o médico completou o novo fluxo de onboarding';
COMMENT ON COLUMN doctors.welcome_completed IS 'Campo legado - indica se o médico completou o fluxo antigo de boas-vindas';
COMMENT ON COLUMN doctors.consultation_price_description IS 'Descrição detalhada sobre o valor da consulta';
COMMENT ON COLUMN doctors.full_bio IS 'Biografia completa do médico';
COMMENT ON COLUMN doctors.areas_of_expertise IS 'Áreas de especialização do médico';
COMMENT ON COLUMN doctors.languages_spoken IS 'Idiomas falados pelo médico';
COMMENT ON COLUMN doctors.achievements IS 'Conquistas e certificações do médico';