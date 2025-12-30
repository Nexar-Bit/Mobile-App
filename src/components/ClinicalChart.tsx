import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Note: Install react-native-chart-kit or use alternative charting library
// import { LineChart } from 'react-native-chart-kit';

interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface ClinicalChartProps {
  title: string;
  data: ChartDataPoint[];
  unit: string;
  normalRange?: { min: number; max: number };
  color?: string;
  onRefresh?: () => Promise<void>;
  isOffline?: boolean;
}

const screenWidth = Dimensions.get('window').width;

export const ClinicalChart: React.FC<ClinicalChartProps> = ({
  title,
  data,
  unit,
  normalRange,
  color = '#0F4C75',
  onRefresh,
  isOffline = false,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefreshHandler = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const chartData = {
    labels: data.map((point) => {
      const date = new Date(point.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: data.map((point) => point.value),
        color: (opacity = 1) => color,
        strokeWidth: 2,
      },
    ],
  };

  const latestValue = data.length > 0 ? data[data.length - 1].value : 0;
  const isAbnormal =
    normalRange &&
    (latestValue < normalRange.min || latestValue > normalRange.max);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{title}</Text>
          {isOffline && (
            <View style={styles.offlineBadge}>
              <Ionicons name="cloud-offline" size={12} color="#666" />
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          )}
        </View>
        <View style={styles.valueContainer}>
          <Text style={[styles.value, isAbnormal && styles.valueAbnormal]}>
            {latestValue.toFixed(1)}
          </Text>
          <Text style={styles.unit}>{unit}</Text>
        </View>
      </View>

      {data.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartContainer}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefreshHandler}
                tintColor={color}
              />
            ) : undefined
          }
        >
          <View style={styles.simpleChartContainer}>
            <View style={styles.chartAxis}>
              {data.map((point, index) => {
                const maxValue = Math.max(...data.map(p => p.value));
                const minValue = Math.min(...data.map(p => p.value));
                const range = maxValue - minValue || 1;
                const normalizedValue = ((point.value - minValue) / range) * 100;
                
                return (
                  <View key={index} style={styles.chartPointContainer}>
                    <View 
                      style={[
                        styles.chartBar, 
                        { 
                          height: `${normalizedValue}%`,
                          backgroundColor: color,
                          opacity: 0.7,
                        }
                      ]} 
                    />
                    <View style={[styles.chartPoint, { backgroundColor: color }]} />
                  </View>
                );
              })}
            </View>
            <View style={styles.chartLabels}>
              {chartData.labels.map((label, index) => (
                <Text key={index} style={styles.chartLabelText}>
                  {label}
                </Text>
              ))}
            </View>
          </View>
          {normalRange && (
            <View style={styles.normalRangeIndicator}>
              <View style={styles.rangeLine} />
              <Text style={styles.rangeLabel}>
                Normal: {normalRange.min} - {normalRange.max} {unit}
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>Sem dados disponíveis</Text>
          {onRefresh && (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onRefreshHandler}
            >
              <Ionicons name="refresh" size={16} color="#0F4C75" />
              <Text style={styles.refreshText}>Atualizar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {data.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Média</Text>
            <Text style={styles.statValue}>
              {(data.reduce((sum, p) => sum + p.value, 0) / data.length).toFixed(1)} {unit}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Máximo</Text>
            <Text style={styles.statValue}>
              {Math.max(...data.map((p) => p.value)).toFixed(1)} {unit}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Mínimo</Text>
            <Text style={styles.statValue}>
              {Math.min(...data.map((p) => p.value)).toFixed(1)} {unit}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  offlineText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F4C75',
  },
  valueAbnormal: {
    color: '#FF3B30',
  },
  unit: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  chartContainer: {
    paddingVertical: 8,
  },
  simpleChartContainer: {
    height: 220,
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'flex-end',
  },
  chartAxis: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 180,
    marginBottom: 20,
  },
  chartPointContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  chartBar: {
    width: 24,
    borderRadius: 4,
    marginHorizontal: 4,
    position: 'absolute',
    bottom: 20,
  },
  chartPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 1,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  chartLabelText: {
    fontSize: 12,
    color: '#666',
  },
  normalRangeIndicator: {
    marginTop: 8,
    paddingHorizontal: 12,
  },
  rangeLine: {
    height: 2,
    backgroundColor: '#34C759',
    opacity: 0.3,
    marginBottom: 4,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E8F0F6',
    borderRadius: 8,
  },
  refreshText: {
    fontSize: 14,
    color: '#0F4C75',
    marginLeft: 4,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

