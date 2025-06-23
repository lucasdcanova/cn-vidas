/**
 * Arquivo de mapeamento de nomenclaturas para padronização gradual
 * Este arquivo centraliza as transformações entre diferentes nomenclaturas
 * usadas no sistema, facilitando a migração gradual.
 */

// Mapeamento de campos snake_case do banco para camelCase do TypeScript
export const dbToTsFieldMapping = {
  // Campos de usuário
  full_name: 'fullName',
  profile_image: 'profileImage',
  email_verified: 'emailVerified',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  phone_number: 'phoneNumber',
  birth_date: 'birthDate',
  subscription_plan: 'subscriptionPlan',
  subscription_status: 'subscriptionStatus',
  emergency_consultations_left: 'emergencyConsultationsLeft',
  
  // Campos de médico
  license_number: 'licenseNumber',
  rqe_number: 'rqeNumber',
  experience_years: 'experienceYears',
  consultation_fee: 'consultationFee',
  full_bio: 'fullBio',
  areas_of_expertise: 'areasOfExpertise',
  languages_spoken: 'languagesSpoken',
  available_for_emergency: 'availableForEmergency',
  onboarding_completed: 'onboardingCompleted',
  welcome_completed: 'welcomeCompleted',
  
  // Campos de pagamento
  payment_intent_id: 'paymentIntentId',
  payment_status: 'paymentStatus',
  payment_amount: 'paymentAmount',
  stripe_customer_id: 'stripeCustomerId',
  stripe_subscription_id: 'stripeSubscriptionId',
  pix_key_type: 'pixKeyType',
  pix_key: 'pixKey',
  bank_name: 'bankName',
  account_type: 'accountType',
  
  // Campos de consulta
  start_time: 'startTime',
  end_time: 'endTime',
  telemed_room_url: 'telemedRoomUrl',
  is_emergency: 'isEmergency',
  patient_name: 'patientName',
  doctor_name: 'doctorName',
  
  // Campos booleanos
  is_active: 'isActive',
  is_read: 'isRead',
  is_featured: 'isFeatured',
  
  // Relacionamentos
  user_id: 'userId',
  doctor_id: 'doctorId',
  patient_id: 'patientId',
  partner_id: 'partnerId',
  appointment_id: 'appointmentId',
  
  // Seller -> Referrer (futura migração)
  seller_id: 'sellerId', // Futuro: 'referrerId'
  seller_name: 'sellerName' // Futuro: 'referrerName'
} as const;

// Mapeamento reverso (TypeScript para banco)
export const tsToDbFieldMapping = Object.entries(dbToTsFieldMapping).reduce(
  (acc, [dbField, tsField]) => ({
    ...acc,
    [tsField]: dbField
  }),
  {} as Record<string, string>
);

// Função helper para converter objeto do banco para TypeScript
export function dbToTs<T extends Record<string, any>>(dbObject: T): any {
  const result: any = {};
  
  for (const [key, value] of Object.entries(dbObject)) {
    const tsKey = dbToTsFieldMapping[key as keyof typeof dbToTsFieldMapping] || key;
    result[tsKey] = value;
  }
  
  return result;
}

// Função helper para converter objeto TypeScript para banco
export function tsToDb<T extends Record<string, any>>(tsObject: T): any {
  const result: any = {};
  
  for (const [key, value] of Object.entries(tsObject)) {
    const dbKey = tsToDbFieldMapping[key] || key;
    result[dbKey] = value;
  }
  
  return result;
}

// Padronização de nomes de campos problemáticos
export const fieldNameStandardization = {
  // Variações de nome completo
  name: 'fullName',
  full_name: 'fullName',
  userName: 'fullName',
  
  // Variações de biografia
  bio: 'biography',
  fullBio: 'biography', // Campo extra, manter separado por enquanto
  
  // Variações de imagem de perfil
  profileImageUrl: 'profileImage',
  profile_image_url: 'profileImage',
  avatar: 'profileImage',
  
  // Variações de licença médica
  crm: 'licenseNumber',
  crmNumber: 'licenseNumber',
  doctorCrm: 'licenseNumber',
  
  // Variações de telefone
  phone: 'phoneNumber',
  tel: 'phoneNumber',
  telephone: 'phoneNumber',
  
  // Variações de CEP
  cep: 'zipcode',
  postalCode: 'zipcode',
  zip: 'zipcode'
} as const;

// Status permitidos para appointments
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show',
  WAITING: 'waiting' // Para emergências
} as const;

// Roles de usuário
export const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  PARTNER: 'partner',
  ADMIN: 'admin'
} as const;

// Tipos de plano
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  STANDARD: 'standard',
  PREMIUM: 'premium',
  FAMILY_BASIC: 'family_basic',
  FAMILY_PLUS: 'family_plus',
  ULTRA_FAMILY: 'ultra_family',
  MEDICAL: 'medical'
} as const;

// Middleware para padronizar nomenclatura em requisições
export function standardizeRequestBody(body: any): any {
  const standardized = { ...body };
  
  // Aplicar padronização de campos
  for (const [oldName, newName] of Object.entries(fieldNameStandardization)) {
    if (oldName in standardized) {
      standardized[newName] = standardized[oldName];
      if (oldName !== newName) {
        delete standardized[oldName];
      }
    }
  }
  
  return standardized;
}

// Validador de nomenclatura para desenvolvimento
export function validateNomenclature(obj: any, context: string): string[] {
  const warnings: string[] = [];
  
  // Verificar campos que deveriam usar camelCase
  for (const key of Object.keys(obj)) {
    if (key.includes('_') && context === 'typescript') {
      warnings.push(`Campo "${key}" usa snake_case em contexto TypeScript`);
    }
    
    // Verificar campos problemáticos conhecidos
    if (key === 'name' && obj.fullName) {
      warnings.push(`Usando "name" quando "fullName" já existe`);
    }
    
    if (key === 'bio' && obj.biography) {
      warnings.push(`Usando "bio" quando "biography" já existe`);
    }
  }
  
  return warnings;
}