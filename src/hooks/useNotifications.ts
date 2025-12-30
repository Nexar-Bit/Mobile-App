import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { RootStackParamList } from '../types';
import notificationService from '../services/notificationService';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const useNotifications = () => {
  // useNavigation must be called unconditionally (React hooks rule)
  // This hook should only be called inside NavigationContainer
  // On web, this might not work, but we handle it in the useEffect
  const navigation = useNavigation<NavigationProp>();

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Skip notifications setup on web (not fully supported)
    if (Platform.OS === 'web') {
      // Silently skip notifications on web - no need to log
      return;
    }

    // Register for push notifications
    notificationService.registerForPushNotifications();

    // Listen for notifications received while app is running
    notificationListener.current = notificationService.addNotificationListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    // Listen for user interactions with notifications
    responseListener.current = notificationService.addNotificationResponseListener(
      (response) => {
        console.log('Notification response:', response);
        
        const data = response.notification.request.content.data;
        
        // Only navigate if navigation is available
        if (navigation) {
          if (data?.type === 'new_appointment' && data?.appointmentId) {
            // Navigate to appointment details or refresh schedule
            navigation.navigate('Main');
          } else if (data?.type === 'appointment_reminder' && data?.appointmentId) {
            // Navigate to appointment details
            navigation.navigate('Main');
          }
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [navigation]);

  return {
    scheduleAppointmentReminder: notificationService.notifyAppointmentReminder,
    notifyNewAppointment: notificationService.notifyNewAppointment,
  };
};
