import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';
import { Colors, Spacing, BorderRadius, Shadows, TouchTarget } from '../styles/theme';
import { commonStyles } from '../styles/commonStyles';

interface PersonalNote {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
}

interface HistoryItem {
  appointment_id: number;
  appointment_date: string;
  doctor_name: string;
  appointment_type?: string;
  clinical_record?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
}

const NotesScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<'personal' | 'clinical'>('personal');
  const [showAddNote, setShowAddNote] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load patient profile for notes
      const profile = await apiService.getMyPatientProfile();
      try {
        const parsed = profile.notes ? JSON.parse(profile.notes) : [];
        setNotes(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.warn('Error parsing notes:', error);
        setNotes([]);
      }
      
      // Load appointments for clinical history
      const appointments = await apiService.getMyUpcomingAppointments();
      const historyItems: HistoryItem[] = [];
      
      for (const apt of appointments) {
        try {
          // Try to get clinical record for this appointment
          const records = await apiService.getMyMedicalRecords();
          const record = records.find((r: any) => r.appointment_id === apt.id);
          
          if (record) {
            historyItems.push({
              appointment_id: apt.id,
              appointment_date: apt.scheduled_datetime,
              doctor_name: apt.doctor_name || 'Médico',
              appointment_type: apt.appointment_type,
              clinical_record: {
                subjective: record.subjective,
                objective: record.objective,
                assessment: record.assessment,
                plan: record.plan,
              },
            });
          }
        } catch (error) {
          // Skip if can't load record
        }
      }
      
      setHistory(historyItems);
    } catch (error: any) {
      console.error('Error loading notes:', error);
      Alert.alert('Erro', 'Não foi possível carregar as notas');
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

  const handleSaveNote = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Atenção', 'Preencha título e conteúdo');
      return;
    }

    try {
      setSaving(true);
      const newNote: PersonalNote = {
        id: Date.now().toString(),
        title: newTitle,
        content: newContent,
        created_at: new Date().toISOString(),
      };
      
      const updatedNotes = [...notes, newNote];
      const notesJson = JSON.stringify(updatedNotes);
      
      await apiService.updateMyPatientProfile({ notes: notesJson });
      
      setNotes(updatedNotes);
      setNewTitle('');
      setNewContent('');
      setShowAddNote(false);
      Alert.alert('Sucesso', 'Nota salva com sucesso');
    } catch (error: any) {
      console.error('Error saving note:', error);
      Alert.alert('Erro', 'Não foi possível salvar a nota');
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
    });
  };

  if (loading && notes.length === 0 && history.length === 0) {
    return (
      <View style={commonStyles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>Notas</Text>
        <Text style={commonStyles.headerSubtitle}>Suas notas pessoais e histórico clínico</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'personal' && styles.tabActive]}
          onPress={() => setSelectedTab('personal')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, selectedTab === 'personal' && styles.tabTextActive]}>
            Pessoais
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'clinical' && styles.tabActive]}
          onPress={() => setSelectedTab('clinical')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, selectedTab === 'clinical' && styles.tabTextActive]}>
            Clínicas
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'personal' ? (
          <>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddNote(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-sharp" size={24} color={Colors.primary} />
              <Text style={styles.addButtonText}>Nova Nota</Text>
            </TouchableOpacity>

            {notes.length === 0 ? (
              <View style={commonStyles.emptyContainer}>
                <Ionicons name="document-attach-sharp" size={64} color={Colors.gray300} />
                <Text style={commonStyles.emptyText}>Nenhuma nota pessoal</Text>
              </View>
            ) : (
              notes.map((note) => (
                <View key={note.id} style={commonStyles.card}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteTitle}>{note.title}</Text>
                    <Text style={styles.noteDate}>{formatDate(note.created_at)}</Text>
                  </View>
                  <Text style={styles.noteContent}>{note.content}</Text>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            {history.length === 0 ? (
              <View style={commonStyles.emptyContainer}>
                <Ionicons name="medical-sharp" size={64} color={Colors.gray300} />
                <Text style={commonStyles.emptyText}>Nenhum histórico clínico disponível</Text>
              </View>
            ) : (
              history.map((item) => (
                <View key={item.appointment_id} style={commonStyles.card}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>{formatDate(item.appointment_date)}</Text>
                    <Text style={styles.historyDoctor}>{item.doctor_name}</Text>
                  </View>
                  {item.clinical_record && (
                    <View style={styles.clinicalContent}>
                      {item.clinical_record.subjective && (
                        <View style={styles.clinicalSection}>
                          <Text style={styles.clinicalLabel}>Subjetivo:</Text>
                          <Text style={styles.clinicalText}>{item.clinical_record.subjective}</Text>
                        </View>
                      )}
                      {item.clinical_record.objective && (
                        <View style={styles.clinicalSection}>
                          <Text style={styles.clinicalLabel}>Objetivo:</Text>
                          <Text style={styles.clinicalText}>{item.clinical_record.objective}</Text>
                        </View>
                      )}
                      {item.clinical_record.assessment && (
                        <View style={styles.clinicalSection}>
                          <Text style={styles.clinicalLabel}>Avaliação:</Text>
                          <Text style={styles.clinicalText}>{item.clinical_record.assessment}</Text>
                        </View>
                      )}
                      {item.clinical_record.plan && (
                        <View style={styles.clinicalSection}>
                          <Text style={styles.clinicalLabel}>Plano:</Text>
                          <Text style={styles.clinicalText}>{item.clinical_record.plan}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))
            )}
          </>
        )}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      <Modal
        visible={showAddNote}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddNote(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Nota</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowAddNote(false);
                  setNewTitle('');
                  setNewContent('');
                }}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={Colors.gray600} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={commonStyles.input}
              placeholder="Título"
              placeholderTextColor={Colors.gray400}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={[commonStyles.textArea, { marginTop: Spacing.md }]}
              placeholder="Conteúdo"
              placeholderTextColor={Colors.gray400}
              value={newContent}
              onChangeText={setNewContent}
              multiline
              numberOfLines={6}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={commonStyles.buttonSecondary}
                onPress={() => {
                  setShowAddNote(false);
                  setNewTitle('');
                  setNewContent('');
                }}
                activeOpacity={0.7}
              >
                <Text style={commonStyles.buttonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[commonStyles.button, saving && { opacity: 0.6 }]}
                onPress={handleSaveNote}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={commonStyles.buttonText}>Salvar</Text>
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  tab: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 15,
    color: Colors.gray500,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    minHeight: TouchTarget.minHeight,
  },
  addButtonText: {
    marginLeft: Spacing.sm,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  noteTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.gray900,
    flex: 1,
  },
  noteDate: {
    fontSize: 12,
    color: Colors.gray400,
  },
  noteContent: {
    fontSize: 14,
    color: Colors.gray700,
    lineHeight: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  historyDate: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray900,
  },
  historyDoctor: {
    fontSize: 14,
    color: Colors.gray500,
  },
  clinicalContent: {
    marginTop: Spacing.sm,
  },
  clinicalSection: {
    marginBottom: Spacing.md,
  },
  clinicalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  clinicalText: {
    fontSize: 14,
    color: Colors.gray700,
    lineHeight: 20,
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
    padding: Spacing.md,
    maxHeight: '85%',
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray900,
  },
  closeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});

export default NotesScreen;

