import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import apiService from '../services/api';
import { User, Appointment } from '../types';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../styles/theme';
import { commonStyles } from '../styles/commonStyles';

const AppointmentsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'upcoming' | 'past' | 'book'>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Array<{ time: string; available: boolean }>>([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const viewRef = useRef(view);

  // Update viewRef when view changes
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const loadAppointments = useCallback(async (showLoading: boolean = true) => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current || !mountedRef.current) {
      return;
    }
    
    loadingRef.current = true;
    try {
      if (showLoading && mountedRef.current) {
        setLoading(true);
      }
      const data = await apiService.getAllMyAppointments();
      
      // Only update state if component is still mounted and view hasn't changed
      if (!mountedRef.current || viewRef.current === 'book') {
        return;
      }
      
      // Ensure all appointments have required fields
      const normalizedAppointments = data.map((apt: Appointment) => ({
        ...apt,
        scheduled_datetime: apt.scheduled_datetime || apt.datetime || new Date().toISOString(),
        status: (apt.status?.toLowerCase() || 'scheduled') as Appointment['status'],
        doctor_name: apt.doctor_name || 'Médico',
        duration_minutes: apt.duration_minutes || 30,
        clinic_id: apt.clinic_id || 0,
      }));
      
      if (mountedRef.current && viewRef.current !== 'book') {
        setAppointments(normalizedAppointments);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
      // Only update state if component is still mounted
      if (mountedRef.current && viewRef.current !== 'book') {
        setAppointments([]);
      }
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) {
        if (showLoading) {
          setLoading(false);
        }
        setRefreshing(false);
      }
    }
  }, []);

  const loadDoctors = useCallback(async () => {
    if (!mountedRef.current || viewRef.current !== 'book') {
      return;
    }
    try {
      const data = await apiService.getDoctors();
      if (mountedRef.current && viewRef.current === 'book') {
        setDoctors(data);
      }
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  }, []);

  // Load initial data on mount only
  useEffect(() => {
    mountedRef.current = true;
    // Load appointments on initial mount
    loadAppointments(true);
    
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Load doctors when view changes to 'book' - only load once when switching to 'book'
  const previousViewRef = useRef(view);
  useEffect(() => {
    if (view === 'book' && previousViewRef.current !== 'book' && mountedRef.current) {
      loadDoctors();
    }
    previousViewRef.current = view;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAppointments(false);
  }, [loadAppointments]);

  const loadSlots = async (doctor: User) => {
    try {
      setSelectedDoctor(doctor);
      setFetchingSlots(true);
      const data = await apiService.getDoctorAvailability(doctor.id!, date);
      setSlots(data);
    } catch (error) {
      console.error('Failed to load slots:', error);
    } finally {
      setFetchingSlots(false);
    }
  };

  const book = async (time: string) => {
    if (!selectedDoctor) return;
    try {
      const scheduled_datetime = new Date(`${date}T${time}:00`).toISOString();
      await apiService.bookAppointment({ 
        doctor_id: selectedDoctor.id!, 
        scheduled_datetime,
        reason: 'Consulta agendada pelo app',
      });
      Alert.alert('Sucesso', 'Sua consulta foi agendada com sucesso.');
      // Reload appointments and switch view after a delay to avoid render cycle issues
      setTimeout(() => {
        if (mountedRef.current) {
          setView('upcoming');
          loadAppointments(false);
        }
      }, 100);
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.detail || e?.message || 'Falha ao agendar consulta');
    }
  };

  const handleCancel = async (appointment: Appointment) => {
    Alert.alert(
      'Cancelar Consulta',
      'Tem certeza que deseja cancelar esta consulta?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.cancelAppointment(appointment.id);
              Alert.alert('Sucesso', 'Consulta cancelada com sucesso.');
              loadAppointments(false);
            } catch (e: any) {
              Alert.alert('Erro', e?.response?.data?.detail || e?.message || 'Falha ao cancelar consulta');
            }
          },
        },
      ]
    );
  };

  const handleReschedule = async (appointment: Appointment) => {
    // For now, show an alert - in a full implementation, you'd open a date/time picker
    Alert.alert(
      'Reagendar Consulta',
      'Funcionalidade de reagendamento em desenvolvimento. Por favor, cancele e agende uma nova consulta.',
      [{ text: 'OK' }]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return Colors.primary;
      case 'checked_in': return Colors.warning;
      case 'in_consultation': return Colors.success;
      case 'completed': return Colors.gray500;
      case 'cancelled': return Colors.error;
      default: return Colors.gray500;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'scheduled': 'Agendada',
      'checked_in': 'Check-in Realizado',
      'in_consultation': 'Em Consulta',
      'completed': 'Concluída',
      'cancelled': 'Cancelada',
    };
    return statusMap[status] || status;
  };

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_datetime);
      if (view === 'upcoming') {
        return aptDate >= now && apt.status !== 'cancelled' && apt.status !== 'completed';
      } else {
        return aptDate < now || apt.status === 'completed' || apt.status === 'cancelled';
      }
    });
  }, [appointments, view]);

  if (loading && view !== 'book') {
    return (
      <View style={commonStyles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Logo and Title */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image 
            source={require('../../assets/Logo/Logotipo em Fundo Transparente.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Prontivus</Text>
        </View>
      </View>

      {/* Page Title */}
      <View style={styles.pageTitleContainer}>
        <Text style={styles.pageTitle}>Atendimentos</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, view === 'upcoming' && styles.tabActive]}
          onPress={() => setView('upcoming')}
        >
          <Text style={[styles.tabText, view === 'upcoming' && styles.tabTextActive]}>
            Próximas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, view === 'past' && styles.tabActive]}
          onPress={() => setView('past')}
        >
          <Text style={[styles.tabText, view === 'past' && styles.tabTextActive]}>
            Passadas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, view === 'book' && styles.tabActive]}
          onPress={() => setView('book')}
        >
          <Text style={[styles.tabText, view === 'book' && styles.tabTextActive]}>
            Agendar
          </Text>
        </TouchableOpacity>
      </View>

      {view === 'book' ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Escolha seu médico</Text>
          <FlatList
            data={doctors}
            keyExtractor={(item) => String(item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => loadSlots(item)}
                style={[
                  styles.doctorCard,
                  selectedDoctor?.id === item.id && styles.doctorCardSelected
                ]}
              >
                <Ionicons name="person-circle-sharp" size={44} color={Colors.primary} />
                <Text style={styles.doctorName}>
                  {item.first_name} {item.last_name}
                </Text>
                {item.role && (
                  <Text style={styles.doctorRole}>{item.role}</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum médico disponível</Text>}
          />

          {selectedDoctor && (
            <>
              <Text style={styles.sectionTitle}>Data</Text>
              <View style={styles.dateInput}>
                <Ionicons name="calendar-sharp" size={22} color={Colors.gray600} />
                <Text style={styles.dateText}>{date}</Text>
              </View>

              <Text style={styles.sectionTitle}>Horários Disponíveis</Text>
              {fetchingSlots ? (
                <ActivityIndicator />
              ) : (
                <View style={styles.slotsGrid}>
                  {slots.map((slot, idx) => (
                    <TouchableOpacity
                      key={idx}
                      disabled={!slot.available}
                      onPress={() => book(slot.time)}
                      style={[
                        styles.slotButton,
                        !slot.available && styles.slotButtonDisabled
                      ]}
                    >
                      <Text style={[
                        styles.slotText,
                        !slot.available && styles.slotTextDisabled
                      ]}>
                        {slot.time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {slots.length === 0 && !fetchingSlots && (
                <Text style={styles.emptyText}>Nenhum horário disponível</Text>
              )}
            </>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {getStatusText(item.status)}
                  </Text>
                </View>
                <Ionicons name="calendar-sharp" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.appointmentDate}>{formatDate(item.scheduled_datetime)}</Text>
              <Text style={styles.appointmentDoctor}>
                {item.doctor_name || 'Médico'}
              </Text>
              {item.reason && (
                <Text style={styles.appointmentReason}>{item.reason}</Text>
              )}
              {view === 'upcoming' && item.status !== 'cancelled' && (
                <View style={styles.appointmentActions}>
                  {item.status === 'scheduled' && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rescheduleButton]}
                        onPress={() => handleReschedule(item)}
                      >
                        <Ionicons name="calendar-sharp" size={18} color={Colors.primary} />
                        <Text style={styles.actionButtonText}>Reagendar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => handleCancel(item)}
                      >
                        <Ionicons name="close-circle-sharp" size={18} color={Colors.error} />
                        <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>Cancelar</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-clear-sharp" size={72} color={Colors.gray300} />
              <Text style={styles.emptyText}>
                {view === 'upcoming' 
                  ? 'Nenhuma consulta agendada' 
                  : 'Nenhuma consulta passada'}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray700,
  },
  pageTitleContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.white,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gray900,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    ...Shadows.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    ...Typography.body,
    color: Colors.gray600,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.gray900,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  doctorCard: {
    width: 130,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.gray200,
    ...Shadows.sm,
  },
  doctorCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}15`,
    ...Shadows.md,
  },
  doctorName: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.gray900,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  doctorRole: {
    ...Typography.labelSmall,
    color: Colors.gray500,
    marginTop: Spacing.xs,
    textTransform: 'capitalize',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  dateText: {
    ...Typography.body,
    color: Colors.gray900,
    marginLeft: Spacing.md,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    width: '30%',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  slotButtonDisabled: {
    opacity: 0.4,
    borderColor: Colors.gray300,
    backgroundColor: Colors.gray100,
  },
  slotText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.primary,
  },
  slotTextDisabled: {
    color: Colors.gray400,
  },
  appointmentCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    ...Shadows.md,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  appointmentDoctor: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  appointmentReason: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  appointmentActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  rescheduleButton: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}15`,
  },
  cancelButton: {
    borderColor: Colors.error,
    backgroundColor: `${Colors.error}15`,
  },
  actionButtonText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: Spacing.xs,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.gray400,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
});

export default AppointmentsScreen;
