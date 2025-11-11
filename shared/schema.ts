import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, json, date, varchar, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, InferSelectModel, InferInsertModel, sql } from "drizzle-orm";

// 1. Enfileirar todas as declarações de enum, depois tabelas, depois relations, depois schemas, depois tipos.
// 2. Garantir que nenhuma tabela seja referenciada antes de ser declarada.
// 3. Exportar tipos apenas no final.

export const userRoleEnum = pgEnum('user_role', ['patient', 'partner', 'admin', 'doctor']);
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['free', 'basic', 'premium', 'ultra', 'basic_family', 'premium_family', 'ultra_family', 'basic_corp', 'premium_corp', 'ultra_corp']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default('patient'),
  cpf: varchar("cpf", { length: 11 }),
  phone: varchar("phone", { length: 20 }),
  address: varchar("address", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipcode: varchar("zipcode", { length: 8 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true).notNull(),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default('inactive'),


  sellerId: varchar("seller_id", { length: 255 }),
  sellerName: varchar("seller_name", { length: 255 }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionPlan: subscriptionPlanEnum("subscription_plan").default('free'),

  emailVerified: boolean("email_verified").default(false).notNull(),
  profileImage: text("profile_image"),
  
  // Colunas adicionais que existem no banco
  birthDate: text("birth_date"),
  emergencyConsultationsLeft: integer("emergency_consultations_left").default(0),
  lastSubscriptionCancellation: timestamp("last_subscription_cancellation"),
  street: text("street"),
  number: text("number"),
  complement: text("complement"),
  neighborhood: text("neighborhood"),
  subscriptionChangedAt: timestamp("subscription_changed_at"),
  
  // Campos adicionais necessários
  gender: varchar("gender", { length: 20 }),
  status: varchar("status", { length: 50 }).default('active'),
  subscriptionPlanId: integer("subscription_plan_id").references(() => subscriptionPlans.id),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  welcomeCompleted: boolean("welcome_completed").default(false),
  pixKeyType: varchar("pix_key_type", { length: 20 }),
  pixKey: varchar("pix_key", { length: 255 }),
  bankName: varchar("bank_name", { length: 100 }),
  accountType: varchar("account_type", { length: 20 }),
  
  // Corporate fields
  corporatePartnerId: integer("corporate_partner_id").references(() => partners.id),
  isCorporateUser: boolean("is_corporate_user").default(false),
  corporatePlanType: varchar("corporate_plan_type", { length: 50 }),
});

export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  businessName: text("business_name").notNull(),
  tradingName: text("trading_name"),
  businessType: text("business_type").notNull(),
  description: text("description"),
  website: text("website"),
  address: text("address"),
  zipcode: text("zipcode"),
  postalCode: text("postal_code"),
  street: text("street"),
  number: text("number"),
  complement: text("complement"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  phone: text("phone"),
  cnpj: text("cnpj"),
  profileImage: text("profile_image"),
  nationwideService: boolean("nationwide_service").default(false).notNull(),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  status: text("status").default('pending').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // B2B fields
  isEnterprise: boolean("is_enterprise").default(false),
  companyName: varchar("company_name", { length: 255 }),
  companyDocument: varchar("company_document", { length: 20 }), // CNPJ
  billingEmail: varchar("billing_email", { length: 255 }),
  billingAddress: json("billing_address").$type<{
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  }>(),
  collaboratorCount: integer("collaborator_count").default(0),
  stripeCustomerId: text("stripe_customer_id"),
  // White-label fields
  logoUrl: text("logo_url"),
  brandColorPrimary: varchar("brand_color_primary", { length: 7 }),
  brandColorSecondary: varchar("brand_color_secondary", { length: 7 }),
  isCorporate: boolean("is_corporate").default(false),
  activeEmployeesCount: integer("active_employees_count").default(0),
});

// Partner B2B Tables
export const partnerSubscriptionPlanEnum = pgEnum('partner_subscription_plan_type', ['basic', 'premium', 'ultra', 'free']);

