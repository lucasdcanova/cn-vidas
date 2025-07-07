-- Adicionar coluna onboarding_completed à tabela partners
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false NOT NULL;