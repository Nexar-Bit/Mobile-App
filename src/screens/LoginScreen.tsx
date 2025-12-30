import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import { useAuthStore } from '../store/authStore';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../styles/theme';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha email e senha');
      return;
    }

    try {
      setIsLoading(true);
      
      // Check network connectivity before attempting login
      let networkAvailable = true;
      try {
        const networkState = await Network.getNetworkStateAsync();
        networkAvailable = networkState.isConnected && networkState.isInternetReachable !== false;
        
        if (!networkAvailable) {
          Alert.alert(
            'Sem Conexão',
            'Verifique sua conexão com a internet e tente novamente.'
          );
          setIsLoading(false);
          return;
        }
      } catch (networkCheckError) {
        // If network check fails, still try to login (might work on some devices)
        console.warn('Network check failed, proceeding with login attempt:', networkCheckError);
      }
      
      await login(email.trim(), password, 'patient');
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Credenciais inválidas. Tente novamente.';
      let errorTitle = 'Falha no Login';
      
      // Handle network errors specifically with more detail
      if (error?.isNetworkError || !error?.response) {
        errorTitle = 'Erro de Conexão';
        
        // Check if error message mentions local server
        const isLocalBackendError = error?.message?.includes('servidor local') || error?.message?.includes('backend está rodando');
        
        if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
          errorMessage = isLocalBackendError 
            ? 'Tempo de conexão esgotado. O servidor local pode estar indisponível. Verifique se o backend está rodando na porta 8000.'
            : 'Tempo de conexão esgotado. O servidor pode estar lento ou indisponível. Tente novamente em alguns instantes.';
        } else if (error?.code === 'ERR_CANCELED') {
          errorMessage = 'Conexão cancelada. Tente novamente.';
        } else if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error') || error?.message?.includes('network')) {
          errorMessage = isLocalBackendError
            ? error?.message || 'Não foi possível conectar ao servidor local. Verifique se o backend está rodando: uvicorn main:app --host 0.0.0.0 --port 8000'
            : 'Erro de conexão. Verifique sua internet e tente novamente. Se o problema persistir, o servidor pode estar temporariamente indisponível.';
        } else {
          errorMessage = error?.message || 'Erro de conexão. Verifique sua internet e tente novamente.';
        }
      } else if (error?.response?.status === 401 || error?.response?.status === 403) {
        errorTitle = 'Falha na Autenticação';
        errorMessage = error?.response?.data?.detail || 'Email ou senha incorretos. Verifique suas credenciais.';
      } else if (error?.response?.status >= 500) {
        errorTitle = 'Erro do Servidor';
        errorMessage = 'O servidor está temporariamente indisponível. Tente novamente em alguns instantes.';
      } else if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setIsLoading(false);
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
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/Logo/Logotipo em Fundo Transparente.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={Colors.gray400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Digite seu email"
              placeholderTextColor={Colors.gray400}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.gray400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Digite sua senha"
              placeholderTextColor={Colors.gray400}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={showPassword ? "eye" : "eye-off"} 
                size={20} 
                color={Colors.gray400} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Entrar</Text>
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
    backgroundColor: Colors.white,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 2,
  },
  logoImage: {
    width: 300,
    height: 300,
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    minHeight: 50,
    marginBottom: Spacing.md,
  },
  inputIcon: {
    marginLeft: Spacing.md,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: Colors.gray900,
  },
  eyeIcon: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    minHeight: 50,
  },
  loginButtonDisabled: {
    backgroundColor: Colors.gray300,
    opacity: 0.6,
  },
  loginButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default LoginScreen;
