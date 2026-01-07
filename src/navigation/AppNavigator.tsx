import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { useNotifications } from '../hooks/useNotifications';
import { RootStackParamList, MainTabParamList } from '../types';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MFASetupScreen from '../screens/MFASetupScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import PatientsScreen from '../screens/PatientsScreen';
import MoreScreen from '../screens/MoreScreen';
import RecordsScreen from '../screens/RecordsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OnboardingMedicalHistoryScreen from '../screens/OnboardingMedicalHistoryScreen';
import OnboardingInsuranceScreen from '../screens/OnboardingInsuranceScreen';
import HealthHubScreen from '../screens/HealthHubScreen';
import SymptomCheckerScreen from '../screens/SymptomCheckerScreen';
import MedicationsScreen from '../screens/MedicationsScreen';
import MetricsScreen from '../screens/MetricsScreen';
import BillingScreen from '../screens/BillingScreen';
import HealthScreen from '../screens/HealthScreen';
import SupportScreen from '../screens/SupportScreen';
import TestResultsScreen from '../screens/TestResultsScreen';
import NotesScreen from '../screens/NotesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DoctorsScreen from '../screens/DoctorsScreen';
import TelemetryScreen from '../screens/TelemetryScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const PatientTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home-sharp' : 'home-outline';
          } else if (route.name === 'Appointments') {
            iconName = focused ? 'calendar-sharp' : 'calendar-outline';
          } else if (route.name === 'Patients') {
            iconName = focused ? 'people-sharp' : 'people-outline';
          } else if (route.name === 'More') {
            iconName = focused ? 'ellipsis-horizontal-sharp' : 'ellipsis-horizontal-outline';
          } else {
            iconName = 'help-circle-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabel: ({ focused }) => {
          let label = '';
          if (route.name === 'Dashboard') label = 'Início';
          else if (route.name === 'Appointments') label = 'Atendimentos';
          else if (route.name === 'Patients') label = 'Pacientes';
          else if (route.name === 'More') label = 'Mais';
          return (
            <Text style={{ 
              fontSize: 12, 
              color: focused ? '#14B8A6' : '#9CA3AF',
              fontWeight: focused ? '600' : '400'
            }}>
              {label}
            </Text>
          );
        },
        tabBarActiveTintColor: '#14B8A6',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} />
      <Tab.Screen name="Patients" component={PatientsScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
};

// Component to initialize notifications inside NavigationContainer
const NotificationsInitializer = () => {
  useNotifications();
  return null;
};

const AppNavigator = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [bootChecked, setBootChecked] = useState(false);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    (async () => {
      await AsyncStorage.getItem('onboarding_done');
      setBootChecked(true);
    })();
  }, []);

  // Show loading only on initial boot check, not on auth state changes
  if (!bootChecked || isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <NotificationsInitializer />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={PatientTabs} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Records" component={RecordsScreen} />
            <Stack.Screen name="Messages" component={MessagesScreen} />
            <Stack.Screen name="HealthHub" component={HealthHubScreen} />
            <Stack.Screen name="SymptomChecker" component={SymptomCheckerScreen} />
            <Stack.Screen name="Medications" component={MedicationsScreen} />
            <Stack.Screen name="Metrics" component={MetricsScreen} />
            <Stack.Screen name="Billing" component={BillingScreen} />
            <Stack.Screen name="Health" component={HealthScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="TestResults" component={TestResultsScreen} />
            <Stack.Screen name="Notes" component={NotesScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Doctors" component={DoctorsScreen} />
            <Stack.Screen name="Telemetry" component={TelemetryScreen} />
            <Stack.Screen name="OnboardingMedical" component={OnboardingMedicalHistoryScreen} />
            <Stack.Screen name="OnboardingInsurance" component={OnboardingInsuranceScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="MFASetup" component={MFASetupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
