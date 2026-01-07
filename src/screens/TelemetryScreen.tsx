import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';
import { Colors } from '../styles/theme';

interface TelemetryRecord {
  id: number;
  measured_at: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  heart_rate?: number;
  temperature?: number;
  oxygen_saturation?: number;
  respiratory_rate?: number;
  weight?: number;
  height?: number;
  notes?: string;
}

interface TelemetryStats {
  average_systolic_bp?: number;
  average_diastolic_bp?: number;
  average_heart_rate?: number;
  average_temperature?: number;
  average_oxygen_saturation?: number;
  average_weight?: number;
  record_count: number;
}

const TelemetryScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState<TelemetryRecord[]>([]);
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    systolic_bp: '',
    diastolic_bp: '',
    heart_rate: '',
    temperature: '',
    oxygen_saturation: '',
    respiratory_rate: '',
    weight: '',
    height: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const [telemetryRecords, telemetryStats] = await Promise.all([
        apiService.getMyTelemetryRecords({
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          limit: 100,
        }),
        apiService.getTelemetryStats('last_30_days'),
      ]);

      setRecords(telemetryRecords);
      setStats(telemetryStats);
    } catch (error) {
      console.error('Failed to load telemetry data:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados de telemetria');
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

  const handleSave = async () => {
    try {
      setSaving(true);
      const createData: any = {
        measured_at: new Date().toISOString(),
      };

      if (formData.systolic_bp) createData.systolic_bp = Number(formData.systolic_bp);
      if (formData.diastolic_bp) createData.diastolic_bp = Number(formData.diastolic_bp);
      if (formData.heart_rate) createData.heart_rate = Number(formData.heart_rate);
      if (formData.temperature) createData.temperature = Number(formData.temperature);
      if (formData.oxygen_saturation) createData.oxygen_saturation = Number(formData.oxygen_saturation);
      if (formData.respiratory_rate) createData.respiratory_rate = Number(formData.respiratory_rate);
      if (formData.weight) createData.weight = Number(formData.weight);
      if (formData.height) createData.height = Number(formData.height);
      if (formData.notes) createData.notes = formData.notes;

      await apiService.createTelemetryRecord(createData);
      Alert.alert('Sucesso', 'Sinais vitais registrados com sucesso!');
      setShowAddModal(false);
      setFormData({
        systolic_bp: '',
        diastolic_bp: '',
        heart_rate: '',
        temperature: '',
        oxygen_saturation: '',
        respiratory_rate: '',
        weight: '',
        height: '',
        notes: '',
      });
      loadData();
    } catch (error: any) {
      console.error('Error saving telemetry:', error);
      Alert.alert('Erro', error?.response?.data?.detail || error?.message || 'Falha ao salvar sinais vitais');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (value: number | undefined, normalRange: { min: number; max: number }): string => {
    if (!value) return '#8E8E93';
    if (value >= normalRange.min && value <= normalRange.max) return '#34C759';
    if (value < normalRange.min * 0.9 || value > normalRange.max * 1.1) return '#FF3B30';
    return '#FF9500';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Summary */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="pulse" size={24} color="#FF3B30" />
              <Text style={styles.statValue}>
                {stats.average_heart_rate ? Math.round(stats.average_heart_rate) : '--'}
              </Text>
              <Text style={styles.statLabel}>BPM</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="water" size={24} color="#007AFF" />
              <Text style={styles.statValue}>
                {stats.average_systolic_bp && stats.average_diastolic_bp
                  ? `${Math.round(stats.average_systolic_bp)}/${Math.round(stats.average_diastolic_bp)}`
                  : '--'}
              </Text>
              <Text style={styles.statLabel}>PA</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="thermometer" size={24} color="#FF9500" />
              <Text style={styles.statValue}>
                {stats.average_temperature ? `${Math.round(stats.average_temperature)}°C` : '--'}
              </Text>
              <Text style={styles.statLabel}>Temp</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="analytics" size={24} color="#34C759" />
              <Text style={styles.statValue}>{stats.record_count}</Text>
              <Text style={styles.statLabel}>Registros</Text>
            </View>
          </View>
        )}

        {/* Records List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Registros Recentes</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
          {records.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="pulse-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum registro encontrado</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.emptyButtonText}>Adicionar Primeiro Registro</Text>
              </TouchableOpacity>
            </View>
          ) : (
            records.map((record) => (
              <View key={record.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordDate}>{formatDate(record.measured_at)}</Text>
                </View>
                <View style={styles.recordMetrics}>
                  {record.heart_rate && (
                    <View style={styles.metricItem}>
                      <Ionicons name="pulse" size={20} color={getStatusColor(record.heart_rate, { min: 60, max: 100 })} />
                      <Text style={styles.metricLabel}>Frequência Cardíaca</Text>
                      <Text style={[styles.metricValue, { color: getStatusColor(record.heart_rate, { min: 60, max: 100 }) }]}>
                        {record.heart_rate} bpm
                      </Text>
                    </View>
                  )}
                  {record.systolic_bp && record.diastolic_bp && (
                    <View style={styles.metricItem}>
                      <Ionicons name="water" size={20} color={getStatusColor(record.systolic_bp, { min: 90, max: 140 })} />
                      <Text style={styles.metricLabel}>Pressão Arterial</Text>
                      <Text style={[styles.metricValue, { color: getStatusColor(record.systolic_bp, { min: 90, max: 140 }) }]}>
                        {record.systolic_bp}/{record.diastolic_bp} mmHg
                      </Text>
                    </View>
                  )}
                  {record.temperature && (
                    <View style={styles.metricItem}>
                      <Ionicons name="thermometer" size={20} color={getStatusColor(record.temperature, { min: 36, max: 37.5 })} />
                      <Text style={styles.metricLabel}>Temperatura</Text>
                      <Text style={[styles.metricValue, { color: getStatusColor(record.temperature, { min: 36, max: 37.5 }) }]}>
                        {record.temperature.toFixed(1)}°C
                      </Text>
                    </View>
                  )}
                  {record.oxygen_saturation && (
                    <View style={styles.metricItem}>
                      <Ionicons name="air" size={20} color={getStatusColor(record.oxygen_saturation, { min: 95, max: 100 })} />
                      <Text style={styles.metricLabel}>Saturação O2</Text>
                      <Text style={[styles.metricValue, { color: getStatusColor(record.oxygen_saturation, { min: 95, max: 100 }) }]}>
                        {record.oxygen_saturation}%
                      </Text>
                    </View>
                  )}
                  {record.weight && (
                    <View style={styles.metricItem}>
                      <Ionicons name="scale" size={20} color="#007AFF" />
                      <Text style={styles.metricLabel}>Peso</Text>
                      <Text style={styles.metricValue}>{record.weight} kg</Text>
                    </View>
                  )}
                </View>
                {record.notes && (
                  <Text style={styles.recordNotes}>{record.notes}</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Record Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Sinais Vitais</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Pressão Sistólica (mmHg)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.systolic_bp}
                  onChangeText={(text) => setFormData({ ...formData, systolic_bp: text })}
                  keyboardType="numeric"
                  placeholder="Ex: 120"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Pressão Diastólica (mmHg)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.diastolic_bp}
                  onChangeText={(text) => setFormData({ ...formData, diastolic_bp: text })}
                  keyboardType="numeric"
                  placeholder="Ex: 80"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Frequência Cardíaca (bpm)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.heart_rate}
                  onChangeText={(text) => setFormData({ ...formData, heart_rate: text })}
                  keyboardType="numeric"
                  placeholder="Ex: 72"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Temperatura (°C)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.temperature}
                  onChangeText={(text) => setFormData({ ...formData, temperature: text })}
                  keyboardType="decimal-pad"
                  placeholder="Ex: 36.5"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Saturação de Oxigênio (%)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.oxygen_saturation}
                  onChangeText={(text) => setFormData({ ...formData, oxygen_saturation: text })}
                  keyboardType="numeric"
                  placeholder="Ex: 98"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Frequência Respiratória (rpm)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.respiratory_rate}
                  onChangeText={(text) => setFormData({ ...formData, respiratory_rate: text })}
                  keyboardType="numeric"
                  placeholder="Ex: 16"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Peso (kg)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.weight}
                  onChangeText={(text) => setFormData({ ...formData, weight: text })}
                  keyboardType="decimal-pad"
                  placeholder="Ex: 70.5"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Altura (cm)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.height}
                  onChangeText={(text) => setFormData({ ...formData, height: text })}
                  keyboardType="numeric"
                  placeholder="Ex: 175"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Observações</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  multiline
                  numberOfLines={3}
                  placeholder="Observações adicionais..."
                />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalButtonTextSave}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
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
    fontSize: 20,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 12,
  },
  recordDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  recordMetrics: {
    gap: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  recordNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonSave: {
    backgroundColor: '#007AFF',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default TelemetryScreen;
