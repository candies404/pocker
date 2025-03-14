import {useEffect, useRef} from 'react';
import {getAccessKey} from "@/utils/auth";

export function useHeartbeat() {
    const isBeating = useRef(false);

    useEffect(() => {
        const sendHeartbeat = async () => {
            // 如果已经在发送中，则跳过
            if (isBeating.current) return;

            try {
                isBeating.current = true;
                const response = await fetch('/api/heartbeat', {
                    headers: {
                        'x-access-key': getAccessKey(),
                    },
                });

            } catch (error) {
                console.error('Failed to send heartbeat:', error);
            } finally {
                isBeating.current = false;
            }
        };

        sendHeartbeat();
    }, []);
} 