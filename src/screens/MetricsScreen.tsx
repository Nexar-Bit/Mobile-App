import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';

interface TestResult {
  id: number;
  test_type?: string;
  test_name?: string;
  result?: string;
  normal_range?: string;
  unit?: string;
  status?: 'normal' | 'abnormal' | 'critical';
  test_date?: string;
  doctor_name?: string;
  notes?: string;
}

const MetricsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);

  const loadTestResults = async () => {
    try {
      const data = await apiService.getMyTestResults();
      setTestResults(data);
    } catch (error) {
      console.error('Failed to load test results:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTestResults();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadTestResults();
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

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'normal': return '#34C759';
      case 'abnormal': return '#FF9500';
      case 'critical': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status?: string) => {
    const statusMap: Record<string, string> = {
      'normal': 'Normal',
      'abnormal': 'Anormal',
      'critical': 'Crítico',
    };
    return statusMap[status || ''] || 'N/A';
  };

  const getTestIcon = (testType?: string) => {
    if (!testType) return 'flask-outline';
    const type = testType.toLowerCase();
    if (type.includes('blood') || type.includes('sangue')) return 'water-outline';
    if (type.includes('xray') || type.includes('raio')) return 'radio-outline';
    if (type.includes('ecg') || type.includes('eletro')) return 'pulse-outline';
    return 'flask-outline';
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
      {/* Summary Stats */}
      {testResults.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="flask" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{testResults.length}</Text>
            <Text style={styles.statLabel}>Total de Exames</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.statValue}>
              {testResults.filter(r => r.status === 'normal').length}
            </Text>
            <Text style={styles.statLabel}>Normais</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="warning" size={24} color="#FF9500" />
            <Text style={styles.statValue}>
              {testResults.filter(r => r.status === 'abnormal' || r.status === 'critical').length}
            </Text>
            <Text style={styles.statLabel}>Atenção</Text>
          </View>
        </View>
      )}

      {/* Test Results List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resultados de Exames</Text>
        {testResults.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="flask-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum resultado de exame encontrado</Text>
          </View>
        ) : (
          testResults.map((result) => (
            <TouchableOpacity
              key={result.id}
              style={styles.resultCard}
              onPress={() => setSelectedResult(result)}
            >
              <View style={styles.resultHeader}>
                <View style={[styles.resultIcon, { backgroundColor: getStatusColor(result.status) + '20' }]}>
                  <Ionicons 
                    name={getTestIcon(result.test_type) as any} 
                    size={24} 
                    color={getStatusColor(result.status)} 
                  />
                </View>
                <View style={styles.resultContent}>
                  <Text style={styles.resultName}>
                    {result.test_name || result.test_type || 'Exame'}
                  </Text>
                  {result.result && (
                    <Text style={styles.resultValue}>
                      {result.result} {result.unit || ''}
                    </Text>
                  )}
                  {result.normal_range && (
                    <Text style={styles.resultRange}>
                      Normal: {result.normal_range}
                    </Text>
                  )}
                  {result.test_date && (
                    <Text style={styles.resultDate}>{formatDate(result.test_date)}</Text>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(result.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(result.status) }]}>
                    {getStatusText(result.status)}
                  </Text>
                </View>
              </View>
              {result.doctor_name && (
                <Text style={styles.resultDoctor}>Dr(a). {result.doctor_name}</Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Detail Modal would go here */}
      {selectedResult && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedResult.test_name || selectedResult.test_type || 'Exame'}
              </Text>
              <TouchableOpacity onPress={() => setSelectedResult(null)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {selectedResult.result && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Resultado</Text>
                <Text style={styles.modalValue}>
                  {selectedResult.result} {selectedResult.unit || ''}
                </Text>
              </View>
            )}
            {selectedResult.normal_range && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Valor Normal</Text>
                <Text style={styles.modalValue}>{selectedResult.normal_range}</Text>
              </View>
            )}
            {selectedResult.test_date && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Data do Exame</Text>
                <Text style={styles.modalValue}>{formatDate(selectedResult.test_date)}</Text>
              </View>
            )}
            {selectedResult.doctor_name && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Médico</Text>
                <Text style={styles.modalValue}>Dr(a). {selectedResult.doctor_name}</Text>
              </View>
            )}
            {selectedResult.notes && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Observações</Text>
                <Text style={styles.modalValue}>{selectedResult.notes}</Text>
              </View>
            )}
          </View>
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
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
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
  resultCard: {
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
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  resultRange: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resultDate: {
    fontSize: 12,
    color: '#999',
  },
  resultDoctor: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 8,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default MetricsScreen;
