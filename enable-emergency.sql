-- Habilitar emergência para o médico Lucas Dickel Canova
UPDATE doctors 
SET "availableForEmergency" = true 
WHERE "userId" = 111;

-- Verificar o resultado
SELECT 
  d.id, 
  d."userId", 
  u."fullName", 
  d."availableForEmergency",
  d.specialization
FROM doctors d
JOIN users u ON d."userId" = u.id
WHERE d."userId" = 111;