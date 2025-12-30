import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';

const HealthHubScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<any>(null);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      const data = await apiService.getMyHealthMetrics();
      setHealthData(data);
    } catch (error) {
      console.error('Failed to load health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const healthTools = [
    {
      icon: 'medical-outline',
      title: 'Prescrições',
      subtitle: 'Ver suas prescrições médicas',
      color: '#34C759',
      onPress: () => navigation.navigate('Medications'),
    },
    {
      icon: 'flask-outline',
      title: 'Resultados de Exames',
      subtitle: 'Acessar seus exames laboratoriais',
      color: '#007AFF',
      onPress: () => navigation.navigate('Metrics'),
    },
    {
      icon: 'pulse-outline',
      title: 'Verificador de Sintomas',
      subtitle: 'Avaliar seus sintomas',
      color: '#FF9500',
      onPress: () => navigation.navigate('SymptomChecker'),
    },
    {
      icon: 'heart-outline',
      title: 'Métricas de Saúde',
      subtitle: 'Acompanhar sua saúde',
      color: '#FF3B30',
      onPress: () => navigation.navigate('Metrics'),
    },
  ];

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="heart" size={48} color="#007AFF" />
        <Text style={styles.title}>Centro de Saúde</Text>
        <Text style={styles.subtitle}>Gerencie sua saúde em um só lugar</Text>
      </View>

      {/* Health Summary */}
      {healthData && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumo de Saúde</Text>
          {healthData.allergies && (
            <View style={styles.summaryItem}>
              <Ionicons name="warning" size={20} color="#FF9500" />
              <Text style={styles.summaryText}>Alergias: {healthData.allergies}</Text>
            </View>
          )}
          {healthData.blood_type && (
            <View style={styles.summaryItem}>
              <Ionicons name="water" size={20} color="#007AFF" />
              <Text style={styles.summaryText}>Tipo Sanguíneo: {healthData.blood_type}</Text>
            </View>
          )}
          {healthData.active_problems && (
            <View style={styles.summaryItem}>
              <Ionicons name="medical" size={20} color="#FF3B30" />
              <Text style={styles.summaryText}>Problemas Ativos: {healthData.active_problems}</Text>
            </View>
          )}
        </View>
      )}

      {/* Health Tools */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ferramentas de Saúde</Text>
        {healthTools.map((tool, index) => (
          <TouchableOpacity
            key={index}
            style={styles.toolCard}
            onPress={tool.onPress}
          >
            <View style={[styles.toolIcon, { backgroundColor: tool.color + '20' }]}>
              <Ionicons name={tool.icon as any} size={28} color={tool.color} />
            </View>
            <View style={styles.toolContent}>
              <Text style={styles.toolTitle}>{tool.title}</Text>
              <Text style={styles.toolSubtitle}>{tool.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>Dicas de Saúde</Text>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark-circle" size={20} color="#34C759" />
          <Text style={styles.tipText}>
            Mantenha suas informações médicas atualizadas
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark-circle" size={20} color="#34C759" />
          <Text style={styles.tipText}>
            Verifique regularmente seus resultados de exames
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark-circle" size={20} color="#34C759" />
          <Text style={styles.tipText}>
            Siga as prescrições médicas conforme indicado
          </Text>
        </View>
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
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
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
    marginTop: 4,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  toolIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  toolContent: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  toolSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  tipsCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default HealthHubScreen;
