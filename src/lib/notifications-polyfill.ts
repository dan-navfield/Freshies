import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Polyfill for Expo Notifications on Simulator
// The simulator crashes when trying to access Keychain for push tokens
if (!Device.isDevice && Platform.OS === 'ios') {
    console.log('📱 Applying Expo Notifications Polyfill for Simulator');

    // Helper to mock a method safely
    const mockMethod = (name: string, implementation: any) => {
        try {
            console.log(`🔒 Mocking ${name}...`);
            Object.defineProperty(Notifications, name, {
                value: implementation,
                writable: true,
                configurable: true,
            });
        } catch (e) {
            console.warn(`Failed to mock ${name}:`, e);
        }
    };

    // Mock getExpoPushTokenAsync
    mockMethod('getExpoPushTokenAsync', async (options?: any) => {
        console.log('🔒 [Mock] getExpoPushTokenAsync called on Simulator - returning dummy token');
        return {
            data: 'ExponentPushToken[SIMULATOR_DUMMY_TOKEN]',
            type: 'expo',
        };
    });

    // Mock getDevicePushTokenAsync
    mockMethod('getDevicePushTokenAsync', async () => {
        console.log('🔒 [Mock] getDevicePushTokenAsync called on Simulator - returning dummy token');
        return {
            data: 'SIMULATOR_DEVICE_TOKEN',
            type: 'ios',
        };
    });

    // Mock getPermissionsAsync
    mockMethod('getPermissionsAsync', async () => {
        console.log('🔒 [Mock] getPermissionsAsync called on Simulator');
        return {
            status: 'granted',
            granted: true,
            canAskAgain: true,
            expires: 'never',
        };
    });

    // Mock requestPermissionsAsync
    mockMethod('requestPermissionsAsync', async (permissions?: any) => {
        console.log('🔒 [Mock] requestPermissionsAsync called on Simulator');
        return {
            status: 'granted',
            granted: true,
            canAskAgain: true,
            expires: 'never',
        };
    });
}
