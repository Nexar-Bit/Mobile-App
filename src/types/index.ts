// User types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'secretary' | 'doctor' | 'patient';
  is_active: boolean;
  is_verified: boolean;
  clinic_id: number;
}

// Patient types
export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  cpf: string;
  phone: string;
  email: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  allergies?: string;
  active_problems?: string;
  blood_type?: string;
  notes?: string;
  is_active: boolean;
  clinic_id: number;
  created_at: string;
  updated_at?: string;
}

// Appointment types
export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  scheduled_datetime: string;
  datetime?: string; // Alternative field name
  duration_minutes: number;
  status: 'scheduled' | 'checked_in' | 'in_consultation' | 'completed' | 'cancelled';
  appointment_type?: 'consultation' | 'follow_up' | 'emergency' | 'procedure' | 'other';
  reason?: string;
  notes?: string;
  diagnosis?: string;
  treatment_plan?: string;
  checked_in_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  clinic_id: number;
  created_at: string;
  updated_at?: string;
  patient?: Patient;
  doctor_name?: string; // Doctor's name for display
  patient_name?: string; // Patient's name for display
}

// Clinical Record types
export interface ClinicalRecord {
  id: number;
  appointment_id: number;
  subjective?: string; // SOAP format
  objective?: string; // SOAP format
  assessment?: string; // SOAP format
  plan?: string; // SOAP format
  chief_complaint?: string; // Legacy field
  history_of_present_illness?: string; // Legacy field
  physical_examination?: string; // Legacy field
  notes?: string;
  created_at: string;
  updated_at?: string;
  appointment?: Appointment;
}

// API Response types
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface ApiError {
  detail: string;
  message?: string;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MFASetup: undefined;
  Main: undefined;
  Profile: undefined;
  OnboardingMedical: undefined;
  OnboardingInsurance: undefined;
  HealthHub: undefined;
  SymptomChecker: undefined;
  Medications: undefined;
  Metrics: undefined;
  Billing: undefined;
  Health: undefined;
  Support: undefined;
  TestResults: undefined;
  Notes: undefined;
  Settings: undefined;
  Doctors: undefined;
  Telemetry: undefined;
  Appointments: { doctorId?: number };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Appointments: undefined;
  Patients: undefined;
  More: undefined;
};
