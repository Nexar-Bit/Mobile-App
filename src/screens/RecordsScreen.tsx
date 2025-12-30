import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';
import { ClinicalRecord } from '../types';
import { Colors } from '../styles/theme';

const RecordsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const loadData = async () => {
    try {
      // Load data with individual error handling for each call
      const results = await Promise.allSettled([
        apiService.getMyMedicalRecords(),
        apiService.getMyDocuments(),
        apiService.getMyRecordsSummary(),
      ]);
      
      // Handle records data
      if (results[0].status === 'fulfilled') {
        setRecords(results[0].value);
      } else {
        console.error('Failed to load medical records:', results[0].reason);
        setRecords([]);
      }
      
      // Handle documents data
      if (results[1].status === 'fulfilled') {
        setDocuments(results[1].value);
      } else {
        console.error('Failed to load documents:', results[1].reason);
        setDocuments([]);
      }
      
      // Handle summary data
      if (results[2].status === 'fulfilled') {
        setSummary(results[2].value);
      } else {
        console.error('Failed to load summary:', results[2].reason);
        setSummary(null);
      }
    } catch (error) {
      console.error('Failed to load records:', error);
      // Set empty defaults on error
      setRecords([]);
      setDocuments([]);
      setSummary(null);
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
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric'
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
      {/* Summary Card */}
      {summary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumo Médico</Text>
          {summary.allergies && (
            <View style={styles.summaryItem}>
              <Ionicons name="warning-sharp" size={22} color="#FF9500" />
              <View style={styles.summaryItemContent}>
                <Text style={styles.summaryItemLabel}>Alergias</Text>
                <Text style={styles.summaryItemValue}>{summary.allergies}</Text>
              </View>
            </View>
          )}
          {summary.active_problems && (
            <View style={styles.summaryItem}>
              <Ionicons name="medical-sharp" size={22} color="#FF3B30" />
              <View style={styles.summaryItemContent}>
                <Text style={styles.summaryItemLabel}>Problemas Ativos</Text>
                <Text style={styles.summaryItemValue}>{summary.active_problems}</Text>
              </View>
            </View>
          )}
          {summary.blood_type && (
            <View style={styles.summaryItem}>
              <Ionicons name="water-sharp" size={22} color="#007AFF" />
              <View style={styles.summaryItemContent}>
                <Text style={styles.summaryItemLabel}>Tipo Sanguíneo</Text>
                <Text style={styles.summaryItemValue}>{summary.blood_type}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Medical Records */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Registros Clínicos</Text>
        {records.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-sharp" size={56} color={Colors.gray300} />
            <Text style={styles.emptyText}>Nenhum registro encontrado</Text>
          </View>
        ) : (
          records.map((record) => (
            <TouchableOpacity key={record.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <Ionicons name="document-text" size={24} color="#007AFF" />
                <Text style={styles.recordDate}>{formatDate(record.created_at)}</Text>
              </View>
              {(record.subjective || record.chief_complaint) && (
                <Text style={styles.recordTitle} numberOfLines={2}>
                  {record.subjective || record.chief_complaint}
                </Text>
              )}
              {(record.assessment || record.objective) && (
                <Text style={styles.recordText} numberOfLines={3}>
                  {record.assessment || record.objective}
                </Text>
              )}
              {record.appointment && (
                <Text style={styles.recordAppointment}>
                  Consulta: {formatDate(record.appointment.scheduled_datetime)}
                </Text>
              )}
              <View style={styles.recordFooter}>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Documents */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documentos e Exames</Text>
        {documents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-sharp" size={56} color={Colors.gray300} />
            <Text style={styles.emptyText}>Nenhum documento encontrado</Text>
          </View>
        ) : (
          documents.map((doc) => (
            <TouchableOpacity key={doc.id} style={styles.documentCard}>
              <View style={styles.documentIcon}>
                <Ionicons 
                  name={doc.type === 'pdf' ? 'document-text' : 'image'} 
                  size={24} 
                  color="#007AFF" 
                />
              </View>
              <View style={styles.documentContent}>
                <Text style={styles.documentTitle}>{doc.title}</Text>
                <Text style={styles.documentType}>{doc.type}</Text>
                <Text style={styles.documentDate}>{formatDate(doc.created_at)}</Text>
              </View>
              <Ionicons name="download-sharp" size={26} color={Colors.primary} />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {[
          { id: 'medications', icon: 'medical', color: '#34C759', label: 'Prescrições', screen: 'Medications' },
          { id: 'metrics', icon: 'analytics-sharp', color: '#AF52DE', label: 'Exames', screen: 'Metrics' },
        ].map((action) => (
          <TouchableOpacity 
            key={action.id}
            style={styles.quickActionButton}
            onPress={() => navigation.navigate(action.screen as any)}
          >
            <Ionicons name={action.icon as any} size={24} color={action.color} />
            <Text style={styles.quickActionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
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
  recordCard: {
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
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordDate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recordText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  recordFooter: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  recordAppointment: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  documentCard: {
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
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentContent: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  documentType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  documentDate: {
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
  },
});

export default RecordsScreen;
