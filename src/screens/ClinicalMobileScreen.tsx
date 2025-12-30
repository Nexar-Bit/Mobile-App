import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MedicalBottomNav } from '../components/MedicalBottomNav';
import { PatientQuickLookup } from '../components/PatientQuickLookup';
import { VitalSignsEntry } from '../components/VitalSignsEntry';
import { MedicationAdmin } from '../components/MedicationAdmin';
import { ClinicalChart } from '../components/ClinicalChart';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { Patient } from '../types';

type ScreenState = 'patients' | 'vitals' | 'medications' | 'emergency';

const ClinicalMobileScreen = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('patients');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Mock patients data
  const [patients] = useState<Patient[]>([
    {
      id: 1,
      first_name: 'Maria',
      last_name: 'Silva',
      date_of_birth: '1985-03-15',
      gender: 'female',
      cpf: '123.456.789-00',
      phone: '(11) 98765-4321',
      email: 'maria@example.com',
      allergies: 'Penicilina',
      active_problems: 'Hipertensão, Diabetes',
      is_active: true,
      clinic_id: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      first_name: 'João',
      last_name: 'Santos',
      date_of_birth: '1978-07-22',
      gender: 'male',
      cpf: '987.654.321-00',
      phone: '(11) 91234-5678',
      email: 'joao@example.com',
      is_active: true,
      clinic_id: 1,
      created_at: new Date().toISOString(),
    },
  ]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentScreen('vitals');
  };

  const handleSwipeLeft = (patient: Patient) => {
    Alert.alert('Ligar Paciente', `Ligar para ${patient.first_name} ${patient.last_name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Ligar',
        onPress: () => {
          // Implement phone call
          console.log('Calling:', patient.phone);
        },
      },
    ]);
  };

  const handleSwipeRight = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentScreen('medications');
  };

  const handleVitalsSubmit = (vitals: any) => {
    Alert.alert('Sucesso', 'Sinais vitais registrados com sucesso');
    setSelectedPatient(null);
    setCurrentScreen('patients');
  };

  const handleMedicationAdminister = (medicationId: string, notes?: string) => {
    Alert.alert('Sucesso', 'Medicamento administrado e registrado');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'patients':
        return (
          <PatientQuickLookup
            patients={patients}
            onSelectPatient={handleSelectPatient}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            loading={refreshing}
          />
        );

      case 'vitals':
        return selectedPatient ? (
          <VitalSignsEntry
            patientId={selectedPatient.id}
            patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
            onSubmit={handleVitalsSubmit}
            onCancel={() => {
              setSelectedPatient(null);
              setCurrentScreen('patients');
            }}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum paciente selecionado</Text>
          </View>
        );

      case 'medications':
        return selectedPatient ? (
          <MedicationAdmin
            patientId={selectedPatient.id}
            patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
            medications={[
              {
                id: '1',
                name: 'Paracetamol',
                dosage: '500mg',
                frequency: '8/8 horas',
                route: 'Oral',
                scheduledTime: new Date().toISOString(),
              },
              {
                id: '2',
                name: 'Ibuprofeno',
                dosage: '400mg',
                frequency: '12/12 horas',
                route: 'Oral',
                scheduledTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
              },
            ]}
            onAdminister={handleMedicationAdminister}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum paciente selecionado</Text>
          </View>
        );

      case 'emergency':
        return (
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.emergencyHeader}>
              <Ionicons name="alert-circle" size={64} color="#FF3B30" />
              <Text style={styles.emergencyTitle}>Acesso Rápido de Emergência</Text>
            </View>

            <TouchableOpacity style={styles.emergencyButton}>
              <Ionicons name="call" size={24} color="#FFFFFF" />
              <Text style={styles.emergencyButtonText}>SAMU - 192</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.emergencyButton}>
              <Ionicons name="call" size={24} color="#FFFFFF" />
              <Text style={styles.emergencyButtonText}>Bombeiros - 193</Text>
            </TouchableOpacity>

            <View style={styles.chartsContainer}>
              <ClinicalChart
                title="Pressão Arterial"
                data={[
                  { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), value: 120 },
                  { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), value: 125 },
                  { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), value: 118 },
                  { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), value: 122 },
                  { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), value: 120 },
                  { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), value: 125 },
                  { date: new Date().toISOString(), value: 130 },
                ]}
                unit="mmHg"
                normalRange={{ min: 90, max: 140 }}
                color="#FF3B30"
                onRefresh={onRefresh}
                isOffline={isOffline}
              />
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <OfflineIndicator onStatusChange={setIsOffline} />
      <View style={styles.container}>
        {renderScreen()}
        <MedicalBottomNav
          activeTab={currentScreen}
          // @ts-ignore
          onTabChange={setCurrentScreen}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  emergencyHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  chartsContainer: {
    marginTop: 16,
  },
});

export default ClinicalMobileScreen;

