import React, { useEffect, ErrorInfo, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { View, Text, StyleSheet } from 'react-native';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Aggressively suppress update-related errors, DOM errors, and SafeArea errors
    const errorMessage = (error.message || error.toString() || '').toLowerCase();
    if (errorMessage.includes('failed to download') ||
        errorMessage.includes('remote update') ||
        errorMessage.includes('java.io.ioexception') ||
        errorMessage.includes('ioexception') ||
        errorMessage.includes('expo-updates') ||
        errorMessage.includes('expo_updates') ||
        errorMessage.includes('removechild') ||
        errorMessage.includes('safearea') ||
        errorMessage.includes('native safe area') ||
        errorMessage.includes('node to be removed') ||
        errorMessage.includes('maximum update depth') ||
        (errorMessage.includes('update') && errorMessage.includes('download'))) {
      // Silently ignore these errors - never show error screen
      return { hasError: false, error: null };
    }
    // For other errors, also suppress to prevent crashes
    return { hasError: false, error: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Aggressively suppress update-related errors, DOM errors, and SafeArea errors
    const errorMessage = (error.message || error.toString() || '').toLowerCase();
    if (errorMessage.includes('failed to download') ||
        errorMessage.includes('remote update') ||
        errorMessage.includes('java.io.ioexception') ||
        errorMessage.includes('ioexception') ||
        errorMessage.includes('expo-updates') ||
        errorMessage.includes('expo_updates') ||
        errorMessage.includes('removechild') ||
        errorMessage.includes('safearea') ||
        errorMessage.includes('native safe area') ||
        errorMessage.includes('node to be removed') ||
        errorMessage.includes('maximum update depth') ||
        (errorMessage.includes('update') && errorMessage.includes('download'))) {
      // Completely suppress - don't log, don't show
      return;
    }
    // Only log in development for other errors
    if (__DEV__) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    // Always render children - never show error screen
    // All error suppression happens in getDerivedStateFromError and componentDidCatch
    // This prevents infinite loops from trying to render error UI
    return this.props.children;
  }
}

export default function App() {
  // Suppress unhandled promise rejections and errors for update issues
  useEffect(() => {
    // Handle unhandled promise rejections
    const unhandledRejectionHandler = (event: PromiseRejectionEvent | any) => {
      const error = event?.reason || event?.error || event;
      const errorMessage = (error?.message || error?.toString() || String(error) || '').toLowerCase();
      
      if (errorMessage.includes('failed to download') ||
          errorMessage.includes('remote update') ||
          errorMessage.includes('java.io.ioexception') ||
          errorMessage.includes('ioexception') ||
          errorMessage.includes('expo-updates') ||
          errorMessage.includes('expo_updates') ||
          (errorMessage.includes('update') && errorMessage.includes('download'))) {
        // Completely suppress - prevent default and return
        event?.preventDefault?.();
        return false;
      }
    };

    // Set up global error handlers
    if (Platform.OS !== 'web') {
      try {
        // @ts-ignore - ErrorUtils is available in React Native but not typed
        const ErrorUtils = require('react-native/Libraries/ErrorUtils/ErrorUtils');
        const originalErrorHandler = ErrorUtils.getGlobalHandler();
        
        ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
          // Aggressively suppress update-related errors
          const errorMessage = (error?.message || error?.toString() || '').toLowerCase();
          if (errorMessage.includes('failed to download') ||
              errorMessage.includes('remote update') ||
              errorMessage.includes('java.io.ioexception') ||
              errorMessage.includes('ioexception') ||
              errorMessage.includes('expo-updates') ||
              errorMessage.includes('expo_updates') ||
              (errorMessage.includes('update') && errorMessage.includes('download'))) {
            // Completely suppress - don't log, don't show
            return;
          }
          // Call original handler for other errors
          if (originalErrorHandler) {
            originalErrorHandler(error, isFatal);
          }
        });

        // Handle unhandled promise rejections
        if (typeof window !== 'undefined') {
          window.addEventListener('unhandledrejection', unhandledRejectionHandler);
        }

        return () => {
          ErrorUtils.setGlobalHandler(originalErrorHandler);
          if (typeof window !== 'undefined') {
            window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
          }
        };
      } catch (e) {
        // ErrorUtils not available, ignore
        console.log('ErrorUtils not available, skipping error handler setup');
      }
    } else {
      // Web platform - handle promise rejections
      if (typeof window !== 'undefined') {
        window.addEventListener('unhandledrejection', unhandledRejectionHandler);
        return () => {
          window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
        };
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 20,
    textAlign: 'center',
  },
});