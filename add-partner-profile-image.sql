-- Adicionar coluna profile_image à tabela partners se ela não existir
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Adicionar comentário para documentação
COMMENT ON COLUMN partners.profile_image IS 'URL da imagem de perfil do parceiro';

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'partners' 
AND column_name = 'profile_image';