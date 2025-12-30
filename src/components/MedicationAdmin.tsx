import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  scheduledTime: string;
  administered?: boolean;
  administeredAt?: string;
  administeredBy?: string;
  notes?: string;
}

interface MedicationAdminProps {
  patientId: number;
  patientName: string;
  medications: Medication[];
  onAdminister: (medicationId: string, notes?: string) => void;
}

export const MedicationAdmin: React.FC<MedicationAdminProps> = ({
  patientId,
  patientName,
  medications,
  onAdminister,
}) => {
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [notes, setNotes] = useState('');
  const [showModal, setShowModal] = useState(false);

  const pendingMeds = medications.filter((m) => !m.administered);
  const completedMeds = medications.filter((m) => m.administered);

  const handleAdministerPress = (med: Medication) => {
    setSelectedMed(med);
    setNotes('');
    setShowModal(true);
  };

  const confirmAdminister = () => {
    if (!selectedMed) return;

    Alert.alert(
      'Confirmar Administração',
      `Confirmar administração de ${selectedMed.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: () => {
            onAdminister(selectedMed.id, notes);
            setShowModal(false);
            setSelectedMed(null);
            setNotes('');
          },
        },
      ]
    );
  };

  const renderMedicationCard = ({ item }: { item: Medication }) => {
    const isOverdue = !item.administered && new Date(item.scheduledTime) < new Date();
    const isDueSoon =
      !item.administered &&
      new Date(item.scheduledTime) > new Date() &&
      new Date(item.scheduledTime) <= new Date(Date.now() + 30 * 60 * 1000);

    return (
      <TouchableOpacity
        style={[
          styles.medCard,
          item.administered && styles.medCardCompleted,
          isOverdue && !item.administered && styles.medCardOverdue,
          isDueSoon && !item.administered && styles.medCardDueSoon,
        ]}
        onPress={() => !item.administered && handleAdministerPress(item)}
        disabled={item.administered}
        activeOpacity={0.7}
      >
        <View style={styles.medHeader}>
          <View style={styles.medIconContainer}>
            <Ionicons
              name={item.administered ? 'checkmark-circle' : 'medical'}
              size={24}
              color={item.administered ? '#34C759' : isOverdue ? '#FF3B30' : '#0F4C75'}
            />
          </View>
          <View style={styles.medInfo}>
            <Text style={styles.medName}>{item.name}</Text>
            <Text style={styles.medDosage}>{item.dosage}</Text>
          </View>
          {item.administered ? (
            <View style={styles.statusBadgeCompleted}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
          ) : isOverdue ? (
            <View style={styles.statusBadgeOverdue}>
              <Text style={styles.statusBadgeText}>Atrasado</Text>
            </View>
          ) : isDueSoon ? (
            <View style={styles.statusBadgeDueSoon}>
              <Text style={styles.statusBadgeText}>Em breve</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.medDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.detailText}>
              {new Date(item.scheduledTime).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="repeat-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{item.frequency}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="medical-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{item.route}</Text>
          </View>
        </View>

        {item.administered && item.administeredAt && (
          <View style={styles.administeredInfo}>
            <Text style={styles.administeredText}>
              Administrado em {new Date(item.administeredAt).toLocaleString('pt-BR')}
            </Text>
            {item.administeredBy && (
              <Text style={styles.administeredByText}>por {item.administeredBy}</Text>
            )}
          </View>
        )}

        {!item.administered && (
          <TouchableOpacity
            style={[
              styles.administerButton,
              isOverdue && styles.administerButtonOverdue,
            ]}
            onPress={() => handleAdministerPress(item)}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.administerButtonText}>Administrar</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Administração de Medicamentos</Text>
        <Text style={styles.headerSubtitle}>{patientName}</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{pendingMeds.length}</Text>
            <Text style={styles.summaryLabel}>Pendentes</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{completedMeds.length}</Text>
            <Text style={styles.summaryLabel}>Administrados</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={[...pendingMeds, ...completedMeds]}
        renderItem={renderMedicationCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          pendingMeds.length > 0 ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pendentes</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#34C759" />
            <Text style={styles.emptyText}>Todos os medicamentos foram administrados</Text>
          </View>
        }
      />

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirmar Administração</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedMed && (
              <>
                <View style={styles.modalMedInfo}>
                  <Text style={styles.modalMedName}>{selectedMed.name}</Text>
                  <Text style={styles.modalMedDosage}>
                    {selectedMed.dosage} - {selectedMed.route}
                  </Text>
                </View>

                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Observações (opcional)</Text>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="Adicione observações sobre a administração..."
                    placeholderTextColor="#999"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setShowModal(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalConfirmButton}
                    onPress={confirmAdminister}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.modalConfirmText}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#E8F0F6',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  medCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  medCardCompleted: {
    opacity: 0.7,
    backgroundColor: '#F0F9F4',
  },
  medCardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  medCardDueSoon: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  medHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  medIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F0F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  medDosage: {
    fontSize: 14,
    color: '#666',
  },
  statusBadgeCompleted: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeOverdue: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeDueSoon: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  medDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  administeredInfo: {
    backgroundColor: '#F0F9F4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  administeredText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  administeredByText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  administerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F4C75',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  administerButtonOverdue: {
    backgroundColor: '#FF3B30',
  },
  administerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
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
  modalMedInfo: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalMedName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  modalMedDosage: {
    fontSize: 14,
    color: '#666',
  },
  notesContainer: {
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    marginRight: 8,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalConfirmButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#0F4C75',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

