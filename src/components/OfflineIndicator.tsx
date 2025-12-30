import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Network from 'expo-network';

interface OfflineIndicatorProps {
  onStatusChange?: (isOnline: boolean) => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  onStatusChange,
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    checkNetworkStatus();
    const interval = setInterval(checkNetworkStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const checkNetworkStatus = async () => {
    try {
      // Use expo-network to check actual network status
      const networkState = await Network.getNetworkStateAsync();
      const online = networkState.isConnected && networkState.isInternetReachable !== false;
      
      if (online !== isOnline) {
        setIsOnline(online);
        onStatusChange?.(online);
        
        if (!online) {
          setShowIndicator(true);
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        } else {
          Animated.spring(slideAnim, {
            toValue: -100,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start(() => {
            setShowIndicator(false);
          });
        }
      }
    } catch (error) {
      // Fallback: try a simple fetch check if expo-network fails
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        await fetch('https://www.google.com', { 
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const online = true;
        if (online !== isOnline) {
          setIsOnline(online);
          onStatusChange?.(online);
          if (!online) {
            setShowIndicator(true);
            Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }).start();
          }
        }
      } catch (fetchError) {
        // Network error - assume offline
        const online = false;
        if (online !== isOnline) {
          setIsOnline(online);
          onStatusChange?.(online);
          
          if (!online) {
            setShowIndicator(true);
            Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }).start();
          }
        }
      }
    }
  };

  if (!showIndicator && isOnline) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={isOnline ? 'checkmark-circle' : 'cloud-offline'}
          size={20}
          color={isOnline ? '#34C759' : '#FFFFFF'}
        />
        <Text style={styles.text}>
          {isOnline ? 'Conexão restaurada' : 'Modo offline - dados serão sincronizados quando conectado'}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    zIndex: 9999,
    paddingTop: Platform.OS === 'ios' ? 44 : 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
});

