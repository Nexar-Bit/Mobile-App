import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';
import { Appointment, Patient } from '../types';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles/theme';

interface PatientListItem {
  id: number;
  name: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

const PatientsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientListItem[]>([]);

  const loadData = async () => {
    try {
      // TODO: Load actual patient data from API
      // For now using mock data based on the image
      const mockPatients: PatientListItem[] = [
        {
          id: 1,
          name: 'Ana Souza',
          date: '10/04/2024',
          time: '14:00',
          status: 'scheduled',
        },
        {
          id: 2,
          name: 'Marcos Lima',
          date: '10/04/2024',
          time: '15:00',
          status: 'completed',
        },
        {
          id: 3,
          name: 'Fernanda Oliveira',
          date: '08/04/2024',
          time: '09:30',
          status: 'scheduled',
        },
        {
          id: 4,
          name: 'Luiz Santos',
          date: '08/04/2024',
          time: '11:00',
          status: 'scheduled',
        },
        {
          id: 5,
          name: 'Marcos Lima',
          date: '08/04/2024',
          time: '15:00',
          status: 'completed',
        },
      ];
      
      setPatients(mockPatients);
      setFilteredPatients(mockPatients);
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.date.includes(searchQuery)
      );
      setFilteredPatients(filtered);
    }
  }, [searchQuery, patients]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return Colors.success;
      case 'completed':
        return Colors.info;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.gray500;
    }
  };

  const renderPatientItem = ({ item }: { item: PatientListItem }) => {
    // Group by date
    const isFirstOfDate =
      filteredPatients.findIndex((p) => p.date === item.date) ===
      filteredPatients.findIndex((p) => p.id === item.id);

    return (
      <View>
        {isFirstOfDate && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.patientItem}
          activeOpacity={0.7}
          onPress={() => {
            // Navigate to patient detail
            // navigation.navigate('PatientDetail', { patientId: item.id });
          }}
        >
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{item.name}</Text>
            <Text style={styles.patientTime}>{item.time}</Text>
          </View>
          <View style={styles.patientStatus}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Group patients by date for display
  const groupedPatients = filteredPatients.sort((a, b) => {
    const dateA = new Date(a.date.split('/').reverse().join('-'));
    const dateB = new Date(b.date.split('/').reverse().join('-'));
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <View style={styles.container}>
      {/* Header with Logo and Title */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image 
            source={require('../../assets/Logo/Logotipo em Fundo Transparente.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Prontivus</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar paciente"
            placeholderTextColor={Colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* List Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>Pacientes</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.sortText}>Estado></Text>
        </TouchableOpacity>
      </View>

      {/* Patient List */}
      <FlatList
        data={groupedPatients}
        renderItem={renderPatientItem}
        keyExtractor={(item) => `${item.id}-${item.date}-${item.time}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={Colors.gray300} />
            <Text style={styles.emptyText}>Nenhum paciente encontrado</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray700,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.gray900,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  listHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray900,
  },
  sortText: {
    fontSize: 14,
    color: Colors.gray600,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  dateHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.gray50,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray700,
  },
  patientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  patientTime: {
    fontSize: 14,
    color: Colors.gray600,
  },
  patientStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray400,
    marginTop: Spacing.md,
  },
});

export default PatientsScreen;

