import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions 
} from 'react-native';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';
import { Colors, Spacing, BorderRadius, Shadows } from '../styles/theme';
import { commonStyles } from '../styles/commonStyles';

const { width } = Dimensions.get('window');

interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
  toReceive: number;
  revenueChart: number[];
  expenseChart: number[];
}

const DashboardScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalRevenue: 15000,
    totalExpenses: 7000,
    balance: 8000,
    toReceive: 25500,
            revenueChart: [400, 500, 450, 550, 520, 600],
            expenseChart: [300, 400, 350, 450, 420, 500],
  });

  const loadData = async () => {
    try {
      // Load invoices to calculate financial data
      const invoices = await apiService.getMyInvoices();
      
      // Calculate financial metrics from invoices
      const now = new Date();
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      sixMonthsAgo.setDate(1); // First day of the month
      sixMonthsAgo.setHours(0, 0, 0, 0);
      
      let totalRevenue = 0;
      let totalExpenses = 0; // Patients don't have expenses, keeping at 0
      let toReceive = 0;
      const monthlyRevenue = [0, 0, 0, 0, 0, 0]; // Last 6 months
      const monthlyExpenses = [0, 0, 0, 0, 0, 0]; // Last 6 months (always 0 for patients)
      
      // Helper function to get month index (0-5) for last 6 months
      const getMonthIndex = (date: Date): number => {
        const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
        return 5 - monthsDiff; // 5 is most recent month, 0 is oldest
      };
      
      invoices.forEach((invoice: any) => {
        const invoiceDate = new Date(invoice.issue_date || invoice.created_at);
        const invoiceAmount = parseFloat(invoice.total_amount || 0);
        
        // Calculate paid amount from payments
        let paidAmount = 0;
        if (invoice.payments && Array.isArray(invoice.payments)) {
          paidAmount = invoice.payments
            .filter((p: any) => p.status === 'completed' || p.status === 'COMPLETED')
            .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
        }
        
        // Calculate pending amount
        const pendingAmount = invoiceAmount - paidAmount;
        
        // Add to total revenue (only completed payments)
        totalRevenue += paidAmount;
        
        // Add to pending (invoices that are pending or partial)
        if (invoice.status === 'pending' || invoice.status === 'PENDING' || invoice.status === 'partial' || invoice.status === 'PARTIAL') {
          toReceive += pendingAmount;
        }
        
        // Calculate monthly data (last 6 months) - based on payment date
        if (invoice.payments && Array.isArray(invoice.payments)) {
          invoice.payments
            .filter((p: any) => p.status === 'completed' || p.status === 'COMPLETED')
            .forEach((payment: any) => {
              const paymentDate = new Date(payment.paid_at || payment.created_at);
              if (paymentDate >= sixMonthsAgo) {
                const monthIndex = getMonthIndex(paymentDate);
                if (monthIndex >= 0 && monthIndex < 6) {
                  monthlyRevenue[monthIndex] += parseFloat(payment.amount || 0);
                }
              }
            });
        }
      });
      
      const balance = totalRevenue - totalExpenses;
      
      setFinancialData({
        totalRevenue,
        totalExpenses,
        balance,
        toReceive,
        revenueChart: monthlyRevenue,
        expenseChart: monthlyExpenses,
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Keep default values on error
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

  if (loading) {
    return (
      <View style={commonStyles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calculate max value for chart scaling
  const maxChartValue = Math.max(
    ...financialData.revenueChart,
    ...financialData.expenseChart,
    1 // Ensure minimum of 1 to avoid division by zero
  );
  const chartHeight = 150;
  const chartPadding = 20;

  return (
    <View style={styles.container}>
      {/* Header with Logo and Title */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image 
            source={require('../../assets/Logo/Logotipo em Fundo Transparente.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Prontivus</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>Início</Text>
        </View>

        {/* Financial Summary Cards */}
        <View style={styles.financialCards}>
          <View style={styles.financialCard}>
            <Text style={styles.financialLabel}>Receita Total</Text>
            <Text style={styles.financialValue}>{formatCurrency(financialData.totalRevenue)}</Text>
          </View>
          <View style={styles.financialCard}>
            <Text style={styles.financialLabel}>Despesas Totais</Text>
            <Text style={[styles.financialValue, styles.expenseValue]}>
              {formatCurrency(financialData.totalExpenses)}
            </Text>
          </View>
          <View style={styles.financialCard}>
            <Text style={styles.financialLabel}>Saldo</Text>
            <Text style={[styles.financialValue, styles.balanceValue]}>
              {formatCurrency(financialData.balance)}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.financialCard}
            activeOpacity={0.7}
          >
            <Text style={styles.financialLabel}>Para Receber</Text>
            <Text style={[styles.financialValue, styles.receiveValue]}>
              {formatCurrency(financialData.toReceive)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Revenue and Expenses Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Receita e Despesas</Text>
          <View style={styles.chart}>
            <View style={styles.chartYAxis}>
              <Text style={styles.chartYLabel}>{formatCurrency(maxChartValue)}</Text>
              <Text style={styles.chartYLabel}>{formatCurrency(Math.round(maxChartValue / 2))}</Text>
              <Text style={styles.chartYLabel}>{formatCurrency(0)}</Text>
            </View>
            <View style={styles.chartBars}>
              {financialData.revenueChart.map((revenue, index) => {
                const expense = financialData.expenseChart[index];
                const revenueHeight = (revenue / maxChartValue) * (chartHeight - chartPadding);
                const expenseHeight = (expense / maxChartValue) * (chartHeight - chartPadding);
                
                return (
                  <View key={index} style={styles.chartBarGroup}>
                    <View style={styles.chartBarWrapper}>
                      <View 
                        style={[
                          styles.chartBar, 
                          styles.revenueBar, 
                          { height: revenueHeight }
                        ]} 
                      />
                      <View 
                        style={[
                          styles.chartBar, 
                          styles.expenseBar, 
                          { height: expenseHeight }
                        ]} 
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.revenueBar]} />
              <Text style={styles.legendText}>Receitas</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.expenseBar]} />
              <Text style={styles.legendText}>Despesas</Text>
            </View>
          </View>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray700,
  },
  scrollView: {
    flex: 1,
  },
  pageTitleContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gray900,
  },
  financialCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    justifyContent: 'space-between',
  },
  financialCard: {
    width: (width - Spacing.md * 3) / 2,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    ...Shadows.sm,
  },
  financialLabel: {
    fontSize: 13,
    color: Colors.gray600,
    marginBottom: Spacing.xs,
  },
  financialValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray900,
  },
  expenseValue: {
    color: Colors.error,
  },
  balanceValue: {
    color: Colors.success,
  },
  receiveValue: {
    color: Colors.info,
  },
  chartContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    ...Shadows.sm,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: Spacing.md,
  },
  chart: {
    flexDirection: 'row',
    height: 150,
    marginBottom: Spacing.md,
  },
  chartYAxis: {
    justifyContent: 'space-between',
    paddingRight: Spacing.sm,
    paddingBottom: 20,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  chartYLabel: {
    fontSize: 11,
    color: Colors.gray500,
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: 20,
  },
  chartBarGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  chartBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  chartBar: {
    width: '45%',
    borderRadius: 4,
    minHeight: 4,
  },
  revenueBar: {
    backgroundColor: '#3B82F6',
  },
  expenseBar: {
    backgroundColor: '#6366F1',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 13,
    color: Colors.gray600,
  },
});

export default DashboardScreen;
