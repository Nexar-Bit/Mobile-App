import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  private expoPushToken: string | null = null;

  async registerForPushNotifications(): Promise<string | null> {
    let token = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }
        
        token = (await Notifications.getExpoPushTokenAsync({
          projectId,
        })).data;
        
        this.expoPushToken = token;
        console.log('Expo push token:', token);
      } catch (error) {
        console.error('Error getting push token:', error);
        return null;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  async scheduleLocalNotification(notification: NotificationData, seconds: number = 0): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
      },
      trigger: { seconds },
    });
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  addNotificationListener(listener: (notification: Notifications.Notification) => void): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseListener(listener: (response: Notifications.NotificationResponse) => void): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  // Send notification for new appointment
  async notifyNewAppointment(appointment: any): Promise<void> {
    const notification: NotificationData = {
      title: 'Nova Consulta Agendada',
      body: `Você tem uma nova consulta com ${appointment.patient?.first_name} ${appointment.patient?.last_name} às ${new Date(appointment.scheduled_datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      data: { 
        type: 'new_appointment',
        appointmentId: appointment.id 
      },
    };

    await this.scheduleLocalNotification(notification);
  }

  // Send notification for appointment reminder
  async notifyAppointmentReminder(appointment: any, minutesBefore: number = 15): Promise<void> {
    const appointmentTime = new Date(appointment.scheduled_datetime);
    const reminderTime = new Date(appointmentTime.getTime() - (minutesBefore * 60 * 1000));
    const secondsUntilReminder = Math.max(0, Math.floor((reminderTime.getTime() - Date.now()) / 1000));

    if (secondsUntilReminder > 0) {
      const notification: NotificationData = {
        title: 'Appointment Reminder',
        body: `You have an appointment with ${appointment.patient?.first_name} ${appointment.patient?.last_name} in ${minutesBefore} minutes`,
        data: { 
          type: 'appointment_reminder',
          appointmentId: appointment.id 
        },
      };

      await this.scheduleLocalNotification(notification, secondsUntilReminder);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
