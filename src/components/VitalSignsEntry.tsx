import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VitalSigns {
  systolic: string;
  diastolic: string;
  heartRate: string;
  respiratoryRate: string;
  temperature: string;
  oxygenSaturation: string;
  weight: string;
  height: string;
}

interface VitalSignsEntryProps {
  patientId: number;
  patientName: string;
  onSubmit: (vitals: VitalSigns) => void;
  onCancel?: () => void;
  initialValues?: Partial<VitalSigns>;
}

export const VitalSignsEntry: React.FC<VitalSignsEntryProps> = ({
  patientId,
  patientName,
  onSubmit,
  onCancel,
  initialValues = {},
}) => {
  const [vitals, setVitals] = useState<VitalSigns>({
    systolic: initialValues.systolic || '',
    diastolic: initialValues.diastolic || '',
    heartRate: initialValues.heartRate || '',
    respiratoryRate: initialValues.respiratoryRate || '',
    temperature: initialValues.temperature || '',
    oxygenSaturation: initialValues.oxygenSaturation || '',
    weight: initialValues.weight || '',
    height: initialValues.height || '',
  });

  const [focusField, setFocusField] = useState<string | null>(null);

  const updateVital = (field: keyof VitalSigns, value: string) => {
    setVitals((prev) => ({ ...prev, [field]: value }));
  };

  const validateAndSubmit = () => {
    // Basic validation
    const required = ['systolic', 'diastolic', 'heartRate', 'respiratoryRate', 'temperature'];
    const missing = required.filter((field) => !vitals[field as keyof VitalSigns]);
    
    if (missing.length > 0) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha todos os sinais vitais principais.');
      return;
    }

    // Validate ranges
    const sys = parseFloat(vitals.systolic);
    const dia = parseFloat(vitals.diastolic);
    const hr = parseFloat(vitals.heartRate);
    const temp = parseFloat(vitals.temperature);

    if (sys > 250 || sys < 50) {
      Alert.alert('Valor Inválido', 'Pressão sistólica deve estar entre 50 e 250 mmHg');
      return;
    }
    if (dia > 150 || dia < 30) {
      Alert.alert('Valor Inválido', 'Pressão diastólica deve estar entre 30 e 150 mmHg');
      return;
    }
    if (hr > 200 || hr < 30) {
      Alert.alert('Valor Inválido', 'Frequência cardíaca deve estar entre 30 e 200 bpm');
      return;
    }
    if (temp > 45 || temp < 30) {
      Alert.alert('Valor Inválido', 'Temperatura deve estar entre 30°C e 45°C');
      return;
    }

    onSubmit(vitals);
  };

  const getStatusColor = (field: keyof VitalSigns, value: string): string => {
    const numValue = parseFloat(value);
    if (!numValue) return '#E5E5E5';

    switch (field) {
      case 'systolic':
        if (numValue > 140) return '#FF3B30';
        if (numValue < 90) return '#FF9500';
        return '#34C759';
      case 'diastolic':
        if (numValue > 90) return '#FF3B30';
        if (numValue < 60) return '#FF9500';
        return '#34C759';
      case 'heartRate':
        if (numValue > 100 || numValue < 60) return '#FF9500';
        return '#34C759';
      case 'temperature':
        if (numValue > 37.5 || numValue < 36.0) return '#FF3B30';
        return '#34C759';
      case 'oxygenSaturation':
        if (numValue < 95) return '#FF3B30';
        if (numValue < 97) return '#FF9500';
        return '#34C759';
      default:
        return '#E5E5E5';
    }
  };

  const VitalInputField: React.FC<{
    label: string;
    field: keyof VitalSigns;
    unit: string;
    icon: string;
    placeholder?: string;
    keyboardType?: 'numeric' | 'default';
  }> = ({ label, field, unit, icon, placeholder, keyboardType = 'numeric' }) => {
    const isFocused = focusField === field;
    const statusColor = getStatusColor(field, vitals[field]);

    return (
      <View style={styles.vitalField}>
        <View style={styles.fieldHeader}>
          <View style={styles.fieldIconContainer}>
            <Ionicons name={icon as any} size={20} color="#0F4C75" />
          </View>
          <Text style={styles.fieldLabel}>{label}</Text>
          {vitals[field] && (
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
          )}
        </View>
        <View style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          { borderColor: vitals[field] ? statusColor : '#E5E5E5' },
        ]}>
          <TextInput
            style={styles.input}
            value={vitals[field]}
            onChangeText={(value) => updateVital(field, value)}
            placeholder={placeholder || '0'}
            placeholderTextColor="#999"
            keyboardType={keyboardType}
            onFocus={() => setFocusField(field)}
            onBlur={() => setFocusField(null)}
          />
          <Text style={styles.unit}>{unit}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sinais Vitais</Text>
        <Text style={styles.headerSubtitle}>{patientName}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pressão Arterial</Text>
          <View style={styles.bloodPressureRow}>
            <View style={styles.bpInputContainer}>
              <VitalInputField
                label="Sistólica"
                field="systolic"
                unit="mmHg"
                icon="water"
                placeholder="120"
              />
            </View>
            <Text style={styles.bpSeparator}>/</Text>
            <View style={styles.bpInputContainer}>
              <VitalInputField
                label="Diastólica"
                field="diastolic"
                unit="mmHg"
                placeholder="80"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cardiovascular</Text>
          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <VitalInputField
                label="Frequência Cardíaca"
                field="heartRate"
                unit="bpm"
                icon="heart"
                placeholder="72"
              />
            </View>
            <View style={styles.gridItem}>
              <VitalInputField
                label="Sat. O2"
                field="oxygenSaturation"
                unit="%"
                icon="pulse"
                placeholder="98"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Respiratória</Text>
          <VitalInputField
            label="Frequência Respiratória"
            field="respiratoryRate"
            unit="rpm"
            icon="air"
            placeholder="16"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Temperatura</Text>
          <VitalInputField
            label="Temperatura Corporal"
            field="temperature"
            unit="°C"
            icon="thermometer"
            placeholder="36.5"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Antropometria</Text>
          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <VitalInputField
                label="Peso"
                field="weight"
                unit="kg"
                icon="scale"
                placeholder="70"
              />
            </View>
            <View style={styles.gridItem}>
              <VitalInputField
                label="Altura"
                field="height"
                unit="cm"
                icon="resize"
                placeholder="170"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        {onCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={validateAndSubmit}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>Salvar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#0F4C75',
    padding: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8F0F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  vitalField: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F0F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 64,
  },
  inputContainerFocused: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F4C75',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  unit: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  bloodPressureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bpInputContainer: {
    flex: 1,
  },
  bpSeparator: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    marginHorizontal: 16,
    marginTop: 24,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#0F4C75',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

