import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/api';
import { Colors, Spacing, BorderRadius } from '../styles/theme';

const OnboardingInsuranceScreen = ({ navigation }: any) => {
  const [provider, setProvider] = useState('');
  const [memberId, setMemberId] = useState('');
  const [groupNumber, setGroupNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const onFinish = async () => {
    try {
      setLoading(true);
      // Save insurance information to API
      await apiService.saveInsuranceInfo({
        provider: provider.trim() || undefined,
        member_id: memberId.trim() || undefined,
        group_number: groupNumber.trim() || undefined,
      });
      
      // Mark onboarding as complete
      await AsyncStorage.setItem('onboarding_done', '1');
      
      Alert.alert('Sucesso', 'Informações de seguro salvas com sucesso.');
      navigation.replace('Main');
    } catch (error: any) {
      console.error('Failed to save insurance info:', error);
      Alert.alert(
        'Erro',
        error?.response?.data?.detail || error?.message || 'Falha ao salvar informações de seguro. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/Logo/Logotipo em Fundo Transparente.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.title}>Informações de Seguro</Text>
        <Text style={styles.subtitle}>Complete seu perfil com informações de seguro</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Seguradora</Text>
          <Text style={styles.labelHint}>Nome da sua seguradora ou plano de saúde</Text>
          <TextInput
            value={provider}
            onChangeText={setProvider}
            style={styles.input}
            placeholder="Ex: Unimed, Amil, Bradesco Saúde"
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Número do Cartão</Text>
          <Text style={styles.labelHint}>Número do seu cartão de beneficiário</Text>
          <TextInput
            value={memberId}
            onChangeText={setMemberId}
            style={styles.input}
            placeholder="Ex: 123456789"
            keyboardType="numeric"
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Número do Grupo</Text>
          <Text style={styles.labelHint}>Número do grupo do seu plano (se aplicável)</Text>
          <TextInput
            value={groupNumber}
            onChangeText={setGroupNumber}
            style={styles.input}
            placeholder="Ex: 001234"
            keyboardType="numeric"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          onPress={onFinish}
          disabled={loading}
          style={[styles.button, loading && styles.buttonDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Finalizar</Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            await AsyncStorage.setItem('onboarding_done', '1');
            navigation.replace('Main');
          }}
          disabled={loading}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Pular esta etapa</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  labelHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'white',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 12,
  },
  skipText: {
    color: '#666',
    fontSize: 16,
  },
});

export default OnboardingInsuranceScreen;
