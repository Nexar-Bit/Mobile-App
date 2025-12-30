import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../styles/theme';

const RegisterScreen = () => {
  const { setUser } = useAuthStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    try {
      setLoading(true);
      const res = await apiService.register({ first_name: firstName, last_name: lastName, email, password });
      setUser(res.user);
    } catch (e: any) {
      Alert.alert('Falha no registro', e?.response?.data?.detail || e?.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <Image 
              source={require('../../assets/Logo/Logotipo em Fundo Transparente.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.logoText}>Prontivus</Text>
          <Text style={styles.subtitle}>Criar Conta</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>Criar sua conta</Text>
            <Text style={styles.description}>
              Preencha os dados abaixo para começar
            </Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              <Ionicons name="person" size={14} color={Colors.primary} /> Nome
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={22} color={Colors.gray400} style={styles.inputIcon} />
              <TextInput 
                placeholder="Digite seu nome" 
                placeholderTextColor={Colors.gray400}
                value={firstName} 
                onChangeText={setFirstName} 
                style={styles.input}
                editable={!loading}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              <Ionicons name="person" size={14} color={Colors.primary} /> Sobrenome
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={22} color={Colors.gray400} style={styles.inputIcon} />
              <TextInput 
                placeholder="Digite seu sobrenome" 
                placeholderTextColor={Colors.gray400}
                value={lastName} 
                onChangeText={setLastName} 
                style={styles.input}
                editable={!loading}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              <Ionicons name="mail" size={14} color={Colors.primary} /> Email
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={22} color={Colors.gray400} style={styles.inputIcon} />
              <TextInput 
                placeholder="Digite seu email" 
                placeholderTextColor={Colors.gray400}
                keyboardType="email-address" 
                autoCapitalize="none" 
                value={email} 
                onChangeText={setEmail} 
                style={styles.input}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              <Ionicons name="lock-closed" size={14} color={Colors.primary} /> Senha
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={22} color={Colors.gray400} style={styles.inputIcon} />
              <TextInput 
                placeholder="Digite sua senha" 
                placeholderTextColor={Colors.gray400}
                secureTextEntry 
                value={password} 
                onChangeText={setPassword} 
                style={styles.input}
                editable={!loading}
              />
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={onRegister} 
            disabled={loading} 
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Text style={styles.registerButtonText}>Criar Conta</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.white} style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  logoText: {
    ...Typography.h1,
    color: Colors.primary,
    marginTop: Spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.gray500,
    marginTop: Spacing.xs,
  },
  formContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  headerSection: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    color: Colors.gray900,
  },
  description: {
    ...Typography.body,
    textAlign: 'center',
    color: Colors.gray600,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.label,
    color: Colors.gray700,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray50,
    minHeight: 52,
  },
  inputIcon: {
    marginLeft: Spacing.md,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.gray900,
  },
  registerButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: Spacing.md,
    minHeight: 52,
    ...Shadows.sm,
  },
  registerButtonDisabled: {
    backgroundColor: Colors.gray300,
    opacity: 0.6,
  },
  registerButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
    fontSize: 17,
  },
});

export default RegisterScreen;
