import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { Patient } from '../types';

interface PatientQuickLookupProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onSwipeLeft?: (patient: Patient) => void;
  onSwipeRight?: (patient: Patient) => void;
  loading?: boolean;
}

export const PatientQuickLookup: React.FC<PatientQuickLookupProps> = ({
  patients,
  onSelectPatient,
  onSwipeLeft,
  onSwipeRight,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = patients.filter((patient) => {
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || patient.cpf?.includes(query);
  });

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const renderSwipeLeftActions = (patient: Patient) => {
    return (
      <View style={styles.swipeActionContainer}>
        <TouchableOpacity
          style={[styles.swipeAction, styles.swipeActionLeft]}
          onPress={() => onSwipeLeft?.(patient)}
        >
          <Ionicons name="call" size={24} color="#FFFFFF" />
          <Text style={styles.swipeActionText}>Ligar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSwipeRightActions = (patient: Patient) => {
    return (
      <View style={styles.swipeActionContainer}>
        <TouchableOpacity
          style={[styles.swipeAction, styles.swipeActionRight]}
          onPress={() => onSwipeRight?.(patient)}
        >
          <Ionicons name="medical" size={24} color="#FFFFFF" />
          <Text style={styles.swipeActionText}>Prontuário</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPatientCard = ({ item: patient }: { item: Patient }) => {
    return (
      <Swipeable
        renderLeftActions={() => renderSwipeLeftActions(patient)}
        renderRightActions={() => renderSwipeRightActions(patient)}
        overshootLeft={false}
        overshootRight={false}
      >
        <TouchableOpacity
          style={styles.patientCard}
          onPress={() => onSelectPatient(patient)}
          activeOpacity={0.7}
        >
          <View style={styles.patientAvatar}>
            {patient.photo ? (
              <Image source={{ uri: patient.photo }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={32} color="#0F4C75" />
              </View>
            )}
            {patient.allergies && (
              <View style={styles.alertBadge}>
                <Ionicons name="warning" size={16} color="#FFFFFF" />
              </View>
            )}
          </View>

          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>
              {patient.first_name} {patient.last_name}
            </Text>
            <View style={styles.patientMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.metaText}>
                  {calculateAge(patient.date_of_birth)} anos
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="male-female-outline" size={14} color="#666" />
                <Text style={styles.metaText}>
                  {patient.gender?.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            {patient.active_problems && (
              <View style={styles.problemsBadge}>
                <Ionicons name="medical" size={12} color="#FF3B30" />
                <Text style={styles.problemsText}>
                  {patient.active_problems.split(',').length} condições
                </Text>
              </View>
            )}
          </View>

          <View style={styles.patientActions}>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar paciente..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F4C75" />
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          renderItem={renderPatientCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'Nenhum paciente encontrado' : 'Nenhum paciente'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  patientCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 88,
  },
  patientAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F0F0',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F0F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  patientMeta: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  problemsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4F4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  problemsText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 4,
    fontWeight: '500',
  },
  patientActions: {
    marginLeft: 8,
  },
  swipeActionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  swipeAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  swipeActionLeft: {
    backgroundColor: '#34C759',
  },
  swipeActionRight: {
    backgroundColor: '#0F4C75',
  },
  swipeActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
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
  },
});

