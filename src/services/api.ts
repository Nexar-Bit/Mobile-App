import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginResponse, User, Appointment, Patient, ClinicalRecord, ApiError } from '../types';

// API Base URL configuration
// Always uses local backend server (localhost:8000)
// Web: uses localhost:8000 directly
// Android Emulator: uses 10.0.2.2 to access host's localhost
// Physical device: use your computer's LAN IP (e.g., http://192.168.x.x:8000/api/v1)
const getApiBaseUrl = (): string => {
  // ALWAYS use local backend (localhost:8000)
  // For web platform, use localhost directly
  if (Platform.OS === 'web') {
    return 'http://localhost:8000/api/v1';
  }
  
  // For Android/iOS emulators and devices:
  // - Android Studio Emulator: 10.0.2.2 maps to host's localhost
  // - LDPlayer/BlueStacks: Use your computer's LAN IP (192.168.x.x)
  // - Physical devices: Use your computer's LAN IP (192.168.x.x)
  // 
  // Current detected LAN IP: 192.168.123.74 (update if different)
  // Using LAN IP for LDPlayer compatibility
  return 'http://192.168.123.74:8000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  private api: AxiosInstance;

  constructor() {
    // Always log API URL for debugging
    console.log('API Base URL:', API_BASE_URL);
    console.log('Platform:', Platform.OS);
    
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 45000, // Increased timeout for mobile networks and slow connections
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Android-specific: ensure proper error handling
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh and network errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Enhanced network error logging
        if (!error.response) {
          // Network error (no response received)
          const errorInfo = {
            message: error.message || 'Unknown network error',
            code: error.code || 'NO_CODE',
            baseURL: API_BASE_URL,
            url: error.config?.url,
            timeout: error.code === 'ECONNABORTED',
            cancelled: error.code === 'ERR_CANCELED',
          };
          console.error('Network Error Details:', errorInfo);
          
          // Create a more descriptive error
          // Check if we're using local backend URL
          const isLocalBackend = API_BASE_URL.includes('10.0.2.2') || API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
          const backendType = isLocalBackend ? 'servidor local' : 'servidor';
          
          const networkError = new Error(
            error.code === 'ECONNABORTED'
              ? `Tempo de conexão esgotado. O ${backendType} pode estar lento ou indisponível.`
              : error.code === 'ERR_CANCELED'
              ? 'Conexão cancelada.'
              : isLocalBackend
              ? 'Não foi possível conectar ao servidor local. Verifique se o backend está rodando na porta 8000.'
              : 'Erro de conexão. Verifique sua internet e tente novamente.'
          ) as any;
          networkError.code = error.code;
          networkError.isNetworkError = true;
          networkError.originalError = error;
          return Promise.reject(networkError);
        }
        
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest?._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              await this.setTokens(response.access_token, response.refresh_token);
              originalRequest.headers.Authorization = `Bearer ${response.access_token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await this.clearTokens();
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  async login(email: string, password: string, expectedRole?: string): Promise<LoginResponse> {
    try {
      // Log attempt for debugging
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('Attempting login to:', `${API_BASE_URL}/auth/login`);
      }
      
      const response = await this.api.post<LoginResponse>('/auth/login', {
        username_or_email: email,
        password,
        expected_role: expectedRole || 'patient',
      });
      
      // Normalize role to lowercase if needed
      if (response.data.user && response.data.user.role) {
        const role = response.data.user.role;
        if (typeof role === 'string') {
          response.data.user.role = role.toLowerCase() as 'admin' | 'secretary' | 'doctor' | 'patient';
        } else if (role && typeof role === 'object' && 'value' in role) {
          // Handle enum object
          const roleObj = role as { value: string };
          response.data.user.role = roleObj.value.toLowerCase() as 'admin' | 'secretary' | 'doctor' | 'patient';
        }
      }
      
      await this.setTokens(response.data.access_token, response.data.refresh_token);
      console.log('Login successful, tokens stored');
      return response.data;
    } catch (error: any) {
      // Enhanced error logging
      const errorDetails = {
        message: error?.message,
        code: error?.code,
        isNetworkError: error?.isNetworkError,
        response: error?.response?.data,
        status: error?.response?.status,
        baseURL: API_BASE_URL,
      };
      console.error('Login API error:', errorDetails);
      
      // Re-throw with enhanced error message if it's a network error
      if (error?.isNetworkError || !error?.response) {
        const networkError = error?.originalError || error;
        throw networkError;
      }
      
      throw error;
    }
  }

  async register(payload: { first_name: string; last_name: string; email: string; password: string; phone?: string }): Promise<LoginResponse> {
    const response = await this.api.post<LoginResponse>('/auth/register', {
      ...payload,
      username: payload.email,
      role: 'patient',
      clinic_id: 1, // Default clinic, should be configurable
    });
    await this.setTokens(response.data.access_token, response.data.refresh_token);
    return response.data;
  }

  async initiateMFA(): Promise<{ qr_uri?: string; secret?: string; methods: string[] }> {
    const response = await this.api.post('/auth/mfa/initiate', {});
    return response.data;
  }

  async verifyMFA(code: string): Promise<{ recovery_codes?: string[] } | { success: true }> {
    const response = await this.api.post('/auth/mfa/verify', { code });
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      await this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.api.get<User>('/auth/me');
      return response.data;
    } catch (error: any) {
      // If token is invalid, clear tokens
      if (error?.response?.status === 401) {
        await this.clearTokens();
      }
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const response = await this.api.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  }

  // Patient Dashboard
  async getPatientDashboard(): Promise<any> {
    try {
      const response = await this.api.get('/patient/dashboard');
      return response.data;
    } catch (e) {
      console.error('Failed to load dashboard:', e);
      return null;
    }
  }


  // Patient-facing data
  async getMyUpcomingAppointments(): Promise<Appointment[]> {
    const cacheKey = 'cache_upcoming_appointments';
    try {
      const response = await this.api.get<Appointment[]>('/appointments/patient-appointments');
      const now = new Date();
      const upcoming = response.data.filter((apt: Appointment) => {
        const aptDate = new Date(apt.scheduled_datetime);
        return aptDate >= now && apt.status !== 'cancelled' && apt.status !== 'completed';
      }).sort((a: Appointment, b: Appointment) => 
        new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime()
      );
      try { await AsyncStorage.setItem(cacheKey, JSON.stringify(upcoming)); } catch {}
      return upcoming;
    } catch (e) {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
      throw e;
    }
  }

  async getAllMyAppointments(): Promise<Appointment[]> {
    try {
      const response = await this.api.get<any[]>('/appointments/patient-appointments');
      
      // Normalize appointment data: ensure status is lowercase, ensure required fields exist
      const appointments = response.data.map((apt: any) => ({
        id: apt.id,
        patient_id: apt.patient_id,
        doctor_id: apt.doctor_id,
        scheduled_datetime: apt.scheduled_datetime || apt.datetime || new Date().toISOString(),
        datetime: apt.scheduled_datetime || apt.datetime,
        duration_minutes: apt.duration_minutes || 30,
        status: (apt.status?.toLowerCase() || 'scheduled') as Appointment['status'],
        appointment_type: apt.appointment_type || 'consultation',
        reason: apt.reason,
        notes: apt.notes,
        diagnosis: apt.diagnosis,
        treatment_plan: apt.treatment_plan,
        checked_in_at: apt.checked_in_at,
        started_at: apt.started_at,
        completed_at: apt.completed_at,
        cancelled_at: apt.cancelled_at,
        cancellation_reason: apt.cancellation_reason,
        clinic_id: apt.clinic_id || 0,
        created_at: apt.created_at || new Date().toISOString(),
        updated_at: apt.updated_at,
        doctor_name: apt.doctor_name || 'Médico',
        patient_name: apt.patient_name || 'Paciente',
      })) as Appointment[];
      
      return appointments.sort((a: Appointment, b: Appointment) => 
        new Date(b.scheduled_datetime).getTime() - new Date(a.scheduled_datetime).getTime()
      );
    } catch (e) {
      console.error('Failed to load appointments:', e);
      throw e;
    }
  }

  async getDoctors(): Promise<User[]> {
    const response = await this.api.get<User[]>('/users/doctors');
    return response.data;
  }

  async getDoctorAvailability(doctorId: number, dateISO: string): Promise<{ time: string; available: boolean }[]> {
    const response = await this.api.get(`/appointments/doctor/${doctorId}/availability?date=${dateISO}`);
    return response.data;
  }

  async bookAppointment(payload: { doctor_id: number; scheduled_datetime: string; reason?: string }): Promise<Appointment> {
    try {
      // Get current user to obtain clinic_id
      const user = await this.getCurrentUser();
      
      // Get patient profile to obtain patient_id
      const patient = await this.getMyPatientProfile();
      
      const response = await this.api.post<Appointment>('/appointments/patient/book', {
        patient_id: patient.id,
        doctor_id: payload.doctor_id,
        clinic_id: user.clinic_id,
        scheduled_datetime: payload.scheduled_datetime,
        reason: payload.reason,
        appointment_type: 'consultation',
      });
      
      // Ensure status is lowercase if backend returns uppercase
      if (response.data && response.data.status) {
        response.data.status = response.data.status.toLowerCase() as Appointment['status'];
      }
      
      return response.data;
    } catch (e: any) {
      // Offline fallback: queue booking
      const qKey = 'queue_bookings';
      const queued = JSON.parse((await AsyncStorage.getItem(qKey)) || '[]');
      queued.push({ ...payload, queued_at: Date.now() });
      await AsyncStorage.setItem(qKey, JSON.stringify(queued));
      // Return a synthetic placeholder
      return {
        id: Date.now(),
        patient_id: 0,
        doctor_id: payload.doctor_id,
        scheduled_datetime: payload.scheduled_datetime,
        duration_minutes: 30,
        status: 'scheduled',
        appointment_type: 'consultation',
        clinic_id: 0,
        created_at: new Date().toISOString(),
      } as unknown as Appointment;
    }
  }

  async cancelAppointment(appointmentId: number, reason?: string): Promise<void> {
    await this.api.post(`/appointments/${appointmentId}/cancel`, { reason });
  }

  async rescheduleAppointment(appointmentId: number, newDateTime: string): Promise<Appointment> {
    const response = await this.api.post<Appointment>(`/appointments/${appointmentId}/reschedule`, {
      scheduled_datetime: newDateTime,
    });
    return response.data;
  }

  // Patient Profile
  async getMyPatientProfile(): Promise<Patient> {
    try {
      const response = await this.api.get<Patient>('/patients/me');
      return response.data;
    } catch (e) {
      throw e;
    }
  }

  async updateMyPatientProfile(data: Partial<Patient>): Promise<Patient> {
    const response = await this.api.put<Patient>('/patients/me', data);
    return response.data;
  }

  // Clinical & docs
  async getMyRecordsSummary(): Promise<any> {
    try {
      const response = await this.api.get('/patients/me');
      return response.data;
    } catch (e) {
      return null;
    }
  }

  async getMyMedicalRecords(): Promise<ClinicalRecord[]> {
    try {
      const response = await this.api.get<ClinicalRecord[]>('/clinical/me/history');
      return response.data || [];
    } catch (e) {
      console.error('Failed to load medical records:', e);
      return [];
    }
  }

  async getMyDocuments(): Promise<Array<{ id: number; type: string; title: string; url: string; created_at: string }>> {
    try {
      const response = await this.api.get('/patient/exam-results');
      return (response.data || []).map((file: any) => ({
        id: file.id,
        type: file.exam_type || 'document',
        title: file.exam_type || 'Documento',
        url: file.file_url || '',
        created_at: file.created_at || file.upload_date,
      }));
    } catch (e) {
      console.error('Failed to load documents:', e);
      return [];
    }
  }

  // Prescriptions
  async getMyPrescriptions(): Promise<any[]> {
    try {
      const response = await this.api.get('/patient/prescriptions');
      return response.data || [];
    } catch (e) {
      console.error('Failed to load prescriptions:', e);
      return [];
    }
  }

  // Test Results / Exam Results
  async getMyTestResults(): Promise<any[]> {
    try {
      const response = await this.api.get('/patient/exam-results');
      return response.data || [];
    } catch (e) {
      console.error('Failed to load test results:', e);
      return [];
    }
  }

  // Health Data
  async getMyHealthData(): Promise<any> {
    try {
      const response = await this.api.get('/patient/health');
      return response.data;
    } catch (e) {
      console.error('Failed to load health data:', e);
      return null;
    }
  }

  // Billing
  async getMyInvoices(): Promise<any[]> {
    try {
      const response = await this.api.get('/financial/invoices/me');
      return response.data || [];
    } catch (e) {
      console.error('Failed to load invoices:', e);
      return [];
    }
  }

  async getInvoiceDetails(invoiceId: number): Promise<any> {
    try {
      const response = await this.api.get(`/financial/invoices/${invoiceId}`);
      return response.data;
    } catch (e) {
      throw e;
    }
  }

  // Messages
  async getMyMessages(): Promise<any[]> {
    try {
      const response = await this.api.get('/messages/threads');
      return response.data || [];
    } catch (e) {
      console.error('Failed to load messages:', e);
      return [];
    }
  }

  async getMessageThread(threadId: number): Promise<any> {
    try {
      const response = await this.api.get(`/messages/threads/${threadId}`);
      return response.data;
    } catch (e) {
      throw e;
    }
  }

  async sendMessage(threadId: number, content: string, attachments?: any[]): Promise<void> {
    await this.api.post(`/messages/threads/${threadId}/send`, { 
      content,
      attachments: attachments || [],
    });
  }

  async createMessageThread(providerId: number, subject: string, content: string): Promise<any> {
    const response = await this.api.post('/messages/threads', {
      provider_id: providerId,
      subject,
      initial_message: content,
    });
    return response.data;
  }

  async archiveThread(threadId: number): Promise<void> {
    await this.api.delete(`/messages/threads/${threadId}`);
  }

  // Notifications
  async getNotifications(): Promise<any[]> {
    try {
      const response = await this.api.get('/notifications');
      return response.data?.data || [];
    } catch (e) {
      console.error('Failed to load notifications:', e);
      return [];
    }
  }

  async markNotificationRead(kind: string, sourceId: number): Promise<void> {
    await this.api.post(`/notifications/${kind}/${sourceId}/read`);
  }

  async deleteNotification(kind: string, sourceId: number): Promise<void> {
    await this.api.delete(`/notifications/${kind}/${sourceId}`);
  }

  // Support
  async getSupportTickets(): Promise<any[]> {
    try {
      const response = await this.api.get('/support/tickets');
      return response.data || [];
    } catch (e) {
      console.error('Failed to load support tickets:', e);
      return [];
    }
  }

  async createSupportTicket(data: { subject: string; message: string; priority?: string }): Promise<any> {
    const response = await this.api.post('/support/tickets', data);
    return response.data;
  }

  async getHelpArticles(category?: string): Promise<any[]> {
    try {
      const params = category ? `?category=${category}` : '';
      const response = await this.api.get(`/support/articles${params}`);
      return response.data || [];
    } catch (e) {
      console.error('Failed to load help articles:', e);
      return [];
    }
  }

  async getHelpArticleCategories(): Promise<string[]> {
    try {
      const response = await this.api.get('/support/articles/categories');
      return response.data || [];
    } catch (e) {
      return [];
    }
  }

  // Health metrics
  async getMyHealthMetrics(): Promise<any> {
    try {
      const response = await this.api.get('/patients/me');
      return response.data;
    } catch (e) {
      return null;
    }
  }

  // Onboarding - Medical History
  async saveMedicalHistory(data: { conditions?: string; allergies?: string; medications?: string }): Promise<void> {
    try {
      await this.api.put('/patients/me', {
        active_problems: data.conditions,
        allergies: data.allergies,
        notes: data.medications ? `Medications: ${data.medications}` : undefined,
      });
    } catch (e) {
      console.error('Failed to save medical history:', e);
      throw e;
    }
  }

  // Onboarding - Insurance
  async saveInsuranceInfo(data: { provider?: string; member_id?: string; group_number?: string }): Promise<void> {
    try {
      // Insurance information would typically be stored in a separate insurance table
      // For now, we'll store it in the patient's notes field as a temporary solution
      const insuranceNote = `Insurance: Provider=${data.provider || 'N/A'}, MemberID=${data.member_id || 'N/A'}, Group=${data.group_number || 'N/A'}`;
      await this.api.put('/patients/me', {
        notes: insuranceNote,
      });
    } catch (e) {
      console.error('Failed to save insurance info:', e);
      throw e;
    }
  }

  // User Settings
  async getUserSettings(): Promise<any> {
    try {
      const response = await this.api.get('/settings/me');
      return response.data;
    } catch (e) {
      console.error('Failed to load user settings:', e);
      return null;
    }
  }

  async updateUserSettings(settings: any): Promise<any> {
    const response = await this.api.put('/settings/me', settings);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.api.post('/settings/me/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  async uploadAvatar(imageUri: string): Promise<string> {
    // This would need FormData implementation for file upload
    // For now, return a placeholder
    throw new Error('Avatar upload not yet implemented');
  }

  // Token management
  private async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await AsyncStorage.multiSet([
      ['access_token', accessToken],
      ['refresh_token', refreshToken],
    ]);
  }

  private async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return false;
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const apiService = new ApiService();
export default apiService;