export const partnerSubscriptionPlans = pgTable("partner_subscription_plans", {
  id: serial("id").primaryKey(),
  planName: varchar("plan_name", { length: 50 }).notNull(),
  planType: partnerSubscriptionPlanEnum("plan_type").notNull(),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  maxCollaborators: integer("max_collaborators"),
  features: json("features").$type<{
    servicesLimit?: number;
    monthlyBookings?: number;
    [key: string]: any;
  }>().default({}),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default('0'),
  prioritySupport: boolean("priority_support").default(false),
  customBranding: boolean("custom_branding").default(false),
  analyticsAccess: boolean("analytics_access").default(false),
  apiAccess: boolean("api_access").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const partnerSubscriptionStatusEnum = pgEnum('partner_subscription_status', ['active', 'cancelled', 'suspended', 'trial']);

export const partnerSubscriptions = pgTable("partner_subscriptions", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").references(() => partners.id, { onDelete: "cascade" }).notNull(),
  planId: integer("plan_id").references(() => partnerSubscriptionPlans.id),
  status: partnerSubscriptionStatusEnum("status").default('active'),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  nextBillingDate: date("next_billing_date"),
  paymentMethodId: varchar("payment_method_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const partnerCollaboratorRoleEnum = pgEnum('partner_collaborator_role', ['admin', 'manager', 'collaborator']);
export const partnerCollaboratorStatusEnum = pgEnum('partner_collaborator_status', ['pending', 'active', 'inactive']);

export const partnerCollaborators = pgTable("partner_collaborators", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").references(() => partners.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: partnerCollaboratorRoleEnum("role").default('collaborator'),
  department: varchar("department", { length: 100 }),
  permissions: json("permissions").$type<{
    canManageServices?: boolean;
    canViewAnalytics?: boolean;
    canManageCollaborators?: boolean;
    canAccessBilling?: boolean;
    [key: string]: any;
  }>().default({}),
  canManageServices: boolean("can_manage_services").default(false),
  canViewAnalytics: boolean("can_view_analytics").default(false),
  canManageCollaborators: boolean("can_manage_collaborators").default(false),
  canAccessBilling: boolean("can_access_billing").default(false),
  invitationToken: varchar("invitation_token", { length: 255 }).unique(),
  invitationSentAt: timestamp("invitation_sent_at"),
  invitationAcceptedAt: timestamp("invitation_accepted_at"),
  status: partnerCollaboratorStatusEnum("status").default('pending'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const partnerBillingPaymentStatusEnum = pgEnum('partner_billing_payment_status', ['pending', 'paid', 'failed', 'refunded']);

export const partnerBillingHistory = pgTable("partner_billing_history", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").references(() => partners.id, { onDelete: "cascade" }).notNull(),
  subscriptionId: integer("subscription_id").references(() => partnerSubscriptions.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('BRL'),
  paymentStatus: partnerBillingPaymentStatusEnum("payment_status").default('pending'),
  paymentMethod: varchar("payment_method", { length: 50 }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  invoiceNumber: varchar("invoice_number", { length: 50 }).unique(),
  invoiceUrl: text("invoice_url"),
  paidAt: timestamp("paid_at"),
  periodStart: date("period_start"),
  periodEnd: date("period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  specialization: text("specialization").notNull(),
  licenseNumber: text("license_number").notNull().unique(),
  biography: text("biography"),
  education: text("education"),
  experienceYears: integer("experience_years"),
  availableForEmergency: boolean("available_for_emergency").default(false),
  consultationFee: integer("consultation_fee"),
  profileImage: text("profile_image"),
  status: text("status").default('pending').notNull(),
  welcomeCompleted: boolean("welcome_completed").default(false).notNull(),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  pixKeyType: text("pix_key_type"),
  pixKey: text("pix_key"),
  bankName: text("bank_name"),
  accountType: text("account_type"),
  // Novos campos do onboarding
  consultationPriceDescription: text("consultation_price_description"),
  fullBio: text("full_bio"),
  areasOfExpertise: text("areas_of_expertise").array(),
  languagesSpoken: text("languages_spoken").array(),
  achievements: text("achievements"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const partnerServices = pgTable("partner_services", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").references(() => partners.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  regularPrice: integer("regular_price").notNull(),
  discountPrice: integer("discount_price").notNull(),
  discountPercentage: integer("discount_percentage"),
  isFeatured: boolean("is_featured").default(false),
  duration: integer("duration"),
  isActive: boolean("is_active").default(true),
  serviceImage: text("service_image"),
  isNational: boolean("is_national").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  serviceId: integer("service_id").references(() => partnerServices.id, { onDelete: "set null" }),
  partnerId: integer("partner_id").references(() => partners.id, { onDelete: "set null" }),
  doctorId: integer("doctor_id").references(() => doctors.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull(),
  status: text("status").default('scheduled').notNull(),
  notes: text("notes"),
  doctorName: text("doctor_name"),
  specialization: text("specialization"),
  telemedProvider: text("telemed_provider"),
  telemedLink: text("telemed_link"),
  telemedRoomName: text("telemed_room_name"),
  isEmergency: boolean("is_emergency").default(false),
  paymentIntentId: text("payment_intent_id"),
  paymentStatus: text("payment_status").default('pending'),
  paymentAmount: integer("payment_amount"),
  paymentFee: integer("payment_fee"),
  paymentCapturedAt: timestamp("payment_captured_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(),
  occurrenceDate: date("occurrence_date").notNull(),
  description: text("description").notNull(),
  daysHospitalized: integer("days_hospitalized").default(0),
  documents: json("documents").$type<string[]>(),
  status: text("status").default('pending').notNull(),
  reviewNotes: text("review_notes"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  amountRequested: integer("amount_requested"),
  amountApproved: integer("amount_approved"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  isRead: boolean("is_read").default(false),
  relatedId: integer("related_id"),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dependents = pgTable("dependents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  fullName: text("name").notNull(),
  cpf: text("cpf").notNull().unique(),
  birthDate: date("birth_date"),
  relationship: text("relationship"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const legalAcceptances = pgTable("legal_acceptances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  documentType: varchar("document_type", { length: 50 }).notNull(), // 'terms', 'privacy', 'contract', 'partner_contract'
  documentVersion: varchar("document_version", { length: 20 }).notNull().default('1.0.0'),
  acceptedAt: timestamp("accepted_at").defaultNow().notNull(),
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 e IPv6
  userAgent: text("user_agent"),
});

export const doctorPayments = pgTable("doctor_payments", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").references(() => doctors.id, { onDelete: "cascade" }).notNull(),
  appointmentId: integer("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(),
  status: text("status").default('pending').notNull(),
  description: text("description").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const qrTokens = pgTable("qr_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  used: boolean("used").default(false),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  details: json("details").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailVerifications = pgTable("email_verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const availabilitySlots = pgTable("availability_slots", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: subscriptionPlanEnum("name").notNull(),
  displayName: text("display_name").notNull(),
  price: integer("price").notNull(),
  emergencyConsultations: text("emergency_consultations").notNull(),
  specialistDiscount: integer("specialist_discount").notNull(),
  insuranceCoverage: boolean("insurance_coverage").notNull(),
  features: text("features").array(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  planId: integer("plan_id").references(() => subscriptionPlans.id).notNull(),
  status: text("status").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  paymentMethod: text("payment_method"),
  price: integer("price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  scheduledPlanId: integer("scheduled_plan_id").references(() => subscriptionPlans.id),
  scheduledPlanApplied: boolean("scheduled_plan_applied").default(false).notNull(),
});

export const qrAuthLogs = pgTable("qr_auth_logs", {
  id: serial("id").primaryKey(),
  qrTokenId: integer("qr_token_id").references(() => qrTokens.id, { onDelete: "set null" }),
  scannerUserId: integer("scanner_user_id").references(() => users.id, { onDelete: "set null" }).notNull(),
  tokenUserId: integer("token_user_id").references(() => users.id, { onDelete: "set null" }).notNull(),
  scannedAt: timestamp("scanned_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  success: boolean("success").default(true),
});

export const partnerAddresses = pgTable("partner_addresses", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").references(() => partners.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(), // Nome do endereço (ex: "Filial Centro", "Sede", etc)
  cep: text("cep").notNull(),
  address: text("address").notNull(),
  number: text("number").notNull(),
  complement: text("complement"),
  neighborhood: text("neighborhood").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  phone: text("phone"),
  email: text("email"),
  openingHours: text("opening_hours"), // Horário de funcionamento
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Partner service addresses table (many-to-many relationship)
export const partnerServiceAddresses = pgTable("partner_service_addresses", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull().references(() => partnerServices.id, { onDelete: "cascade" }),
  addressId: integer("address_id").notNull().references(() => partnerAddresses.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela de prontuários médicos - simplificada para corresponder ao banco real
export const medicalRecords = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  doctorId: integer("doctor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  recordingId: integer("recording_id"),
  content: json("content").notNull(),
  status: text("status").default("draft").notNull(),
  aiGenerated: boolean("ai_generated").default(false).notNull(),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  signatureHash: text("signature_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Tabela de entradas no prontuário (evolução)
export const medicalRecordEntries = pgTable("medical_record_entries", {
  id: serial("id").primaryKey(),
  recordId: integer("record_id").notNull().references(() => medicalRecords.id),
  appointmentId: integer("appointment_id").references(() => appointments.id), // Vincula à consulta se houver
  authorId: integer("author_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Médico que fez a entrada
  entryType: varchar("entry_type", { length: 50 }).notNull(), // 'consultation', 'exam', 'prescription', etc
  // Conteúdo da entrada
  content: text("content").notNull(), // Conteúdo principal
  subjective: text("subjective"), // S - Subjetivo (SOAP)
  objective: text("objective"), // O - Objetivo (SOAP)
  assessment: text("assessment"), // A - Avaliação (SOAP)
  plan: text("plan"), // P - Plano (SOAP)
  // Metadados
  vitalSigns: json("vital_signs"), // Sinais vitais no momento
  attachments: json("attachments"), // URLs de anexos (exames, receitas, etc)
  // Controle
  createdAt: timestamp("created_at").defaultNow().notNull(),
  signedAt: timestamp("signed_at"), // Quando foi assinado digitalmente
  signature: text("signature"), // Assinatura digital (hash)
  ipAddress: varchar("ip_address", { length: 45 }), // IP de onde foi feita a entrada
  // Campos para conformidade legal
  cid10: varchar("cid10", { length: 10 }), // Código CID-10
  procedures: json("procedures"), // Procedimentos realizados
  prescriptions: json("prescriptions"), // Prescrições
});

// Tabela de gravações de consultas
export const consultationRecordings = pgTable("consultation_recordings", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").notNull().references(() => appointments.id, { onDelete: "cascade" }),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  audioUrl: text("audio_url").notNull(),
  duration: integer("duration"), // duração em segundos
  fileSize: integer("file_size"), // tamanho em bytes
  
  // Status do processamento
  transcriptionStatus: varchar("transcription_status", { length: 50 }).default('pending'),
  transcription: text("transcription"),
  transcriptionError: text("transcription_error"),
  
  // Dados gerados pela IA
  soapNote: json("soap_note"),
  prescription: json("prescription"),
  summary: text("summary"),
  aiProcessingStatus: varchar("ai_processing_status", { length: 50 }).default('pending'),
  aiProcessingError: text("ai_processing_error"),
  
  // Daily.co Cloud Recording
  roomName: varchar("room_name", { length: 255 }),
  cloudRecordingId: varchar("cloud_recording_id", { length: 255 }),
  cloudRecordingUrl: text("cloud_recording_url"),
  cloudRecordingStatus: varchar("cloud_recording_status", { length: 50 }).default('pending'),
  
  // Timestamps
  processingStartedAt: timestamp("processing_started_at"),
  processingCompletedAt: timestamp("processing_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela de acesso aos prontuários (auditoria)
export const medicalRecordAccess = pgTable("medical_record_access", {
  id: serial("id").primaryKey(),
  recordId: integer("record_id").notNull().references(() => medicalRecords.id),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessType: varchar("access_type", { length: 50 }).notNull(), // 'view', 'create_entry', 'print', 'export'
  accessReason: text("access_reason"), // Motivo do acesso
  accessedAt: timestamp("accessed_at").defaultNow().notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  notifications: json("notifications").default({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    notificationFrequency: 'immediate',
    appointmentReminders: true,
    marketingEmails: false,
  }),
  privacy: json("privacy").default({
    shareWithDoctors: true,
    shareWithPartners: false,
    shareFullMedicalHistory: false,
    allowAnonymizedDataUse: true,
    profileVisibility: 'contacts',
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const paymentSchedules = pgTable("payment_schedules", {
  id: serial("id").primaryKey(),
  recipientId: integer("recipient_id").notNull(),
  recipientType: text("recipient_type").notNull(), // 'doctor' ou 'seller'
  amount: integer("amount").notNull(),
  status: text("status").default('pending').notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  paymentMethod: text("payment_method").notNull(), // 'pix' ou 'ted'
  paymentDetails: json("payment_details").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  planId: integer("plan_id").references(() => subscriptionPlans.id).notNull(),
  status: text("status").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sellerCommissions = pgTable("seller_commissions", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").references(() => users.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id).notNull(),
  amount: integer("amount").notNull(),
  status: text("status").default('pending').notNull(),
  paymentScheduleId: integer("payment_schedule_id").references(() => paymentSchedules.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Corporate Plans Tables
export const corporateSubscriptionPlans = pgTable("corporate_subscription_plans", {
  id: serial("id").primaryKey(),
  planType: varchar("plan_type", { length: 50 }).notNull(),
  minEmployees: integer("min_employees").notNull(),
  maxEmployees: integer("max_employees"),
  monthlyPricePerEmployee: decimal("monthly_price_per_employee", { precision: 10, scale: 2 }).notNull(),
  features: json("features").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const corporateSubscriptions = pgTable("corporate_subscriptions", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").references(() => partners.id, { onDelete: "cascade" }).notNull(),
  planType: varchar("plan_type", { length: 50 }).notNull(),
  employeeTier: varchar("employee_tier", { length: 20 }).notNull(),
  monthlyPricePerEmployee: decimal("monthly_price_per_employee", { precision: 10, scale: 2 }).notNull(),
  billingPeriod: varchar("billing_period", { length: 20 }).default('monthly'),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default('0'),
  status: varchar("status", { length: 50 }).default('active'),
  currentBillingDate: date("current_billing_date"),
  nextBillingDate: date("next_billing_date"),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const corporateInvitations = pgTable("corporate_invitations", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").references(() => partners.id, { onDelete: "cascade" }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }),
  invitationToken: varchar("invitation_token", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 50 }).default('pending'),
  invitedAt: timestamp("invited_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  expiresAt: timestamp("expires_at").default(sql`NOW() + INTERVAL '7 days'`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const corporateEmployees = pgTable("corporate_employees", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").references(() => partners.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  employeeEmail: varchar("employee_email", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).default('active'),
  addedAt: timestamp("added_at").defaultNow(),
  removedAt: timestamp("removed_at"),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const corporateUsageReports = pgTable("corporate_usage_reports", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").references(() => partners.id, { onDelete: "cascade" }).notNull(),
  reportMonth: date("report_month").notNull(),
  totalEmployees: integer("total_employees").default(0),
  totalConsultations: integer("total_consultations").default(0),
  totalEmergencyConsultations: integer("total_emergency_consultations").default(0),
  totalClaims: integer("total_claims").default(0),
  totalSickDays: integer("total_sick_days").default(0),
  reportData: json("report_data").default({}),
  generatedAt: timestamp("generated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const medicalCertificates = pgTable("medical_certificates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  doctorId: integer("doctor_id").references(() => doctors.id).notNull(),
  corporatePartnerId: integer("corporate_partner_id").references(() => partners.id),
  certificateNumber: varchar("certificate_number", { length: 100 }).unique(),
  sickDays: integer("sick_days").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  cidCode: varchar("cid_code", { length: 10 }),
  diagnosisDescription: text("diagnosis_description"),
  issuedAt: timestamp("issued_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  partners: many(partners),
  doctors: many(doctors),
  appointments: many(appointments),
  claims: many(claims),
  partnerServices: many(partnerServices),
  dependents: many(dependents),
}));

export const dependentsRelations = relations(dependents, ({ one }) => ({
  user: one(users, {
    fields: [dependents.userId],
    references: [users.id],
  }),
}));

export const partnersRelations = relations(partners, ({ one, many }) => ({
  user: one(users, { fields: [partners.userId], references: [users.id] }),
  services: many(partnerServices),
  subscriptions: many(partnerSubscriptions),
  collaborators: many(partnerCollaborators),
  billingHistory: many(partnerBillingHistory),
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  user: one(users, { fields: [doctors.userId], references: [users.id] }),
  appointments: many(appointments),
  payments: many(doctorPayments),
}));

// Partner B2B Relations
export const partnerSubscriptionPlansRelations = relations(partnerSubscriptionPlans, ({ many }) => ({
  subscriptions: many(partnerSubscriptions),
}));

export const partnerSubscriptionsRelations = relations(partnerSubscriptions, ({ one }) => ({
  partner: one(partners, { fields: [partnerSubscriptions.partnerId], references: [partners.id] }),
  plan: one(partnerSubscriptionPlans, { fields: [partnerSubscriptions.planId], references: [partnerSubscriptionPlans.id] }),
}));

export const partnerCollaboratorsRelations = relations(partnerCollaborators, ({ one }) => ({
  partner: one(partners, { fields: [partnerCollaborators.partnerId], references: [partners.id] }),
  user: one(users, { fields: [partnerCollaborators.userId], references: [users.id] }),
}));

export const partnerBillingHistoryRelations = relations(partnerBillingHistory, ({ one }) => ({
  partner: one(partners, { fields: [partnerBillingHistory.partnerId], references: [partners.id] }),
  subscription: one(partnerSubscriptions, { fields: [partnerBillingHistory.subscriptionId], references: [partnerSubscriptions.id] }),
}));

export const doctorPaymentsRelations = relations(doctorPayments, ({ one }) => ({
  doctor: one(doctors, { 
    fields: [doctorPayments.doctorId], 
    references: [doctors.id] 
  }),
  appointment: one(appointments, { 
    fields: [doctorPayments.appointmentId], 
    references: [appointments.id] 
  }),
}));

export const partnerServicesRelations = relations(partnerServices, ({ one, many }) => ({
  partner: one(partners, { fields: [partnerServices.partnerId], references: [partners.id] }),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  user: one(users, { fields: [appointments.userId], references: [users.id] }),
  service: one(partnerServices, { fields: [appointments.serviceId], references: [partnerServices.id] }),
  partner: one(partners, { fields: [appointments.partnerId], references: [partners.id] }),
  doctor: one(doctors, { fields: [appointments.doctorId], references: [doctors.id] }),
}));

export const claimsRelations = relations(claims, ({ one }) => ({
  user: one(users, { fields: [claims.userId], references: [users.id] }),
  reviewer: one(users, { fields: [claims.reviewedBy], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const availabilitySlotsRelations = relations(availabilitySlots, ({ one }) => ({
  doctor: one(doctors, {
    fields: [availabilitySlots.doctorId],
    references: [doctors.id],
  }),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  users: many(users),
}));

export const qrAuthLogsRelations = relations(qrAuthLogs, ({ one }) => ({
  qrToken: one(qrTokens, {
    fields: [qrAuthLogs.qrTokenId],
    references: [qrTokens.id],
  }),
  scannerUser: one(users, {
    fields: [qrAuthLogs.scannerUserId],
    references: [users.id],
  }),
  tokenUser: one(users, {
    fields: [qrAuthLogs.tokenUserId],
    references: [users.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, { fields: [userSubscriptions.userId], references: [users.id] }),
  plan: one(subscriptionPlans, { fields: [userSubscriptions.planId], references: [subscriptionPlans.id] }),
}));

// Relações para prontuários médicos
export const medicalRecordsRelations = relations(medicalRecords, ({ one, many }) => ({
  patient: one(users, { fields: [medicalRecords.patientId], references: [users.id] }),
  doctor: one(users, { fields: [medicalRecords.doctorId], references: [users.id] }),
  appointment: one(appointments, { fields: [medicalRecords.appointmentId], references: [appointments.id] }),
  entries: many(medicalRecordEntries),
  accessLogs: many(medicalRecordAccess),
}));

export const medicalRecordEntriesRelations = relations(medicalRecordEntries, ({ one }) => ({
  record: one(medicalRecords, { fields: [medicalRecordEntries.recordId], references: [medicalRecords.id] }),
  appointment: one(appointments, { fields: [medicalRecordEntries.appointmentId], references: [appointments.id] }),
  author: one(users, { fields: [medicalRecordEntries.authorId], references: [users.id] }),
}));

export const medicalRecordAccessRelations = relations(medicalRecordAccess, ({ one }) => ({
  record: one(medicalRecords, { fields: [medicalRecordAccess.recordId], references: [medicalRecords.id] }),
  user: one(users, { fields: [medicalRecordAccess.userId], references: [users.id] }),
}));

export const userSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  fullName: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(['patient', 'partner', 'admin', 'doctor']),
  subscriptionPlan: z.enum(['free', 'basic', 'premium', 'ultra', 'basic_family', 'premium_family', 'ultra_family']),
  subscriptionStatus: z.string()
});

export const appointmentSchema = z.object({
  userId: z.number(),
  serviceId: z.number(),
  partnerId: z.number(),
  doctorId: z.number(),
  type: z.string(),
  date: z.date(),
  duration: z.number(),
  status: z.string(),
  notes: z.string().optional(),
  doctorName: z.string().optional(),
  specialization: z.string().optional(),
  telemedProvider: z.string().optional(),
  telemedLink: z.string().optional(),
  telemedRoomName: z.string().optional(),
  isEmergency: z.boolean(),
  paymentStatus: z.string(),
  paymentAmount: z.number()
});

export const claimSchema = z.object({
  userId: z.number(),
  type: z.string(),
  occurrenceDate: z.string(),
  description: z.string(),
  daysHospitalized: z.number().optional(),
  documents: z.array(z.string()).optional(),
  status: z.string(),
  reviewNotes: z.string().optional(),
  amountRequested: z.number().optional(),
  amountApproved: z.number().optional()
});

export const notificationSchema = z.object({
  userId: z.number(),
  title: z.string(),
  message: z.string(),
  type: z.string(),
  isRead: z.boolean(),
  relatedId: z.number().optional(),
  link: z.string().optional()
});

// Tipos inferidos
export type User = InferSelectModel<typeof users>;
export type Dependent = InferSelectModel<typeof dependents>;
export type LegalAcceptance = InferSelectModel<typeof legalAcceptances>;
export type Partner = InferSelectModel<typeof partners>;
export type Doctor = InferSelectModel<typeof doctors>;
export type PartnerService = InferSelectModel<typeof partnerServices>;
export type Appointment = InferSelectModel<typeof appointments>;
export type Claim = InferSelectModel<typeof claims>;
export type Notification = InferSelectModel<typeof notifications>;
export type DoctorPayment = InferSelectModel<typeof doctorPayments>;
export type AuditLog = InferSelectModel<typeof auditLogs>;
export type QrToken = InferSelectModel<typeof qrTokens>;
export type SubscriptionPlan = InferSelectModel<typeof subscriptionPlans>;
export type UserSettings = InferSelectModel<typeof userSettings>;
export type EmailVerification = InferSelectModel<typeof emailVerifications>;
export type PasswordReset = InferSelectModel<typeof passwordResets>;
export type AvailabilitySlot = InferSelectModel<typeof availabilitySlots>;
export type QrAuthLog = InferSelectModel<typeof qrAuthLogs>;
export type PartnerAddress = InferSelectModel<typeof partnerAddresses>;
export type UserSubscription = InferSelectModel<typeof userSubscriptions>;
export type Subscription = InferSelectModel<typeof subscriptions>;
export type PaymentSchedule = InferSelectModel<typeof paymentSchedules>;
export type SellerCommission = InferSelectModel<typeof sellerCommissions>;
// Partner B2B Types
export type PartnerSubscriptionPlan = InferSelectModel<typeof partnerSubscriptionPlans>;
export type PartnerSubscription = InferSelectModel<typeof partnerSubscriptions>;
export type PartnerCollaborator = InferSelectModel<typeof partnerCollaborators>;
export type PartnerBillingHistory = InferSelectModel<typeof partnerBillingHistory>;
export type UserSchema = z.infer<typeof userSchema>;
export type AppointmentSchema = z.infer<typeof appointmentSchema>;
export type ClaimSchema = z.infer<typeof claimSchema>;
export type NotificationSchema = z.infer<typeof notificationSchema>;

// Tipos para inserção
export type InsertUser = InferInsertModel<typeof users>;
export type InsertDependent = InferInsertModel<typeof dependents>;
export type InsertLegalAcceptance = InferInsertModel<typeof legalAcceptances>;
export type InsertPartner = InferInsertModel<typeof partners>;
export type InsertDoctor = InferInsertModel<typeof doctors>;
export type InsertPartnerService = InferInsertModel<typeof partnerServices>;
export type InsertAppointment = InferInsertModel<typeof appointments>;
export type InsertClaim = InferInsertModel<typeof claims>;
export type InsertNotification = InferInsertModel<typeof notifications>;
export type InsertDoctorPayment = InferInsertModel<typeof doctorPayments>;
export type InsertAuditLog = InferInsertModel<typeof auditLogs>;
export type InsertQrToken = InferInsertModel<typeof qrTokens>;
export type InsertSubscriptionPlan = InferInsertModel<typeof subscriptionPlans>;
export type InsertUserSettings = InferInsertModel<typeof userSettings>;
export type InsertEmailVerification = InferInsertModel<typeof emailVerifications>;
export type InsertPasswordReset = InferInsertModel<typeof passwordResets>;
export type InsertAvailabilitySlot = InferInsertModel<typeof availabilitySlots>;
export type InsertQrAuthLog = InferInsertModel<typeof qrAuthLogs>;
export type InsertPartnerAddress = InferInsertModel<typeof partnerAddresses>;
export type InsertUserSubscription = InferInsertModel<typeof userSubscriptions>;
export type InsertSubscription = InferInsertModel<typeof subscriptions>;
export type InsertPaymentSchedule = InferInsertModel<typeof paymentSchedules>;
export type InsertSellerCommission = InferInsertModel<typeof sellerCommissions>;
// Partner B2B Insert Types
export type InsertPartnerSubscriptionPlan = InferInsertModel<typeof partnerSubscriptionPlans>;
export type InsertPartnerSubscription = InferInsertModel<typeof partnerSubscriptions>;
export type InsertPartnerCollaborator = InferInsertModel<typeof partnerCollaborators>;
export type InsertPartnerBillingHistory = InferInsertModel<typeof partnerBillingHistory>;

// Tipos para prontuários médicos
export type MedicalRecord = InferSelectModel<typeof medicalRecords>;
export type InsertMedicalRecord = InferInsertModel<typeof medicalRecords>;
export type MedicalRecordEntry = InferSelectModel<typeof medicalRecordEntries>;
export type InsertMedicalRecordEntry = InferInsertModel<typeof medicalRecordEntries>;
export type MedicalRecordAccess = InferSelectModel<typeof medicalRecordAccess>;
export type InsertMedicalRecordAccess = InferInsertModel<typeof medicalRecordAccess>;

// Corporate Types
export type CorporateSubscriptionPlan = InferSelectModel<typeof corporateSubscriptionPlans>;
export type InsertCorporateSubscriptionPlan = InferInsertModel<typeof corporateSubscriptionPlans>;
export type CorporateSubscription = InferSelectModel<typeof corporateSubscriptions>;
export type InsertCorporateSubscription = InferInsertModel<typeof corporateSubscriptions>;
export type CorporateInvitation = InferSelectModel<typeof corporateInvitations>;
export type InsertCorporateInvitation = InferInsertModel<typeof corporateInvitations>;
export type CorporateEmployee = InferSelectModel<typeof corporateEmployees>;
export type InsertCorporateEmployee = InferInsertModel<typeof corporateEmployees>;
export type CorporateUsageReport = InferSelectModel<typeof corporateUsageReports>;
export type InsertCorporateUsageReport = InferInsertModel<typeof corporateUsageReports>;
export type MedicalCertificate = InferSelectModel<typeof medicalCertificates>;
export type InsertMedicalCertificate = InferInsertModel<typeof medicalCertificates>;

// Campaign Leads table
export const campaignLeads = pgTable("campaign_leads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 20 }).notNull(),
  campaign: varchar("campaign", { length: 100 }).notNull().default("taquari-hospital-sao-jose"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCampaignLeadSchema = createInsertSchema(campaignLeads);
export const selectCampaignLeadSchema = createSelectSchema(campaignLeads);

export type CampaignLead = InferSelectModel<typeof campaignLeads>;
export type InsertCampaignLead = InferInsertModel<typeof campaignLeads>;
