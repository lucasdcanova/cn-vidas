// Tipos compartilhados entre cliente e servidor

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