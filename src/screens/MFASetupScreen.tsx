import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput, Alert, ScrollView, Image, StyleSheet } from 'react-native';
import apiService from '../services/api';
import { Colors, Spacing, BorderRadius } from '../styles/theme';

const MFASetupScreen = () => {
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState<string[]>([]);
  const [qrUri, setQrUri] = useState<string | undefined>();
  const [secret, setSecret] = useState<string | undefined>();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiService.initiateMFA();
        setMethods(res.methods || []);
        setQrUri(res.qr_uri);
        setSecret(res.secret);
      } catch (e: any) {
        Alert.alert('Erro ao inicializar MFA', e?.response?.data?.detail || e?.message || 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onVerify = async () => {
    try {
      setVerifying(true);
      await apiService.verifyMFA(code);
      Alert.alert('MFA habilitado', 'Autenticação de dois fatores está agora ativa.');
    } catch (e: any) {
      Alert.alert('Verificação falhou', e?.response?.data?.detail || e?.message || 'Erro desconhecido');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <View style={styles.centerContainer}><ActivityIndicator /></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/Logo/Logotipo em Fundo Transparente.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>Proteger sua conta</Text>
      <Text style={styles.subtitle}>Configure autenticação de dois fatores</Text>
      {qrUri ? (
        <View style={styles.section}>
          <Text style={styles.sectionText}>Escaneie este QR no seu aplicativo autenticador:</Text>
          <Text selectable style={styles.codeText}>{qrUri}</Text>
        </View>
      ) : null}
      {secret ? (
        <View style={styles.section}>
          <Text style={styles.sectionText}>Ou digite este código secreto no seu aplicativo:</Text>
          <Text selectable style={styles.codeText}>{secret}</Text>
        </View>
      ) : null}
      <TextInput 
        placeholder="Digite o código de 6 dígitos" 
        keyboardType="number-pad" 
        value={code} 
        onChangeText={setCode} 
        style={styles.input}
        editable={!verifying}
      />
      <TouchableOpacity 
        onPress={onVerify} 
        disabled={verifying || code.length < 6} 
        style={[styles.verifyButton, (verifying || code.length < 6) && styles.verifyButtonDisabled]}
      >
        {verifying ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.verifyButtonText}>Verificar</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default MFASetupScreen;
