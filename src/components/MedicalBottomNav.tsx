import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

interface MedicalBottomNavProps {
  activeTab?: string;
}

export const MedicalBottomNav: React.FC<MedicalBottomNavProps> = ({ activeTab }) => {
  const navigation = useNavigation();
  const route = useRoute();

  const tabs = [
    {
      id: 'patients',
      label: 'Pacientes',
      icon: 'people-outline',
      activeIcon: 'people',
      route: 'Patients',
      color: '#0F4C75',
    },
    {
      id: 'vitals',
      label: 'Sinais Vitais',
      icon: 'heart-outline',
      activeIcon: 'heart',
      route: 'Vitals',
      color: '#FF6B6B',
    },
    {
      id: 'medications',
      label: 'Medicamentos',
      icon: 'medical-outline',
      activeIcon: 'medical',
      route: 'Medications',
      color: '#16C79A',
    },
    {
      id: 'emergency',
      label: 'Emergência',
      icon: 'alert-circle-outline',
      activeIcon: 'alert-circle',
      route: 'Emergency',
      color: '#FF3B30',
      urgent: true,
    },
  ];

  const currentRoute = route.name;

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {tabs.map((tab) => {
          const isActive = currentRoute === tab.route || activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                isActive && styles.tabActive,
                tab.urgent && styles.tabUrgent,
              ]}
              onPress={() => {
                // @ts-ignore
                navigation.navigate(tab.route);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <View style={[
                  styles.iconContainer,
                  isActive && styles.iconContainerActive,
                  tab.urgent && styles.iconContainerUrgent,
                ]}>
                  <Ionicons
                    name={isActive ? tab.activeIcon as any : tab.icon as any}
                    size={24}
                    color={isActive ? '#FFFFFF' : tab.urgent ? '#FF3B30' : '#666'}
                  />
                  {tab.urgent && (
                    <View style={styles.urgentBadge}>
                      <View style={styles.urgentDot} />
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    isActive && styles.tabLabelActive,
                    tab.urgent && styles.tabLabelUrgent,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      {Platform.OS === 'ios' && <View style={styles.safeArea} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 64,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    minHeight: 56,
  },
  tabActive: {
    backgroundColor: '#0F4C75',
  },
  tabUrgent: {
    backgroundColor: 'transparent',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconContainerUrgent: {
    backgroundColor: '#FF3B30',
  },
  urgentBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  tabLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabLabelUrgent: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  safeArea: {
    height: Platform.OS === 'ios' ? 20 : 0,
  },
});

