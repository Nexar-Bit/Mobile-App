import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles/theme';
import { commonStyles } from '../styles/commonStyles';

interface TestResult {
  id: string;
  testName: string;
  category: string;
  value: number | string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'borderline' | 'abnormal' | 'critical';
  date: string;
  provider: string;
  notes?: string;
}

interface LabReport {
  id: string;
  reportDate: string;
  orderedBy: string;
  provider: string;
  results: TestResult[];
  summary?: string;
}

const TestResultsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<LabReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);

  const loadTestResults = async () => {
    try {
      setLoading(true);
      const examResults = await apiService.getMyTestResults();
      
      // Group exams by date to create reports
      const reportsMap = new Map<string, LabReport>();
      
      examResults.forEach((exam: any) => {
        const reportDate = exam.completed_date || exam.appointment_date || exam.requested_date || new Date().toISOString();
        const reportKey = reportDate.split('T')[0];
        
        if (!reportsMap.has(reportKey)) {
          reportsMap.set(reportKey, {
            id: `report-${reportKey}`,
            reportDate: reportDate,
            orderedBy: exam.doctor_name || 'Médico',
            provider: exam.provider || 'Clínica',
            results: [],
            summary: undefined,
          });
        }
        
        const report = reportsMap.get(reportKey)!;
        const testResult: TestResult = {
          id: exam.id?.toString() || Math.random().toString(),
          testName: exam.exam_type || exam.name || 'Exame',
          category: exam.category || 'Geral',
          value: exam.result || exam.value || 'N/A',
          unit: exam.unit || '',
          referenceRange: exam.reference_range || exam.normal_range || 'N/A',
          status: determineStatus(exam),
          date: reportDate,
          provider: exam.provider || 'Clínica',
          notes: exam.notes || exam.observations,
        };
        report.results.push(testResult);
      });
      
      const reportsArray: LabReport[] = Array.from(reportsMap.values()).map(report => ({
        ...report,
        summary: `${report.results.length} exame(s)`,
      }));
      
      reportsArray.sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
      setReports(reportsArray);
    } catch (error: any) {
      console.error('Error loading test results:', error);
      Alert.alert('Erro', 'Não foi possível carregar os resultados dos exames');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const determineStatus = (exam: any): 'normal' | 'borderline' | 'abnormal' | 'critical' => {
    if (exam.status === 'completed' || exam.status === 'available') {
      if (exam.result_status === 'normal') return 'normal';
      if (exam.result_status === 'abnormal') return 'abnormal';
      if (exam.result_status === 'critical') return 'critical';
    }
    return 'normal';
  };

  useEffect(() => {
    loadTestResults();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadTestResults();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return '#16C79A';
      case 'borderline': return '#F59E0B';
      case 'abnormal': return '#EF4444';
      case 'critical': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return 'checkmark-circle-sharp';
      case 'borderline':
      case 'abnormal':
      case 'critical': return 'warning-sharp';
      default: return 'help-circle-sharp';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading && reports.length === 0) {
    return (
      <View style={commonStyles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={commonStyles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={commonStyles.header}>
          <Text style={commonStyles.headerTitle}>Resultados de Exames</Text>
          <Text style={commonStyles.headerSubtitle}>Histórico completo dos seus exames</Text>
        </View>

        {reports.length === 0 ? (
          <View style={commonStyles.emptyContainer}>
            <Ionicons name="document-text-sharp" size={64} color={Colors.gray300} />
            <Text style={commonStyles.emptyText}>Nenhum resultado de exame encontrado</Text>
          </View>
        ) : (
          reports.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={commonStyles.listItem}
              onPress={() => setSelectedReport(report)}
              activeOpacity={0.7}
            >
              <View style={styles.reportIconWrapper}>
                <Ionicons name="document-text" size={20} color={Colors.primary} />
              </View>
              <View style={commonStyles.listItemContent}>
                <Text style={commonStyles.listItemTitle}>{formatDate(report.reportDate)}</Text>
                <Text style={commonStyles.listItemSubtitle}>{report.summary}</Text>
                <Text style={styles.reportProvider}>Solicitado por: {report.orderedBy}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.gray400} />
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      <Modal
        visible={selectedReport !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedReport(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Resultados - {selectedReport ? formatDate(selectedReport.reportDate) : ''}</Text>
              <TouchableOpacity 
                onPress={() => setSelectedReport(null)}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={Colors.gray600} />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {selectedReport?.results.map((result) => (
                <View key={result.id} style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultName}>{result.testName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(result.status)}20` }]}>
                      <Ionicons
                        name={getStatusIcon(result.status)}
                        size={14}
                        color={getStatusColor(result.status)}
                      />
                      <Text style={[styles.statusText, { color: getStatusColor(result.status) }]}>
                        {result.status === 'normal' ? 'Normal' : result.status === 'borderline' ? 'Fora do Normal' : result.status === 'abnormal' ? 'Anormal' : 'Crítico'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.resultDetails}>
                    <View style={styles.resultRow}>
                      <Text style={styles.resultLabel}>Valor:</Text>
                      <Text style={styles.resultValue}>{result.value} {result.unit}</Text>
                    </View>
                    <View style={styles.resultRow}>
                      <Text style={styles.resultLabel}>Referência:</Text>
                      <Text style={styles.resultValue}>{result.referenceRange}</Text>
                    </View>
                    {result.notes && (
                      <View style={styles.resultNotes}>
                        <Text style={styles.resultLabel}>Observações:</Text>
                        <Text style={styles.resultNotesText}>{result.notes}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  reportIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportProvider: {
    fontSize: 12,
    color: Colors.gray400,
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '85%',
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray900,
    flex: 1,
  },
  closeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  modalBody: {
    padding: Spacing.md,
  },
  resultCard: {
    backgroundColor: Colors.gray50,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray900,
    flex: 1,
    marginRight: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  resultDetails: {
    marginTop: Spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  resultLabel: {
    fontSize: 14,
    color: Colors.gray600,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 14,
    color: Colors.gray900,
    fontWeight: '600',
  },
  resultNotes: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  resultNotesText: {
    fontSize: 14,
    color: Colors.gray700,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
});

export default TestResultsScreen;

