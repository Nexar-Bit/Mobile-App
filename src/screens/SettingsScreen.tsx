import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Colors, Spacing, BorderRadius, Shadows, TouchTarget } from '../styles/theme';
import { commonStyles } from '../styles/commonStyles';

const SettingsScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  // Profile settings
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  
  // Privacy settings
  const [profileVisibility, setProfileVisibility] = useState('private');
  const [showOnlineStatus, setShowOnlineStatus] = useState(false);
  
  // Appearance
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('pt-BR');

  const loadSettings = async () => {
    try {
      setLoading(true);
      const patientProfile = await apiService.getMyPatientProfile();
      setProfile(patientProfile);
      
      setFirstName(patientProfile.first_name || '');
      setLastName(patientProfile.last_name || '');
      setEmail(patientProfile.email || user?.email || '');
      setPhone(patientProfile.phone || '');
      setAddress(patientProfile.address || '');
      setBloodType(patientProfile.blood_type || '');
      setAllergies(patientProfile.allergies || '');
    } catch (error: any) {
      console.error('Error loading settings:', error);
      Alert.alert('Erro', 'Não foi possível carregar as configurações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await apiService.updateMyPatientProfile({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        address: address,
        blood_type: bloodType,
        allergies: allergies,
      });
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Erro', 'Não foi possível salvar o perfil');
    } finally {
      setSaving(false);
    }
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  if (loading) {
    return (
      <View style={commonStyles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={commonStyles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>Configurações</Text>
        <Text style={commonStyles.headerSubtitle}>Gerencie suas preferências</Text>
      </View>

      {/* Profile Section */}
      <View style={commonStyles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-circle-sharp" size={20} color={Colors.primary} />
          <Text style={commonStyles.sectionTitle}>Perfil</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.inputGroup}>
            <Text style={commonStyles.label}>Nome</Text>
            <TextInput
              style={commonStyles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Nome"
              placeholderTextColor={Colors.gray400}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={commonStyles.label}>Sobrenome</Text>
            <TextInput
              style={commonStyles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Sobrenome"
              placeholderTextColor={Colors.gray400}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={commonStyles.label}>Email</Text>
            <TextInput
              style={[commonStyles.input, commonStyles.disabledInput]}
              value={email}
              editable={false}
              placeholder="Email"
              placeholderTextColor={Colors.gray400}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={commonStyles.label}>Telefone</Text>
            <TextInput
              style={commonStyles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Telefone"
              placeholderTextColor={Colors.gray400}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={commonStyles.label}>Endereço</Text>
            <TextInput
              style={commonStyles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Endereço"
              placeholderTextColor={Colors.gray400}
              multiline
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={commonStyles.label}>Tipo Sanguíneo</Text>
            <View style={styles.bloodTypeContainer}>
              {bloodTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.bloodTypeButton,
                    bloodType === type && styles.bloodTypeButtonActive,
                  ]}
                  onPress={() => setBloodType(type)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.bloodTypeText,
                      bloodType === type && styles.bloodTypeTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={commonStyles.label}>Alergias</Text>
            <TextInput
              style={[commonStyles.textArea, { height: 80 }]}
              value={allergies}
              onChangeText={setAllergies}
              placeholder="Liste suas alergias"
              placeholderTextColor={Colors.gray400}
              multiline
              numberOfLines={3}
            />
          </View>
          <TouchableOpacity
            style={[commonStyles.button, saving && { opacity: 0.6 }]}
            onPress={handleSaveProfile}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
                <Text style={[commonStyles.buttonText, { marginLeft: Spacing.xs }]}>Salvar Perfil</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={commonStyles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications" size={18} color={Colors.primary} />
          <Text style={commonStyles.sectionTitle}>Notificações</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notificações por Email</Text>
              <Text style={styles.settingDescription}>Receber notificações por email</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: Colors.gray300, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notificações Push</Text>
              <Text style={styles.settingDescription}>Receber notificações no dispositivo</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: Colors.gray300, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Lembretes de Consulta</Text>
              <Text style={styles.settingDescription}>Receber lembretes antes das consultas</Text>
            </View>
            <Switch
              value={appointmentReminders}
              onValueChange={setAppointmentReminders}
              trackColor={{ false: Colors.gray300, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>
      </View>

      {/* Privacy Section */}
      <View style={commonStyles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="lock-closed" size={18} color={Colors.primary} />
          <Text style={commonStyles.sectionTitle}>Privacidade</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Visibilidade do Perfil</Text>
              <Text style={styles.settingDescription}>Quem pode ver seu perfil</Text>
            </View>
            <View style={styles.visibilityButtons}>
              <TouchableOpacity
                style={[
                  styles.visibilityButton,
                  profileVisibility === 'private' && styles.visibilityButtonActive,
                ]}
                onPress={() => setProfileVisibility('private')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.visibilityButtonText,
                    profileVisibility === 'private' && styles.visibilityButtonTextActive,
                  ]}
                >
                  Privado
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.visibilityButton,
                  profileVisibility === 'public' && styles.visibilityButtonActive,
                ]}
                onPress={() => setProfileVisibility('public')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.visibilityButtonText,
                    profileVisibility === 'public' && styles.visibilityButtonTextActive,
                  ]}
                >
                  Público
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Mostrar Status Online</Text>
              <Text style={styles.settingDescription}>Mostrar quando você está online</Text>
            </View>
            <Switch
              value={showOnlineStatus}
              onValueChange={setShowOnlineStatus}
              trackColor={{ false: Colors.gray300, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>
      </View>

      {/* Appearance Section */}
      <View style={commonStyles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="color-palette" size={18} color={Colors.primary} />
          <Text style={commonStyles.sectionTitle}>Aparência</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Tema</Text>
              <Text style={styles.settingDescription}>Escolha o tema do aplicativo</Text>
            </View>
            <View style={styles.themeButtons}>
              <TouchableOpacity
                style={[styles.themeButton, theme === 'light' && styles.themeButtonActive]}
                onPress={() => setTheme('light')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="sunny"
                  size={18}
                  color={theme === 'light' ? Colors.white : Colors.gray500}
                />
                <Text
                  style={[
                    styles.themeButtonText,
                    theme === 'light' && styles.themeButtonTextActive,
                  ]}
                >
                  Claro
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeButton, theme === 'dark' && styles.themeButtonActive]}
                onPress={() => setTheme('dark')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="moon"
                  size={18}
                  color={theme === 'dark' ? Colors.white : Colors.gray500}
                />
                <Text
                  style={[
                    styles.themeButtonText,
                    theme === 'dark' && styles.themeButtonTextActive,
                  ]}
                >
                  Escuro
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.primaryBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  sectionContent: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  bloodTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  bloodTypeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray300,
    backgroundColor: Colors.white,
    minHeight: TouchTarget.minHeight,
    justifyContent: 'center',
  },
  bloodTypeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  bloodTypeText: {
    fontSize: 14,
    color: Colors.gray700,
    fontWeight: '500',
  },
  bloodTypeTextActive: {
    color: Colors.white,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.gray500,
    lineHeight: 18,
  },
  visibilityButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  visibilityButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray300,
    backgroundColor: Colors.white,
    minHeight: TouchTarget.minHeight,
    justifyContent: 'center',
  },
  visibilityButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  visibilityButtonText: {
    fontSize: 14,
    color: Colors.gray700,
    fontWeight: '500',
  },
  visibilityButtonTextActive: {
    color: Colors.white,
  },
  themeButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray300,
    backgroundColor: Colors.white,
    gap: Spacing.xs,
    minHeight: TouchTarget.minHeight,
  },
  themeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  themeButtonText: {
    fontSize: 14,
    color: Colors.gray500,
    fontWeight: '500',
  },
  themeButtonTextActive: {
    color: Colors.white,
  },
});

export default SettingsScreen;

