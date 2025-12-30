import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';
import { Colors } from '../styles/theme';

interface Invoice {
  id: number;
  issue_date: string;
  due_date?: string;
  status: string;
  total_amount: number;
  patient_name?: string;
  doctor_name?: string;
  invoice_lines?: any[];
  payments?: any[];
}

const BillingScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
  });

  const loadData = async () => {
    try {
      const data = await apiService.getMyInvoices();
      setInvoices(data);
      
      // Calculate stats
      const now = new Date();
      const total = data.reduce((sum: number, inv: Invoice) => sum + inv.total_amount, 0);
      const paid = data
        .filter((inv: Invoice) => inv.status === 'paid')
        .reduce((sum: number, inv: Invoice) => sum + inv.total_amount, 0);
      const pending = data
        .filter((inv: Invoice) => inv.status === 'pending' || inv.status === 'unpaid')
        .reduce((sum: number, inv: Invoice) => sum + inv.total_amount, 0);
      const overdue = data
        .filter((inv: Invoice) => {
          if (!inv.due_date) return false;
          const dueDate = new Date(inv.due_date);
          return (inv.status === 'pending' || inv.status === 'unpaid') && dueDate < now;
        })
        .reduce((sum: number, inv: Invoice) => sum + inv.total_amount, 0);

      setStats({ total, paid, pending, overdue });
    } catch (error) {
      console.error('Failed to load invoices:', error);
      Alert.alert('Erro', 'Não foi possível carregar as faturas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#34C759';
      case 'pending':
      case 'unpaid': return '#FF9500';
      case 'overdue': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'paid': 'Pago',
      'pending': 'Pendente',
      'unpaid': 'Não Pago',
      'overdue': 'Vencido',
      'cancelled': 'Cancelado',
    };
    return statusMap[status] || status;
  };

  const viewInvoiceDetails = async (invoice: Invoice) => {
    try {
      const details = await apiService.getInvoiceDetails(invoice.id);
      setSelectedInvoice(details);
      // In a full implementation, you'd navigate to a detail screen
      Alert.alert(
        'Detalhes da Fatura',
        `Total: ${formatCurrency(details.total_amount)}\n` +
        `Status: ${getStatusText(details.status)}\n` +
        `Data de Emissão: ${formatDate(details.issue_date)}\n` +
        (details.due_date ? `Vencimento: ${formatDate(details.due_date)}` : ''),
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da fatura');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{formatCurrency(stats.total)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#34C75920' }]}>
            <Text style={styles.statLabel}>Pago</Text>
            <Text style={[styles.statValue, { color: '#34C759' }]}>
              {formatCurrency(stats.paid)}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FF950020' }]}>
            <Text style={styles.statLabel}>Pendente</Text>
            <Text style={[styles.statValue, { color: '#FF9500' }]}>
              {formatCurrency(stats.pending)}
            </Text>
          </View>
          {stats.overdue > 0 && (
            <View style={[styles.statCard, { backgroundColor: '#FF3B3020' }]}>
              <Text style={styles.statLabel}>Vencido</Text>
              <Text style={[styles.statValue, { color: '#FF3B30' }]}>
                {formatCurrency(stats.overdue)}
              </Text>
            </View>
          )}
        </View>

        {/* Invoices List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Faturas</Text>
          {invoices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-sharp" size={72} color={Colors.gray300} />
              <Text style={styles.emptyText}>Nenhuma fatura encontrada</Text>
            </View>
          ) : (
            invoices.map((invoice) => (
              <TouchableOpacity
                key={invoice.id}
                style={styles.invoiceCard}
                onPress={() => viewInvoiceDetails(invoice)}
              >
                <View style={styles.invoiceHeader}>
                  <View>
                    <Text style={styles.invoiceDate}>
                      {formatDate(invoice.issue_date)}
                    </Text>
                    {invoice.doctor_name && (
                      <Text style={styles.invoiceDoctor}>
                        {invoice.doctor_name}
                      </Text>
                    )}
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(invoice.status) + '20' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(invoice.status) }
                    ]}>
                      {getStatusText(invoice.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.invoiceFooter}>
                  <Text style={styles.invoiceAmount}>
                    {formatCurrency(invoice.total_amount)}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </View>
                {invoice.due_date && (
                  <Text style={styles.dueDate}>
                    Vencimento: {formatDate(invoice.due_date)}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  invoiceCard: {
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
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  invoiceDoctor: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  dueDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

export default BillingScreen;

