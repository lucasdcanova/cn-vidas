-- Tabela para rastrear arquivos armazenados de forma segura
CREATE TABLE IF NOT EXISTS secure_files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    file_key VARCHAR(500) NOT NULL UNIQUE,
    file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('profile', 'medical', 'consultation', 'document')),
    original_name VARCHAR(255),
    content_type VARCHAR(100),
    size_bytes BIGINT,
    bucket_name VARCHAR(255),
    storage_class VARCHAR(50),
    encryption_type VARCHAR(50),
    checksum VARCHAR(64), -- SHA-256
    metadata JSONB DEFAULT '{}',
    is_encrypted BOOLEAN DEFAULT FALSE,
    is_anonymized BOOLEAN DEFAULT FALSE,
    lgpd_consent BOOLEAN DEFAULT TRUE,
    consent_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
    INDEX idx_secure_files_user_id (user_id),
    INDEX idx_secure_files_file_type (file_type),
    INDEX idx_secure_files_created_at (created_at)
);

-- Tabela de auditoria para conformidade LGPD
CREATE TABLE IF NOT EXISTS storage_audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('upload', 'download', 'view', 'delete', 'anonymize', 'export')),
    file_key VARCHAR(500),
    file_type VARCHAR(50),
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    duration_ms INTEGER,
    bytes_transferred BIGINT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user_id (user_id),
    INDEX idx_audit_timestamp (timestamp),
    INDEX idx_audit_action (action),
    INDEX idx_audit_file_key (file_key)
);

-- Tabela para consentimento LGPD
CREATE TABLE IF NOT EXISTS lgpd_consents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    consent_type VARCHAR(100) NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT FALSE,
    granted_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    consent_text TEXT,
    version VARCHAR(20),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, consent_type),
    INDEX idx_consent_user_id (user_id),
    INDEX idx_consent_type (consent_type)
);

-- Tabela para solicitações LGPD
CREATE TABLE IF NOT EXISTS lgpd_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('access', 'portability', 'deletion', 'rectification', 'opposition')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    processed_by INTEGER REFERENCES users(id),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    INDEX idx_lgpd_requests_user_id (user_id),
    INDEX idx_lgpd_requests_status (status)
);

-- Tabela para políticas de retenção de dados
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id SERIAL PRIMARY KEY,
    data_type VARCHAR(50) NOT NULL UNIQUE,
    retention_days INTEGER NOT NULL,
    deletion_policy VARCHAR(50) CHECK (deletion_policy IN ('hard_delete', 'soft_delete', 'anonymize')),
    legal_basis TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir políticas padrão de retenção
INSERT INTO data_retention_policies (data_type, retention_days, deletion_policy, legal_basis) VALUES
('profile_image', 730, 'hard_delete', 'LGPD Art. 16 - Dados pessoais não sensíveis'),
('medical_record', 3650, 'anonymize', 'CFM Resolução 1.821/2007 - Prontuários médicos 20 anos'),
('consultation_recording', 365, 'hard_delete', 'LGPD + CFM - Gravações de consulta 1 ano'),
('consent_record', 3650, 'soft_delete', 'LGPD Art. 8 - Comprovação de consentimento'),
('audit_log', 1825, 'soft_delete', 'LGPD + Compliance - Logs de auditoria 5 anos');

-- View para monitorar conformidade LGPD por usuário
CREATE OR REPLACE VIEW lgpd_user_compliance AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT lc.consent_type) as active_consents,
    COUNT(DISTINCT sf.id) as total_files,
    COUNT(DISTINCT CASE WHEN sf.is_encrypted THEN sf.id END) as encrypted_files,
    COUNT(DISTINCT lr.id) as lgpd_requests,
    MAX(lc.granted_at) as last_consent_date,
    CASE 
        WHEN EXISTS (SELECT 1 FROM lgpd_consents WHERE user_id = u.id AND consent_type = 'data_processing' AND granted = true AND revoked_at IS NULL)
        THEN true 
        ELSE false 
    END as has_valid_consent
FROM users u
LEFT JOIN lgpd_consents lc ON u.id = lc.user_id AND lc.granted = true AND lc.revoked_at IS NULL
LEFT JOIN secure_files sf ON u.id = sf.user_id AND sf.deleted_at IS NULL
LEFT JOIN lgpd_requests lr ON u.id = lr.user_id
GROUP BY u.id, u.email;

-- Função para anonimizar dados do usuário
CREATE OR REPLACE FUNCTION anonymize_user_data(p_user_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    -- Anonimizar arquivos
    UPDATE secure_files 
    SET is_anonymized = true,
        metadata = metadata || '{"anonymized_at": "' || CURRENT_TIMESTAMP || '"}'
    WHERE user_id = p_user_id;
    
    -- Anonimizar dados pessoais
    UPDATE users 
    SET email = 'anonimizado_' || id || '@cnvidas.com',
        fullName = 'Usuário Anonimizado ' || id,
        phone = NULL,
        cpf = NULL,
        address = NULL,
        profileImage = NULL
    WHERE id = p_user_id;
    
    -- Registrar a anonimização
    INSERT INTO lgpd_requests (user_id, request_type, status, completed_at)
    VALUES (p_user_id, 'deletion', 'completed', CURRENT_TIMESTAMP);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_secure_files_updated_at BEFORE UPDATE ON secure_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_secure_files_checksum ON secure_files(checksum);
CREATE INDEX idx_audit_logs_date_user ON storage_audit_logs(timestamp DESC, user_id);
CREATE INDEX idx_lgpd_consents_active ON lgpd_consents(user_id) WHERE granted = true AND revoked_at IS NULL;