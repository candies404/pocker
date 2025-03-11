import {useEffect, useRef, useState} from 'react';
import {getAccessKey} from "@/utils/auth";

export function useVersionCheck() {
    const [needsUpdate, setNeedsUpdate] = useState(false);
    const isChecking = useRef(false);

    useEffect(() => {
        const checkVersion = async () => {
            // 如果已经在检查中，则跳过
            if (isChecking.current) return;

            try {
                isChecking.current = true;
                const response = await fetch('/api/github/latest-commit', {
                    headers: {
                        'x-access-key': getAccessKey(),
                    },
                });
                const data = await response.json();
                if (data.currentVersion && data.latestVersion && data.currentVersion !== data.latestVersion) {
                    setNeedsUpdate(true);
                }
            } catch (error) {
                console.error('Failed to check version:', error);
            } finally {
                isChecking.current = false;
            }
        };

        // 每24小时检查一次
        checkVersion();
        const interval = setInterval(checkVersion, 24 * 60 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    return {needsUpdate};
} 