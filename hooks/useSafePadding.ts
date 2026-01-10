import { useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { useKeyboardStatus } from './useKeyboardStatus';

interface UseSafePaddingOptions {
    basePadding?: number; // rem, default: 1.5
    androidMinPadding?: number; // rem, default: 4
}

export const useSafePadding = (
    options: UseSafePaddingOptions = {}
): string => {
    const { basePadding = 1.5, androidMinPadding = 4 } = options;
    const { isKeyboardOpen } = useKeyboardStatus();

    return useMemo(() => {
        // Fallback for web standalone (SSR safe)
        if (typeof Capacitor === 'undefined') {
            return `${basePadding}rem`;
        }

        // If keyboard is open, remove padding to allow content to sit flush
        if (isKeyboardOpen) {
            return '0px';
        }

        const platform = Capacitor.getPlatform();
        const isAndroid = platform === 'android';

        if (isAndroid) {
            // Android: Ensure minimum height to clear nav buttons
            return `max(${androidMinPadding}rem, calc(${basePadding}rem + env(safe-area-inset-bottom, 0px)))`;
        }

        // iOS/Web: Standard safe area handling
        return `max(${basePadding}rem, calc(${basePadding}rem + env(safe-area-inset-bottom, 0px)))`;
    }, [basePadding, androidMinPadding, isKeyboardOpen]);
};
