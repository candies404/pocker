import {useEffect, useRef, useState} from 'react';
import {getAccessKey} from "@/utils/auth";
import {VERSION_CONSTANTS} from '@/utils/constants';

export function useVersionCheck() {
    const [needsUpdate, setNeedsUpdate] = useState(false);
    const isChecking = useRef(false);

    useEffect(() => {
        const checkVersion = async () => {
            // 如果已经在检查中，则跳过
            if (isChecking.current) return;

            // 检查是否在24小时内关闭过
            const dismissedAt = localStorage.getItem(VERSION_CONSTANTS.NOTIFICATION_DISMISS_KEY);
            if (dismissedAt) {
                const dismissedTime = parseInt(dismissedAt, 10);
                const now = Date.now();
                if (now - dismissedTime < VERSION_CONSTANTS.DISMISS_DURATION) {
                    return; // 在禁止提醒时间内，直接返回
                }
            }

            try {
                isChecking.current = true;
                const response = await fetch('/api/github/latest-tag', {
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

        checkVersion();
    }, []);

    return {needsUpdate};
} 