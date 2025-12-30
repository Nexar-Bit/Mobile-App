import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet,
  ScrollView,
  RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';

interface Prescription {
  id: number;
  medication_name: string;
  dosage?: string;
  frequency?: string;
  instructions?: string;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'completed' | 'cancelled';
  doctor_name?: string;
}

const MedicationsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  const loadPrescriptions = async () => {
    try {
      const data = await apiService.getMyPrescriptions();
      setPrescriptions(data);
    } catch (error) {
      console.error('Failed to load prescriptions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPrescriptions();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#34C759';
      case 'completed': return '#8E8E93';
      case 'cancelled': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'active': 'Ativa',
      'completed': 'Concluída',
      'cancelled': 'Cancelada',
    };
    return statusMap[status] || status;
  };

  const activePrescriptions = prescriptions.filter(p => p.status === 'active');
  const pastPrescriptions = prescriptions.filter(p => p.status !== 'active');

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Active Prescriptions */}
      {activePrescriptions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prescrições Ativas</Text>
          {activePrescriptions.map((prescription) => (
            <View key={prescription.id} style={styles.prescriptionCard}>
              <View style={styles.prescriptionHeader}>
                <View style={styles.prescriptionIcon}>
                  <Ionicons name="medical" size={24} color="#34C759" />
                </View>
                <View style={styles.prescriptionContent}>
                  <Text style={styles.prescriptionName}>{prescription.medication_name}</Text>
                  {prescription.dosage && (
                    <Text style={styles.prescriptionDetail}>Dose: {prescription.dosage}</Text>
                  )}
                  {prescription.frequency && (
                    <Text style={styles.prescriptionDetail}>Frequência: {prescription.frequency}</Text>
                  )}
                  {prescription.doctor_name && (
                    <Text style={styles.prescriptionDoctor}>Dr(a). {prescription.doctor_name}</Text>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(prescription.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(prescription.status) }]}>
                    {getStatusText(prescription.status)}
                  </Text>
                </View>
              </View>
              {prescription.instructions && (
                <Text style={styles.instructions}>{prescription.instructions}</Text>
              )}
              <View style={styles.prescriptionDates}>
                {prescription.start_date && (
                  <Text style={styles.dateText}>Início: {formatDate(prescription.start_date)}</Text>
                )}
                {prescription.end_date && (
                  <Text style={styles.dateText}>Término: {formatDate(prescription.end_date)}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Past Prescriptions */}
      {pastPrescriptions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prescrições Anteriores</Text>
          {pastPrescriptions.map((prescription) => (
            <View key={prescription.id} style={[styles.prescriptionCard, styles.prescriptionCardInactive]}>
              <View style={styles.prescriptionHeader}>
                <View style={[styles.prescriptionIcon, { backgroundColor: '#8E8E9320' }]}>
                  <Ionicons name="medical-outline" size={24} color="#8E8E93" />
                </View>
                <View style={styles.prescriptionContent}>
                  <Text style={[styles.prescriptionName, styles.prescriptionNameInactive]}>
                    {prescription.medication_name}
                  </Text>
                  {prescription.dosage && (
                    <Text style={styles.prescriptionDetail}>Dose: {prescription.dosage}</Text>
                  )}
                  {prescription.doctor_name && (
                    <Text style={styles.prescriptionDoctor}>Dr(a). {prescription.doctor_name}</Text>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(prescription.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(prescription.status) }]}>
                    {getStatusText(prescription.status)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          </View>
        )}

      {/* Empty State */}
      {prescriptions.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="medical-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nenhuma prescrição encontrada</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  prescriptionCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  prescriptionCardInactive: {
    opacity: 0.7,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  prescriptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#34C75920',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prescriptionContent: {
    flex: 1,
  },
  prescriptionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  prescriptionNameInactive: {
    color: '#8E8E93',
  },
  prescriptionDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  prescriptionDoctor: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    fontStyle: 'italic',
  },
  prescriptionDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

export default MedicationsScreen;
