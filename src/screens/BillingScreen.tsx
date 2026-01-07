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
  Modal,
  TextInput,
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

interface Payment {
  id: number;
  amount: number;
  payment_method: string;
  status: string;
  paid_at?: string;
  created_at: string;
  invoice_id?: number;
  appointment_id?: number;
  transaction_id?: string;
}

const BillingScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [checkingPixStatus, setCheckingPixStatus] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
  });

  const loadData = async () => {
    try {
      const [invoicesData, paymentsData] = await Promise.all([
        apiService.getMyInvoices(),
        apiService.getPaymentHistory(),
      ]);
      
      setInvoices(invoicesData);
      setPayments(paymentsData);
      
      // Calculate stats
      const now = new Date();
      const total = invoicesData.reduce((sum: number, inv: Invoice) => sum + inv.total_amount, 0);
      const paid = invoicesData
        .filter((inv: Invoice) => inv.status === 'paid')
        .reduce((sum: number, inv: Invoice) => sum + inv.total_amount, 0);
      const pending = invoicesData
        .filter((inv: Invoice) => inv.status === 'pending' || inv.status === 'unpaid')
        .reduce((sum: number, inv: Invoice) => sum + inv.total_amount, 0);
      const overdue = invoicesData
        .filter((inv: Invoice) => {
          if (!inv.due_date) return false;
          const dueDate = new Date(inv.due_date);
          return (inv.status === 'pending' || inv.status === 'unpaid') && dueDate < now;
        })
        .reduce((sum: number, inv: Invoice) => sum + inv.total_amount, 0);

      setStats({ total, paid, pending, overdue });
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
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
        [
          { text: 'OK' },
          ...(details.status === 'pending' || details.status === 'unpaid' ? [{
            text: 'Pagar Agora',
            onPress: () => {
              setSelectedInvoice(details);
              setShowPaymentModal(true);
            },
          }] : []),
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da fatura');
    }
  };

  const handlePIXPayment = async () => {
    if (!selectedInvoice) return;
    
    try {
      setProcessingPayment(true);
      const response = await apiService.createPIXPayment({
        amount: selectedInvoice.total_amount,
        description: `Pagamento da fatura #${selectedInvoice.id}`,
        invoice_id: selectedInvoice.id,
      });
      
      setPixData(response);
      
      // Start polling for payment status
      const interval = setInterval(async () => {
        try {
          setCheckingPixStatus(true);
          const status = await apiService.getPaymentStatus(response.transaction_id);
          if (status.status === 'paid' || status.status === 'completed') {
            clearInterval(interval);
            Alert.alert('Sucesso', 'Pagamento realizado com sucesso!');
            setShowPaymentModal(false);
            setPixData(null);
            loadData();
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        } finally {
          setCheckingPixStatus(false);
        }
      }, 3000);
      
      // Stop polling after 5 minutes
      setTimeout(() => clearInterval(interval), 300000);
    } catch (error: any) {
      console.error('Error creating PIX payment:', error);
      Alert.alert('Erro', error?.response?.data?.detail || error?.message || 'Falha ao criar pagamento PIX');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCardPayment = async () => {
    if (!selectedInvoice) return;
    
    Alert.alert(
      'Pagamento com Cartão',
      'Funcionalidade de pagamento com cartão em desenvolvimento. Por favor, use PIX.',
      [{ text: 'OK' }]
    );
  };

  const copyPIXCode = () => {
    if (pixData?.qr_code) {
      // In a real implementation, you'd use Clipboard API
      Alert.alert('Código PIX', pixData.qr_code, [{ text: 'OK' }]);
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

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'invoices' && styles.tabActive]}
            onPress={() => setActiveTab('invoices')}
          >
            <Text style={[styles.tabText, activeTab === 'invoices' && styles.tabTextActive]}>
              Faturas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'payments' && styles.tabActive]}
            onPress={() => setActiveTab('payments')}
          >
            <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>
              Histórico de Pagamentos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Invoices List */}
        {activeTab === 'invoices' && (
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
                    {(invoice.status === 'pending' || invoice.status === 'unpaid') && (
                      <TouchableOpacity
                        style={styles.payButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedInvoice(invoice);
                          setShowPaymentModal(true);
                        }}
                      >
                        <Text style={styles.payButtonText}>Pagar</Text>
                      </TouchableOpacity>
                    )}
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
        )}

        {/* Payment History */}
        {activeTab === 'payments' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Histórico de Pagamentos</Text>
            {payments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="card-sharp" size={72} color={Colors.gray300} />
                <Text style={styles.emptyText}>Nenhum pagamento encontrado</Text>
              </View>
            ) : (
              payments.map((payment) => (
                <View key={payment.id} style={styles.paymentCard}>
                  <View style={styles.paymentHeader}>
                    <View>
                      <Text style={styles.paymentDate}>
                        {formatDate(payment.paid_at || payment.created_at)}
                      </Text>
                      <Text style={styles.paymentMethod}>
                        {payment.payment_method === 'pix' ? 'PIX' : 
                         payment.payment_method === 'credit_card' ? 'Cartão de Crédito' :
                         payment.payment_method === 'debit_card' ? 'Cartão de Débito' :
                         payment.payment_method}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: payment.status === 'paid' ? '#34C75920' : '#FF950020' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: payment.status === 'paid' ? '#34C759' : '#FF9500' }
                      ]}>
                        {payment.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.paymentFooter}>
                    <Text style={styles.paymentAmount}>
                      {formatCurrency(payment.amount)}
                    </Text>
                    {payment.transaction_id && (
                      <Text style={styles.transactionId}>
                        ID: {payment.transaction_id.slice(0, 8)}...
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowPaymentModal(false);
          setPixData(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pagamento Online</Text>
              <TouchableOpacity onPress={() => {
                setShowPaymentModal(false);
                setPixData(null);
              }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {selectedInvoice && (
              <View style={styles.modalBody}>
                <View style={styles.paymentSummary}>
                  <Text style={styles.paymentSummaryLabel}>Valor a Pagar</Text>
                  <Text style={styles.paymentSummaryValue}>
                    {formatCurrency(selectedInvoice.total_amount)}
                  </Text>
                </View>

                {!pixData ? (
                  <>
                    <View style={styles.paymentMethodSelector}>
                      <TouchableOpacity
                        style={[styles.paymentMethodButton, paymentMethod === 'pix' && styles.paymentMethodButtonActive]}
                        onPress={() => setPaymentMethod('pix')}
                      >
                        <Ionicons name="qr-code" size={24} color={paymentMethod === 'pix' ? 'white' : '#007AFF'} />
                        <Text style={[styles.paymentMethodText, paymentMethod === 'pix' && styles.paymentMethodTextActive]}>
                          PIX
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.paymentMethodButton, paymentMethod === 'card' && styles.paymentMethodButtonActive]}
                        onPress={() => setPaymentMethod('card')}
                      >
                        <Ionicons name="card" size={24} color={paymentMethod === 'card' ? 'white' : '#007AFF'} />
                        <Text style={[styles.paymentMethodText, paymentMethod === 'card' && styles.paymentMethodTextActive]}>
                          Cartão
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[styles.payNowButton, processingPayment && styles.payNowButtonDisabled]}
                      onPress={paymentMethod === 'pix' ? handlePIXPayment : handleCardPayment}
                      disabled={processingPayment}
                    >
                      {processingPayment ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text style={styles.payNowButtonText}>
                          {paymentMethod === 'pix' ? 'Gerar Código PIX' : 'Pagar com Cartão'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.pixContainer}>
                    <Text style={styles.pixTitle}>Escaneie o QR Code ou copie o código PIX</Text>
                    {pixData.qr_code_image ? (
                      <View style={styles.qrCodeContainer}>
                        {/* In a real implementation, you'd render the QR code image */}
                        <Ionicons name="qr-code" size={200} color="#333" />
                      </View>
                    ) : null}
                    {pixData.qr_code && (
                      <TouchableOpacity style={styles.copyButton} onPress={copyPIXCode}>
                        <Ionicons name="copy" size={20} color="#007AFF" />
                        <Text style={styles.copyButtonText}>Copiar Código PIX</Text>
                      </TouchableOpacity>
                    )}
                    {checkingPixStatus && (
                      <View style={styles.statusChecking}>
                        <ActivityIndicator size="small" color="#007AFF" />
                        <Text style={styles.statusCheckingText}>Verificando pagamento...</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: 'white',
  },
  payButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  payButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentCard: {
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
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 14,
    color: '#666',
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#34C759',
  },
  transactionId: {
    fontSize: 12,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  paymentSummary: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  paymentSummaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  paymentSummaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
  },
  paymentMethodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  paymentMethodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    gap: 8,
  },
  paymentMethodButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  paymentMethodTextActive: {
    color: 'white',
  },
  payNowButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payNowButtonDisabled: {
    opacity: 0.6,
  },
  payNowButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  pixContainer: {
    alignItems: 'center',
  },
  pixTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  qrCodeContainer: {
    width: 250,
    height: 250,
    backgroundColor: 'white',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  statusChecking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  statusCheckingText: {
    fontSize: 14,
    color: '#666',
  },
});

export default BillingScreen;

