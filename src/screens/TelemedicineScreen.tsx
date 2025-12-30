import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  ActivityIndicator,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../styles/theme';

const TelemedicineScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [upcomingAppointment, setUpcomingAppointment] = useState<any>(null);
  const [inCall, setInCall] = useState(false);

  useEffect(() => {
    loadUpcomingAppointment();
  }, []);

  const loadUpcomingAppointment = async () => {
    try {
      const appointments = await apiService.getMyUpcomingAppointments();
      if (appointments.length > 0) {
        setUpcomingAppointment(appointments[0]);
      }
    } catch (error) {
      console.error('Failed to load appointment:', error);
    } finally {
      setLoading(false);
    }
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

  const handleJoinCall = () => {
    if (!upcomingAppointment) {
      Alert.alert('Erro', 'Nenhuma consulta agendada encontrada');
      return;
    }
    // In a real implementation, this would connect to a video call service
    setInCall(true);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (inCall) {
    return (
      <View style={styles.callContainer}>
        <View style={styles.videoContainer}>
          <View style={styles.videoPlaceholder}>
            <Ionicons name="videocam" size={64} color="#fff" />
            <Text style={styles.videoPlaceholderText}>Consulta em andamento</Text>
          </View>
        </View>
        <View style={styles.callControls}>
          <TouchableOpacity 
            style={[styles.controlButton, styles.muteButton]}
            onPress={() => Alert.alert('Mute', 'Funcionalidade em desenvolvimento')}
          >
            <Ionicons name="mic" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.controlButton, styles.endCallButton]}
            onPress={() => setInCall(false)}
          >
            <Ionicons name="call" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.controlButton, styles.videoButton]}
            onPress={() => Alert.alert('Video', 'Funcionalidade em desenvolvimento')}
          >
            <Ionicons name="videocam" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="videocam" size={48} color="#007AFF" />
        <Text style={styles.title}>Telemedicina</Text>
        <Text style={styles.subtitle}>Consultas virtuais com seu médico</Text>
      </View>

      {upcomingAppointment ? (
        <View style={styles.appointmentCard}>
          <Text style={styles.cardTitle}>Próxima Consulta Virtual</Text>
          <View style={styles.appointmentInfo}>
            <Ionicons name="calendar" size={20} color="#007AFF" />
            <Text style={styles.appointmentText}>
              {formatDate(upcomingAppointment.scheduled_datetime)}
            </Text>
          </View>
          <View style={styles.appointmentInfo}>
            <Ionicons name="person" size={20} color="#007AFF" />
            <Text style={styles.appointmentText}>
              {upcomingAppointment.doctor_name || 'Médico'}
            </Text>
          </View>
          {upcomingAppointment.appointment_type && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{upcomingAppointment.appointment_type}</Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.joinButton}
            onPress={handleJoinCall}
          >
            <Ionicons name="videocam" size={20} color="#fff" />
            <Text style={styles.joinButtonText}>Entrar na Consulta</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noAppointmentCard}>
          <Ionicons name="calendar-clear-sharp" size={72} color={Colors.gray300} />
          <Text style={styles.noAppointmentText}>
            Nenhuma consulta virtual agendada
          </Text>
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => navigation.navigate('Appointments')}
          >
            <Text style={styles.bookButtonText}>Agendar Consulta</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>Como usar a Telemedicina</Text>
        <View style={styles.instructionItem}>
          <Ionicons name="checkmark-circle" size={20} color="#34C759" />
          <Text style={styles.instructionText}>
            Certifique-se de ter uma conexão estável com a internet
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="checkmark-circle" size={20} color="#34C759" />
          <Text style={styles.instructionText}>
            Use um ambiente silencioso e bem iluminado
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="checkmark-circle" size={20} color="#34C759" />
          <Text style={styles.instructionText}>
            Teste seu microfone e câmera antes da consulta
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  appointmentCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  appointmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  typeText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  noAppointmentCard: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noAppointmentText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bookButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  instructionsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  callContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    alignItems: 'center',
  },
  videoPlaceholderText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
  },
  callControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteButton: {
    backgroundColor: '#8E8E93',
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
  },
  videoButton: {
    backgroundColor: '#8E8E93',
  },
});

export default TelemedicineScreen;
