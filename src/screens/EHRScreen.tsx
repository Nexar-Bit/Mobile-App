import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList, ClinicalRecord } from '../types';
import apiService from '../services/api';

type EHRScreenRouteProp = RouteProp<RootStackParamList, 'EHR'>;

const EHRScreen = () => {
  const route = useRoute<EHRScreenRouteProp>();
  const { appointment } = route.params;
  
  const [clinicalRecord, setClinicalRecord] = useState<ClinicalRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form fields
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState('');
  const [physicalExamination, setPhysicalExamination] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadClinicalRecord();
  }, []);

  const loadClinicalRecord = async () => {
    try {
      setIsLoading(true);
      const record = await apiService.getClinicalRecord(appointment.id);
      
      if (record) {
        setClinicalRecord(record);
        setChiefComplaint(record.chief_complaint || '');
        setHistoryOfPresentIllness(record.history_of_present_illness || '');
        setPhysicalExamination(record.physical_examination || '');
        setAssessment(record.assessment || '');
        setPlan(record.plan || '');
        setNotes(record.notes || '');
      }
    } catch (error) {
      console.error('Error loading clinical record:', error);
      Alert.alert('Erro', 'Falha ao carregar registro clínico');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const recordData = {
        appointment_id: appointment.id,
        chief_complaint: chiefComplaint,
        history_of_present_illness: historyOfPresentIllness,
        physical_examination: physicalExamination,
        assessment: assessment,
        plan: plan,
        notes: notes,
      };

      let savedRecord;
      if (clinicalRecord) {
        savedRecord = await apiService.updateClinicalRecord(clinicalRecord.id, recordData);
      } else {
        savedRecord = await apiService.createClinicalRecord(recordData);
      }

      setClinicalRecord(savedRecord);
      setIsEditing(false);
      Alert.alert('Sucesso', 'Registro clínico salvo com sucesso');
    } catch (error) {
      console.error('Error saving clinical record:', error);
      Alert.alert('Erro', 'Falha ao salvar registro clínico');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (clinicalRecord) {
      setChiefComplaint(clinicalRecord.chief_complaint || '');
      setHistoryOfPresentIllness(clinicalRecord.history_of_present_illness || '');
      setPhysicalExamination(clinicalRecord.physical_examination || '');
      setAssessment(clinicalRecord.assessment || '');
      setPlan(clinicalRecord.plan || '');
      setNotes(clinicalRecord.notes || '');
    } else {
      setChiefComplaint('');
      setHistoryOfPresentIllness('');
      setPhysicalExamination('');
      setAssessment('');
      setPlan('');
      setNotes('');
    }
    setIsEditing(false);
  };

  const renderFormField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    multiline: boolean = false,
    numberOfLines: number = 1
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.multilineInput,
          !isEditing && styles.readOnlyInput
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        editable={isEditing}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando registro clínico...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>
            {appointment.patient?.first_name} {appointment.patient?.last_name}
          </Text>
          <Text style={styles.appointmentTime}>
            {new Date(appointment.scheduled_datetime).toLocaleString('pt-BR')}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {!isEditing ? (
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Ionicons name="create-outline" size={20} color="#007AFF" />
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-outline" size={20} color="white" />
                    <Text style={styles.saveButtonText}>Salvar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Chief Complaint */}
        {renderFormField(
          'Queixa Principal',
          chiefComplaint,
          setChiefComplaint,
          'Digite a queixa principal do paciente...',
          true,
          3
        )}

        {/* History of Present Illness */}
        {renderFormField(
          'História da Doença Atual',
          historyOfPresentIllness,
          setHistoryOfPresentIllness,
          'Descreva a história e progressão da doença atual...',
          true,
          4
        )}

        {/* Physical Examination */}
        {renderFormField(
          'Exame Físico',
          physicalExamination,
          setPhysicalExamination,
          'Registre os achados do exame físico...',
          true,
          4
        )}

        {/* Assessment */}
        {renderFormField(
          'Avaliação',
          assessment,
          setAssessment,
          'Digite sua avaliação clínica e diagnóstico...',
          true,
          3
        )}

        {/* Plan */}
        {renderFormField(
          'Plano',
          plan,
          setPlan,
          'Descreva o plano de tratamento e acompanhamento...',
          true,
          3
        )}

        {/* Notes */}
        {renderFormField(
          'Notas Adicionais',
          notes,
          setNotes,
          'Quaisquer notas ou observações adicionais...',
          true,
          3
        )}

        {/* Record Info */}
        {clinicalRecord && (
          <View style={styles.recordInfo}>
            <Text style={styles.recordInfoTitle}>Informações do Registro</Text>
            <Text style={styles.recordInfoText}>
              Criado em: {new Date(clinicalRecord.created_at).toLocaleString('pt-BR')}
            </Text>
            {clinicalRecord.updated_at && (
              <Text style={styles.recordInfoText}>
                Última atualização: {new Date(clinicalRecord.updated_at).toLocaleString('pt-BR')}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
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
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  multilineInput: {
    minHeight: 80,
  },
  readOnlyInput: {
    backgroundColor: '#f8f9fa',
    color: '#666',
  },
  recordInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    marginTop: 20,
  },
  recordInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recordInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});

export default EHRScreen;
