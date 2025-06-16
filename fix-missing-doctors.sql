-- Script para criar registros na tabela doctors para usuários com role='doctor' que não possuem registro correspondente

-- Primeiro, vamos verificar quais usuários médicos não têm registro na tabela doctors
SELECT u.id, u.email, u.full_name, u.created_at
FROM users u
LEFT JOIN doctors d ON u.id = d.user_id
WHERE u.role = 'doctor' AND d.id IS NULL;

-- Inserir registros de médico para todos os usuários com role='doctor' que não têm registro
INSERT INTO doctors (
    user_id, 
    specialization, 
    license_number, 
    biography, 
    education, 
    experience_years, 
    available_for_emergency, 
    consultation_fee, 
    status,
    welcome_completed,
    onboarding_completed,
    created_at,
    updated_at
)
SELECT 
    u.id,
    '', -- specialization vazio para ser preenchido no onboarding
    '', -- license_number vazio para ser preenchido no onboarding
    '', -- biography vazio
    '', -- education vazio
    0,  -- experience_years
    false, -- available_for_emergency
    0, -- consultation_fee
    'active', -- status
    false, -- welcome_completed
    false, -- onboarding_completed
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM users u
LEFT JOIN doctors d ON u.id = d.user_id
WHERE u.role = 'doctor' AND d.id IS NULL;

-- Verificar o resultado
SELECT 
    u.id as user_id, 
    u.email, 
    u.full_name,
    d.id as doctor_id,
    d.onboarding_completed,
    d.welcome_completed
FROM users u
LEFT JOIN doctors d ON u.id = d.user_id
WHERE u.role = 'doctor'
ORDER BY u.id;