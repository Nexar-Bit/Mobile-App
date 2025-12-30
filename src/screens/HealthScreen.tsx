import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';
import { Colors } from '../styles/theme';

const HealthScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [health, presc, tests] = await Promise.all([
        apiService.getMyHealthData(),
        apiService.getMyPrescriptions(),
        apiService.getMyTestResults(),
      ]);
      setHealthData(health);
      setPrescriptions(presc);
      setTestResults(tests);
    } catch (error) {
      console.error('Failed to load health data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

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
      {/* Health Summary */}
      {healthData && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumo de Saúde</Text>
          {healthData.allergies && (
            <View style={styles.summaryItem}>
              <Ionicons name="warning-sharp" size={22} color={Colors.warning} />
              <View style={styles.summaryItemContent}>
                <Text style={styles.summaryItemLabel}>Alergias</Text>
                <Text style={styles.summaryItemValue}>{healthData.allergies}</Text>
              </View>
            </View>
          )}
          {healthData.active_problems && (
            <View style={styles.summaryItem}>
              <Ionicons name="medical-sharp" size={22} color={Colors.error} />
              <View style={styles.summaryItemContent}>
                <Text style={styles.summaryItemLabel}>Problemas Ativos</Text>
                <Text style={styles.summaryItemValue}>{healthData.active_problems}</Text>
              </View>
            </View>
          )}
          {healthData.blood_type && (
            <View style={styles.summaryItem}>
              <Ionicons name="water-sharp" size={22} color={Colors.primary} />
              <View style={styles.summaryItemContent}>
                <Text style={styles.summaryItemLabel}>Tipo Sanguíneo</Text>
                <Text style={styles.summaryItemValue}>{healthData.blood_type}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Active Prescriptions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prescrições Ativas</Text>
        {prescriptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Nenhuma prescrição ativa</Text>
          </View>
        ) : (
          prescriptions
            .filter((p: any) => p.status === 'active' || !p.status)
            .slice(0, 5)
            .map((prescription: any) => (
              <TouchableOpacity key={prescription.id} style={styles.itemCard}>
                <View style={styles.itemIcon}>
                  <Ionicons name="medical" size={24} color="#34C759" />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{prescription.medication_name}</Text>
                  <Text style={styles.itemSubtitle}>
                    {prescription.dosage} • {prescription.frequency}
                  </Text>
                  {prescription.start_date && (
                    <Text style={styles.itemDate}>
                      Início: {formatDate(prescription.start_date)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
        )}
      </View>

      {/* Recent Test Results */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resultados de Exames</Text>
        {testResults.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="flask-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum resultado de exame</Text>
          </View>
        ) : (
          testResults.slice(0, 5).map((result: any) => (
            <TouchableOpacity key={result.id} style={styles.itemCard}>
              <View style={styles.itemIcon}>
                <Ionicons name="document-text" size={24} color="#007AFF" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>
                  {result.exam_type || 'Exame'}
                </Text>
                <Text style={styles.itemSubtitle}>
                  {result.status === 'completed' ? 'Concluído' : 'Pendente'}
                </Text>
                {result.created_at && (
                  <Text style={styles.itemDate}>
                    {formatDate(result.created_at)}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Medications')}
        >
          <Ionicons name="medical" size={24} color="#34C759" />
          <Text style={styles.quickActionText}>Ver Todas Prescrições</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Metrics')}
        >
          <Ionicons name="analytics-outline" size={24} color="#AF52DE" />
          <Text style={styles.quickActionText}>Ver Todos Exames</Text>
        </TouchableOpacity>
      </View>
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
  summaryCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  summaryItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  summaryItemLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default HealthScreen;

