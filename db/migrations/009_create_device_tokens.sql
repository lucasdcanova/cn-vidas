-- Criar tabela para armazenar tokens de dispositivos (push notifications)
CREATE TABLE IF NOT EXISTS device_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    token TEXT NOT NULL,
    device_info JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Garantir que cada usuário tem apenas um token ativo por plataforma
    UNIQUE(user_id, platform)
);

-- Índices para performance
CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX idx_device_tokens_platform ON device_tokens(platform);
CREATE INDEX idx_device_tokens_is_active ON device_tokens(is_active);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_device_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER device_tokens_updated_at_trigger
BEFORE UPDATE ON device_tokens
FOR EACH ROW
EXECUTE FUNCTION update_device_tokens_updated_at();

-- Comentários
COMMENT ON TABLE device_tokens IS 'Armazena tokens de dispositivos para push notifications';
COMMENT ON COLUMN device_tokens.platform IS 'Plataforma do dispositivo: ios, android ou web';
COMMENT ON COLUMN device_tokens.token IS 'Token único do dispositivo para envio de notificações';
COMMENT ON COLUMN device_tokens.device_info IS 'Informações adicionais do dispositivo (modelo, OS, etc)';
COMMENT ON COLUMN device_tokens.is_active IS 'Se o token está ativo e pode receber notificações';
COMMENT ON COLUMN device_tokens.last_used_at IS 'Última vez que o token foi usado para enviar notificação';