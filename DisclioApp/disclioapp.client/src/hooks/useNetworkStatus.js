import { useState, useEffect } from 'react';

export function useNetworkStatus() {
    const [isOnline, setOnline] = useState(navigator.onLine);

    useEffect(() => {
        const updateOnlineStatus = () => setOnline(navigator.onLine);

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    return isOnline;
}