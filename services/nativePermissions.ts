import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabaseClient';

export const requestNativePermissions = async () => {
    // Only run on native platforms
    if (Capacitor.isNativePlatform()) {
        try {
            // 1. Request Geolocation Permissions
            const geoStatus = await Geolocation.checkPermissions();
            if (geoStatus.location !== 'granted') {
                await Geolocation.requestPermissions();
            }

            // Try to get and save current position
            try {
                const position = await Geolocation.getCurrentPosition();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from('profiles').update({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        updated_at: new Date().toISOString()
                    }).eq('id', user.id);
                    console.log('User location updated');
                }
            } catch (err) {
                console.warn('Could not update user location automatically:', err);
            }

            // 2. Request Push Notification Permissions
            try {
                const pushStatus = await PushNotifications.checkPermissions();
                if (pushStatus.receive !== 'granted') {
                    const result = await PushNotifications.requestPermissions();
                    if (result.receive === 'granted') {
                        // Register with Apple / Google to receive push via APNS/FCM
                        await PushNotifications.register();
                    }
                } else {
                    // If already granted, ensure we are registered
                    await PushNotifications.register();
                }
            } catch (pushErr) {
                console.warn('Push Notifications registration failed (likely Firebase not config):', pushErr);
            }

            console.log('Native permissions handled');
        } catch (error) {
            console.error('Error requesting native permissions:', error);
        }
    } else {
        console.log('Running on web - skipping native permission requests');
    }
};

// Listener for push notification registration
if (Capacitor.isNativePlatform()) {
    PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success, token: ' + token.value);

        // Save the token to Supabase for the current user
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        push_token: token.value,
                        push_enabled: true
                    })
                    .eq('id', user.id);

                if (error) console.error('Error saving push token to DB:', error);
                else console.log('Push token successfully saved to database');
            }
        } catch (err) {
            console.error('Failed to update push token in profile:', err);
        }
    });

    PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ' + JSON.stringify(notification));
    });
}
