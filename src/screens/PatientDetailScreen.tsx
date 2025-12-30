import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Patient, ClinicalRecord } from '../types';
import apiService from '../services/api';

type PatientDetailScreenRouteProp = RouteProp<RootStackParamList, 'PatientDetail'>;
type PatientDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PatientDetail'>;

const PatientDetailScreen = () => {
  const route = useRoute<PatientDetailScreenRouteProp>();
  const navigation = useNavigation<PatientDetailScreenNavigationProp>();
  const { appointment } = route.params;
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [clinicalRecord, setClinicalRecord] = useState<ClinicalRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      setIsLoading(true);
      const [patientData, clinicalData] = await Promise.all([
        apiService.getPatient(appointment.patient_id),
        apiService.getClinicalRecord(appointment.id),
      ]);
      
      setPatient(patientData);
      setClinicalRecord(clinicalData);
    } catch (error) {
      console.error('Error loading patient data:', error);
      Alert.alert('Error', 'Failed to load patient information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEHR = () => {
    navigation.navigate('EHR', { appointment });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading patient information...</Text>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorTitle}>Patient Not Found</Text>
        <Text style={styles.errorText}>Unable to load patient information</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.patientBasicInfo}>
          <Text style={styles.patientName}>
            {patient.first_name} {patient.last_name}
          </Text>
          <Text style={styles.patientAge}>
            {patient.date_of_birth ? `${calculateAge(patient.date_of_birth)} years old` : 'Age not specified'}
          </Text>
          <Text style={styles.patientGender}>
            {patient.gender?.charAt(0).toUpperCase() + patient.gender?.slice(1)}
          </Text>
        </View>
        <TouchableOpacity style={styles.ehrButton} onPress={handleOpenEHR}>
          <Ionicons name="medical-outline" size={20} color="white" />
          <Text style={styles.ehrButtonText}>Open EHR</Text>
        </TouchableOpacity>
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={20} color="#666" />
          <Text style={styles.infoText}>{patient.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color="#666" />
          <Text style={styles.infoText}>{patient.email}</Text>
        </View>
        {patient.address && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{patient.address}</Text>
          </View>
        )}
      </View>

      {/* Emergency Contact */}
      {patient.emergency_contact_name && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{patient.emergency_contact_name}</Text>
          </View>
          {patient.emergency_contact_phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#666" />
              <Text style={styles.infoText}>{patient.emergency_contact_phone}</Text>
            </View>
          )}
          {patient.emergency_contact_relationship && (
            <View style={styles.infoRow}>
              <Ionicons name="heart-outline" size={20} color="#666" />
              <Text style={styles.infoText}>{patient.emergency_contact_relationship}</Text>
            </View>
          )}
        </View>
      )}

      {/* Medical Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical Information</Text>
        {patient.blood_type && (
          <View style={styles.infoRow}>
            <Ionicons name="water-outline" size={20} color="#666" />
            <Text style={styles.infoText}>Blood Type: {patient.blood_type}</Text>
          </View>
        )}
        {patient.allergies && (
          <View style={styles.infoRow}>
            <Ionicons name="warning-outline" size={20} color="#FF9500" />
            <Text style={styles.infoText}>Allergies: {patient.allergies}</Text>
          </View>
        )}
        {patient.active_problems && (
          <View style={styles.infoRow}>
            <Ionicons name="medical-outline" size={20} color="#FF3B30" />
            <Text style={styles.infoText}>Active Problems: {patient.active_problems}</Text>
          </View>
        )}
      </View>

      {/* Appointment Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appointment Details</Text>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            {new Date(appointment.scheduled_datetime).toLocaleString('pt-BR')}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="hourglass-outline" size={20} color="#666" />
          <Text style={styles.infoText}>{appointment.duration_minutes} minutes</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="document-text-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            Type: {appointment.appointment_type.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        {appointment.reason && (
          <View style={styles.infoRow}>
            <Ionicons name="chatbubble-outline" size={20} color="#666" />
            <Text style={styles.infoText}>Reason: {appointment.reason}</Text>
          </View>
        )}
      </View>

      {/* Clinical Record Summary */}
      {clinicalRecord && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Previous Visit Summary</Text>
          {clinicalRecord.chief_complaint && (
            <View style={styles.infoRow}>
              <Ionicons name="chatbubble-outline" size={20} color="#666" />
              <Text style={styles.infoText}>Chief Complaint: {clinicalRecord.chief_complaint}</Text>
            </View>
          )}
          {clinicalRecord.assessment && (
            <View style={styles.infoRow}>
              <Ionicons name="analytics-outline" size={20} color="#666" />
              <Text style={styles.infoText}>Assessment: {clinicalRecord.assessment}</Text>
            </View>
          )}
          {clinicalRecord.plan && (
            <View style={styles.infoRow}>
              <Ionicons name="list-outline" size={20} color="#666" />
              <Text style={styles.infoText}>Plan: {clinicalRecord.plan}</Text>
            </View>
          )}
        </View>
      )}

      {/* Notes */}
      {patient.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{patient.notes}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientBasicInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  patientAge: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  patientGender: {
    fontSize: 16,
    color: '#666',
  },
  ehrButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  ehrButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 8,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  notesText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});

export default PatientDetailScreen;
