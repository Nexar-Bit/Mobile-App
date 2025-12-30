import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import apiService from '../services/api';

const ProfileScreen = ({ navigation }: any) => {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMyRecordsSummary();
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'person-circle-sharp',
      title: 'Informações Pessoais',
      subtitle: 'Ver e editar seu perfil',
      onPress: () => Alert.alert('Em breve', 'Esta funcionalidade estará disponível em breve'),
    },
    {
      icon: 'medical-sharp',
      title: 'Prescrições',
      subtitle: 'Ver suas prescrições médicas',
      onPress: () => navigation.navigate('Medications'),
    },
    {
      icon: 'analytics-sharp',
      title: 'Resultados de Exames',
      subtitle: 'Acessar seus exames',
      onPress: () => navigation.navigate('Metrics'),
    },
    {
      icon: 'heart-sharp',
      title: 'Resumo de Saúde',
      subtitle: 'Métricas e informações de saúde',
      onPress: () => navigation.navigate('HealthHub'),
    },
    {
      icon: 'notifications-sharp',
      title: 'Notificações',
      subtitle: 'Gerenciar preferências de notificação',
      onPress: () => Alert.alert('Em breve', 'Esta funcionalidade estará disponível em breve'),
    },
    {
      icon: 'settings-sharp',
      title: 'Configurações',
      subtitle: 'Preferências e configurações do app',
      onPress: () => Alert.alert('Em breve', 'Esta funcionalidade estará disponível em breve'),
    },
    {
      icon: 'help-circle-sharp',
      title: 'Ajuda e Suporte',
      subtitle: 'Obter ajuda e contatar suporte',
      onPress: () => Alert.alert('Em breve', 'Esta funcionalidade estará disponível em breve'),
    },
    {
      icon: 'information-circle-sharp',
      title: 'Sobre',
      subtitle: 'Versão e informações do app',
      onPress: () => Alert.alert('Sobre', 'Prontivus Patient Mobile App\nVersão 1.0.0'),
    },
  ];

  const renderMenuItem = (item: typeof menuItems[0], index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.menuItem}
      onPress={item.onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuItemIcon}>
          <Ionicons name={item.icon as any} size={24} color="#007AFF" />
        </View>
        <View style={styles.menuItemText}>
          <Text style={styles.menuItemTitle}>{item.title}</Text>
          <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward-outline" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  if (loading && !profile) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={40} color="white" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <Text style={styles.profileRole}>
            {user?.role === 'patient' ? 'Paciente' : user?.role}
          </Text>
        </View>
      </View>

      {/* Health Summary */}
      {profile && (
        <View style={styles.healthSummary}>
          <Text style={styles.healthSummaryTitle}>Informações de Saúde</Text>
          {profile.allergies && (
            <View style={styles.healthItem}>
              <Ionicons name="warning" size={20} color="#FF9500" />
              <Text style={styles.healthItemText}>Alergias: {profile.allergies}</Text>
            </View>
          )}
          {profile.blood_type && (
            <View style={styles.healthItem}>
              <Ionicons name="water" size={20} color="#007AFF" />
              <Text style={styles.healthItemText}>Tipo Sanguíneo: {profile.blood_type}</Text>
            </View>
          )}
        </View>
      )}

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map(renderMenuItem)}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        <Text style={styles.logoutButtonText}>Sair</Text>
      </TouchableOpacity>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>Prontivus Patient Mobile</Text>
        <Text style={styles.appInfoVersion}>Versão 1.0.0</Text>
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
  profileHeader: {
    backgroundColor: 'white',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  healthSummary: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  healthSummaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthItemText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  menuContainer: {
    backgroundColor: 'white',
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
  },
  appInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  appInfoVersion: {
    fontSize: 12,
    color: '#999',
  },
});

export default ProfileScreen;
