import { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { tourSteps, defaultOptions } from '../../tourConfig';
import { isAuthenticated } from '@/utils/auth';

export function useTour(pageName) {
    const [driverObj, setDriverObj] = useState(null);

    useEffect(() => {
        // 创建 driver 对象
        const driverInstance = driver({
            ...defaultOptions,
            steps: tourSteps[pageName] || []
        });
        setDriverObj(driverInstance);

        // 检查是否是首次访问该页面
        const hasSeenTour = localStorage.getItem(`tour_${pageName}`);
        
        // 如果是首次访问且页面已加载完成
        if (!hasSeenTour && document.readyState === 'complete') {
            // 首页需要检查登录状态
            if (pageName === 'home' && !isAuthenticated()) {
                // 首页且未登录，不显示引导
                return;
            }
            
            // 稍微延迟启动引导，确保页面元素已完全渲染
            setTimeout(() => {
                driverInstance.drive();
                localStorage.setItem(`tour_${pageName}`, 'true');
            }, 500);
        }

        // 清理函数
        return () => {
            if (driverInstance) {
                driverInstance.destroy();
            }
        };
    }, [pageName]);

    const startTour = () => {
        if (driverObj) {
            driverObj.drive();
            localStorage.setItem(`tour_${pageName}`, 'true');
        }
    };

    return { startTour };
}