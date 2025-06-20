-- Adiciona a coluna rqe (Registro de Qualificação de Especialista) à tabela doctors
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS rqe TEXT;