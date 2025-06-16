export interface Doctor {
  id: number;
  userId: number;
  specialization: string;
  licenseNumber: string;
  biography?: string | null;
  education?: string | null;
  experienceYears?: number | null;
  availableForEmergency: boolean;
  consultationFee?: number | null;
  profileImage?: string | null;
  status: string;
  welcomeCompleted: boolean;
  onboardingCompleted: boolean;
  pixKeyType?: string | null;
  pixKey?: string | null;
  bankName?: string | null;
  accountType?: string | null;
  // New onboarding fields
  consultationPriceDescription?: string | null;
  fullBio?: string | null;
  areasOfExpertise?: string[] | null;
  languagesSpoken?: string[] | null;
  achievements?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Additional fields that might be joined from users table
  name?: string;
  username?: string;
  email?: string;
}

export type InsertDoctor = Omit<Doctor, 'id' | 'createdAt' | 'updatedAt' | 'name' | 'username' | 'email'>;

export interface DoctorAvailability {
  id: number;
  doctorId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type InsertDoctorAvailability = Omit<DoctorAvailability, 'id' | 'createdAt' | 'updatedAt'>;

export interface DoctorPayment {
  id: number;
  doctorId: number;
  appointmentId?: number | null;
  amount: number;
  status: string;
  description: string;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type InsertDoctorPayment = Omit<DoctorPayment, 'id' | 'createdAt' | 'updatedAt'>;

export interface DoctorReview {
  id: number;
  doctorId: number;
  userId: number;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type InsertDoctorReview = Omit<DoctorReview, 'id' | 'createdAt' | 'updatedAt'>; 