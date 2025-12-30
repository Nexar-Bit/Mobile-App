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
import { User } from '../types';
import { Colors, Spacing, BorderRadius, Shadows, TouchTarget } from '../styles/theme';
import { commonStyles } from '../styles/commonStyles';

const DoctorsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const doctorsData = await apiService.getDoctors();
      setDoctors(doctorsData);
      setFilteredDoctors(doctorsData);
    } catch (error: any) {
      console.error('Failed to load doctors:', error);
      Alert.alert('Erro', 'Não foi possível carregar a lista de médicos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [searchQuery, doctors]);

  const filterDoctors = () => {
    let filtered = [...doctors];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doctor) =>
          (doctor.first_name?.toLowerCase().includes(query) ||
            doctor.last_name?.toLowerCase().includes(query) ||
            `${doctor.first_name} ${doctor.last_name}`.toLowerCase().includes(query) ||
            doctor.email?.toLowerCase().includes(query))
      );
    }

    setFilteredDoctors(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDoctors();
  };

  const handleViewDetails = (doctor: User) => {
    setSelectedDoctor(doctor);
    setShowDetailModal(true);
  };

  const handleBookAppointment = (doctor: User) => {
    setShowDetailModal(false);
    navigation.navigate('Appointments', { doctorId: doctor.id });
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  if (loading && doctors.length === 0) {
    return (
      <View style={commonStyles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>Médicos</Text>
        <Text style={commonStyles.headerSubtitle}>Encontre seu médico</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.gray400} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar médico..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.gray400}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearchQuery('')}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={18} color={Colors.gray400} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredDoctors.length === 0 ? (
          <View style={commonStyles.emptyContainer}>
            <Ionicons name="people-sharp" size={64} color={Colors.gray300} />
            <Text style={commonStyles.emptyText}>
              {searchQuery ? 'Nenhum médico encontrado' : 'Nenhum médico disponível'}
            </Text>
          </View>
        ) : (
          filteredDoctors.map((doctor) => (
            <TouchableOpacity
              key={doctor.id}
              style={commonStyles.listItem}
              onPress={() => handleViewDetails(doctor)}
              activeOpacity={0.7}
            >
              <View style={styles.doctorAvatar}>
                <Text style={styles.doctorInitials}>
                  {getInitials(doctor.first_name, doctor.last_name)}
                </Text>
              </View>
              <View style={commonStyles.listItemContent}>
                <Text style={commonStyles.listItemTitle}>
                  {doctor.first_name} {doctor.last_name}
                </Text>
                <Text style={commonStyles.listItemSubtitle}>{doctor.email}</Text>
                {doctor.is_active && (
                  <View style={styles.statusBadge}>
                    <Ionicons name="checkmark-circle-sharp" size={14} color={Colors.success} />
                    <Text style={styles.statusText}>Ativo</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward-circle" size={22} color={Colors.gray300} />
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDoctor && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalInitials}>
                      {getInitials(selectedDoctor.first_name, selectedDoctor.last_name)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowDetailModal(false)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle-sharp" size={26} color={Colors.gray500} />
                  </TouchableOpacity>
                </View>
                <ScrollView 
                  style={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.modalName}>
                    {selectedDoctor.first_name} {selectedDoctor.last_name}
                  </Text>
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="mail" size={16} color={Colors.gray500} />
                    <Text style={styles.modalInfoText}>{selectedDoctor.email}</Text>
                  </View>
                  {selectedDoctor.is_active && (
                    <View style={styles.modalStatusBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                      <Text style={styles.modalStatusText}>Médico Ativo</Text>
                    </View>
                  )}
                  {selectedDoctor.is_verified && (
                    <View style={styles.modalStatusBadge}>
                      <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
                      <Text style={styles.modalStatusText}>Verificado</Text>
                    </View>
                  )}
                </ScrollView>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={commonStyles.button}
                    onPress={() => handleBookAppointment(selectedDoctor)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="calendar" size={18} color={Colors.white} />
                    <Text style={[commonStyles.buttonText, { marginLeft: Spacing.xs }]}>Agendar Consulta</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    margin: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    minHeight: TouchTarget.minHeight,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.gray900,
  },
  content: {
    flex: 1,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.success}20`,
    marginTop: Spacing.xs,
  },
  statusText: {
    fontSize: 11,
    color: Colors.success,
    marginLeft: 4,
    fontWeight: '600',
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
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInitials: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  closeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  modalBody: {
    padding: Spacing.md,
  },
  modalName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.gray900,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalInfoText: {
    fontSize: 15,
    color: Colors.gray700,
    marginLeft: Spacing.sm,
  },
  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: `${Colors.success}20`,
    marginTop: Spacing.sm,
  },
  modalStatusText: {
    fontSize: 13,
    color: Colors.success,
    marginLeft: 6,
    fontWeight: '600',
  },
  modalActions: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
});

export default DoctorsScreen;

