import {useEffect, useRef} from 'react';
import {apiRequest} from '@/utils/api';

export function useHeartbeat() {
    const isBeating = useRef(false);

    useEffect(() => {
        const sendHeartbeat = async () => {
            // 如果已经在发送中，则跳过
            if (isBeating.current) return;

            try {
                isBeating.current = true;
                await apiRequest('/api/heartbeat');
            } catch (error) {
                console.error('Failed to send heartbeat:', error);
            } finally {
                isBeating.current = false;
            }
        };

        sendHeartbeat();
    }, []);
} 