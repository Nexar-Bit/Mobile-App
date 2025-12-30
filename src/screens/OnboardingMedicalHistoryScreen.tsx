import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';
import { Colors, Spacing, BorderRadius } from '../styles/theme';

const OnboardingMedicalHistoryScreen = ({ navigation }: any) => {
  const [conditions, setConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [loading, setLoading] = useState(false);

  const onNext = async () => {
    try {
      setLoading(true);
      await apiService.saveMedicalHistory({
        conditions: conditions.trim() || undefined,
        allergies: allergies.trim() || undefined,
        medications: medications.trim() || undefined,
      });
      Alert.alert('Sucesso', 'Histórico médico salvo com sucesso.');
      navigation.navigate('OnboardingInsurance');
    } catch (error: any) {
      console.error('Failed to save medical history:', error);
      Alert.alert(
        'Erro',
        error?.response?.data?.detail || error?.message || 'Falha ao salvar histórico médico. Tente novamente.'
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
        <Text style={styles.title}>Histórico Médico</Text>
        <Text style={styles.subtitle}>Ajude-nos a conhecer melhor sua saúde</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Condições Médicas</Text>
          <Text style={styles.labelHint}>Liste quaisquer condições médicas que você tenha (ex: diabetes, hipertensão)</Text>
          <TextInput
            value={conditions}
            onChangeText={setConditions}
            multiline
            numberOfLines={4}
            style={styles.textArea}
            placeholder="Ex: Diabetes tipo 2, Hipertensão arterial"
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Alergias</Text>
          <Text style={styles.labelHint}>Liste todas as alergias conhecidas (medicamentos, alimentos, etc.)</Text>
          <TextInput
            value={allergies}
            onChangeText={setAllergies}
            multiline
            numberOfLines={4}
            style={styles.textArea}
            placeholder="Ex: Penicilina, Amendoim"
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Medicamentos Atuais</Text>
          <Text style={styles.labelHint}>Liste os medicamentos que você está tomando atualmente</Text>
          <TextInput
            value={medications}
            onChangeText={setMedications}
            multiline
            numberOfLines={4}
            style={styles.textArea}
            placeholder="Ex: Metformina 500mg, 2x ao dia"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          onPress={onNext}
          disabled={loading}
          style={[styles.button, loading && styles.buttonDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('OnboardingInsurance')}
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
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    fontSize: 16,
    backgroundColor: 'white',
    textAlignVertical: 'top',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
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

export default OnboardingMedicalHistoryScreen;
