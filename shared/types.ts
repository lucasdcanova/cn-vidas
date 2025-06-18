// Tipos compartilhados entre cliente e servidor

// Tipos básicos
export interface User {
  id: number;
  email: string;
  username: string;
  fullName?: string;
  role: 'patient' | 'doctor' | 'admin' | 'partner';
  [key: string]: any;
}

export interface ExpressUser extends User {
  // Extensão para Express
}

export interface Partner {
  id: number;
  userId: number;
  [key: string]: any;
}

export interface Doctor {
  id: number;
  userId: number;
  [key: string]: any;
}

export interface PartnerService {
  id: number;
  partnerId: number;
  [key: string]: any;
}

export interface Appointment {
  id: number;
  userId: number;
  doctorId?: number;
  [key: string]: any;
}

export interface Claim {
  id: number;
  [key: string]: any;
}

export interface Notification {
  id: number;
  userId: number;
  [key: string]: any;
}

export interface DoctorPayment {
  id: number;
  [key: string]: any;
}

export interface AuditLog {
  id: number;
  [key: string]: any;
}

export interface QrToken {
  id: number;
  [key: string]: any;
}

export interface SubscriptionPlan {
  id: number;
  [key: string]: any;
}

export interface UserSettings {
  id: number;
  userId: number;
  [key: string]: any;
}

export interface EmailVerification {
  id: number;
  [key: string]: any;
}

export interface PasswordReset {
  id: number;
  [key: string]: any;
}

export interface AvailabilitySlot {
  id: number;
  [key: string]: any;
}

export interface QrAuthLog {
  id: number;
  [key: string]: any;
}

export interface Dependent {
  id: number;
  [key: string]: any;
}

// Tipos Insert
export type InsertUser = Omit<User, 'id'>;
export type InsertPartner = Omit<Partner, 'id'>;
export type InsertDoctor = Omit<Doctor, 'id'>;
export type InsertPartnerService = Omit<PartnerService, 'id'>;
export type InsertAppointment = Omit<Appointment, 'id'>;
export type InsertClaim = Omit<Claim, 'id'>;
export type InsertNotification = Omit<Notification, 'id'>;
export type InsertDoctorPayment = Omit<DoctorPayment, 'id'>;
export type InsertAuditLog = Omit<AuditLog, 'id'>;
export type InsertQrToken = Omit<QrToken, 'id'>;
export type InsertSubscriptionPlan = Omit<SubscriptionPlan, 'id'>;
export type InsertUserSettings = Omit<UserSettings, 'id'>;
export type InsertEmailVerification = Omit<EmailVerification, 'id'>;
export type InsertPasswordReset = Omit<PasswordReset, 'id'>;
export type InsertAvailabilitySlot = Omit<AvailabilitySlot, 'id'>;
export type InsertQrAuthLog = Omit<QrAuthLog, 'id'>;
export type InsertDependent = Omit<Dependent, 'id'>;

// Tipos para Medical Records
export interface MedicalRecord {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_id?: number;
  recording_id?: number;
  content: {
    type: string;
    data: string;
    transcription?: string;
  };
  status: 'draft' | 'signed' | 'amended';
  ai_generated: boolean;
  signed_at?: Date | null;
  signature_hash?: string | null;
  created_at: Date;
  updated_at: Date;
}

export type InsertMedicalRecord = Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>;

export interface MedicalRecordEntry {
  id: number;
  record_id: number;
  entry_type: string;
  content: any;
  created_at: Date;
  created_by: number;
}

export type InsertMedicalRecordEntry = Omit<MedicalRecordEntry, 'id' | 'created_at'>;

export interface MedicalRecordAccess {
  id: number;
  record_id: number;
  accessed_by: number;
  accessed_at: Date;
  action: string;
  ip_address?: string;
}

export type InsertMedicalRecordAccess = Omit<MedicalRecordAccess, 'id' | 'accessed_at'>;