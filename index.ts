// CRITICAL: Suppress update errors BEFORE any imports
// This must run first to catch errors at the native layer
// Import suppression utility first (side-effect only)
require('./src/utils/suppressUpdates');

// Only try to use ErrorUtils on native platforms (not web)
// This prevents package.json configuration warnings on web
// Check if we're on web by checking for window and document
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

if (typeof global !== 'undefined' && !isWeb) {
  // We're on a native platform (not web)
  try {
    // @ts-ignore - ErrorUtils is available in React Native but not on web
    const ErrorUtils = require('react-native/Libraries/ErrorUtils/ErrorUtils');
    const originalHandler = ErrorUtils.getGlobalHandler();
    
    ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
      const msg = error?.message || error?.toString() || String(error) || '';
      const lowerMsg = msg.toLowerCase();
      
      // Aggressively suppress ALL update-related errors - prevent error screen
      if (lowerMsg.includes('failed to download') ||
          lowerMsg.includes('remote update') ||
          lowerMsg.includes('java.io.ioexception') ||
          lowerMsg.includes('ioexception') ||
          lowerMsg.includes('expo-updates') ||
          lowerMsg.includes('expo_updates') ||
          lowerMsg.includes('update') ||
          lowerMsg.includes('download') && lowerMsg.includes('update')) {
        // Completely suppress - don't show error screen, don't log as error
        return;
      }
      
      // For other errors, use original handler
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  } catch (e) {
    // ErrorUtils not available - silently ignore
  }
}

// Suppress console.error for update errors and expo-notifications web warnings
if (typeof console !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const fullMsg = args.join(' ');
    const msg = fullMsg.toLowerCase();
      if (msg.includes('failed to download') ||
          msg.includes('remote update') ||
          msg.includes('java.io.ioexception') ||
          msg.includes('ioexception') ||
          msg.includes('expo-updates') ||
          msg.includes('expo_updates') ||
          (msg.includes('update') && msg.includes('download')) ||
          (msg.includes('expo-notifications') && msg.includes('web')) ||
          msg.includes('removechild') ||
          msg.includes('safearea') ||
          msg.includes('node to be removed')) {
        // Completely suppress - don't log at all
        return;
      }
    originalError.apply(console, args);
  };

  // Also suppress console.warn for update errors and deprecated warnings
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const fullMsg = args.join(' ');
    const msg = fullMsg.toLowerCase();
    if (msg.includes('failed to download') ||
        msg.includes('remote update') ||
        msg.includes('java.io.ioexception') ||
        msg.includes('expo-updates') ||
        msg.includes('pointerevents is deprecated') ||
        msg.includes('props.pointerevents is deprecated') ||
        (msg.includes('shadow') && (msg.includes('deprecated') || msg.includes('boxshadow'))) ||
        msg.includes('expo-notifications') && msg.includes('web') ||
        msg.includes('listening to push token changes') ||
        msg.includes('push token changes is not yet fully supported') ||
        fullMsg.includes('[expo-notifications]') ||
        (msg.includes('invalid package.json configuration') && msg.includes('react-native')) ||
        (msg.includes('errorutils') && msg.includes('does not exist')) ||
        (msg.includes('the resolution for') && msg.includes('errorutils') && msg.includes('does not exist')) ||
        msg.includes('removechild') ||
        msg.includes('safearea') ||
        (msg.includes('node') && msg.includes('to be removed') && msg.includes('not a child'))) {
      // Suppress warnings about updates, deprecation warnings from libraries, web-only notifications warnings, and react-native package.json warnings
      return;
    }
    originalWarn.apply(console, args);
  };
}

import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
