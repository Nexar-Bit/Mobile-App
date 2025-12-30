// Utility to completely suppress expo-updates errors
// expo-updates has been removed, but errors may still occur from native code
// This utility suppresses any update-related errors that might slip through

// Set global flags to disable updates
if (typeof global !== 'undefined') {
  try {
    // @ts-ignore
    global.__expo_updates_disabled = true;
    // @ts-ignore
    global.EXPO_UPDATES_DISABLED = true;
    // @ts-ignore
    global.__EXPO_UPDATES_ENABLED = false;
  } catch (e) {
    // Ignore
  }
}

// If expo-updates somehow gets loaded (from Expo SDK), disable it
try {
  // @ts-ignore
  const Updates = require('expo-updates');
  if (Updates) {
    // Override all update methods to prevent any update checks
    if (Updates.checkForUpdateAsync) {
      Updates.checkForUpdateAsync = () => Promise.resolve({ isAvailable: false });
    }
    if (Updates.fetchUpdateAsync) {
      Updates.fetchUpdateAsync = () => Promise.resolve({ isNew: false });
    }
    if (Updates.reloadAsync) {
      Updates.reloadAsync = () => Promise.resolve();
    }
    if (Updates.isEnabled) {
      Updates.isEnabled = false;
    }
  }
} catch (e) {
  // expo-updates package not installed (expected), continue
}

