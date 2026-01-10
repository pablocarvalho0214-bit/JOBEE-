import { useState, useEffect } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';

export const useKeyboardStatus = () => {
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        if (!Capacitor.isPluginAvailable('Keyboard')) return;

        let showListener: PluginListenerHandle;
        let hideListener: PluginListenerHandle;

        const setupListeners = async () => {
            showListener = await Keyboard.addListener('keyboardWillShow', () => setIsKeyboardOpen(true));
            hideListener = await Keyboard.addListener('keyboardWillHide', () => setIsKeyboardOpen(false));
        };

        setupListeners();

        return () => {
            if (showListener) showListener.remove();
            if (hideListener) hideListener.remove();
        };
    }, []);

    return { isKeyboardOpen };
};
