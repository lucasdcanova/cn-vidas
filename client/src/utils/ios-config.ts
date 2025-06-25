import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

// Configure iOS status bar
export const configureIOSStatusBar = async () => {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
    try {
      // Set status bar style to dark (dark text on light background)
      await StatusBar.setStyle({ style: Style.Dark });
      
      // Set status bar background color to match auth page background
      await StatusBar.setBackgroundColor({ color: '#eff6ff' });
      
      // Make status bar overlay the webview (for full control)
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch (error) {
      console.error('Error configuring iOS status bar:', error);
    }
  }
};

// Configure iOS keyboard behavior
export const configureIOSKeyboard = async () => {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
    try {
      // Set keyboard resize mode to move content up
      await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
      
      // Disable scroll on keyboard show
      await Keyboard.setScroll({ isDisabled: false });
    } catch (error) {
      console.error('Error configuring iOS keyboard:', error);
    }
  }
};

// Initialize all iOS configurations
export const initializeIOSConfig = async () => {
  await configureIOSStatusBar();
  await configureIOSKeyboard();
};