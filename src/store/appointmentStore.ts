import { create } from 'zustand';
import { Appointment } from '../types';
import apiService from '../services/api';

interface AppointmentState {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  fetchTodayAppointments: () => Promise<void>;
  updateAppointmentStatus: (id: number, status: string) => Promise<void>;
  setAppointments: (appointments: Appointment[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [],
  isLoading: false,
  error: null,

  fetchTodayAppointments: async () => {
    try {
      set({ isLoading: true, error: null });
      const appointments = await apiService.getTodayAppointments();
      set({ appointments, isLoading: false });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      set({ 
        error: 'Failed to fetch appointments', 
        isLoading: false 
      });
    }
  },

  updateAppointmentStatus: async (id: number, status: string) => {
    try {
      set({ isLoading: true, error: null });
      const updatedAppointment = await apiService.updateAppointmentStatus(id, status);
      
      set((state) => ({
        appointments: state.appointments.map(apt => 
          apt.id === id ? updatedAppointment : apt
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error updating appointment:', error);
      set({ 
        error: 'Failed to update appointment', 
        isLoading: false 
      });
    }
  },

  setAppointments: (appointments: Appointment[]) => {
    set({ appointments });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
