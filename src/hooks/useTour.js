import { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { tourSteps, defaultOptions } from '../../tourConfig';

export function useTour(pageName) {
    const [driverObj, setDriverObj] = useState(null);
    const [showTour, setShowTour] = useState(false);

    useEffect(() => {
        // 检查是否是首次访问
        const hasSeenTour = localStorage.getItem(`tour_${pageName}`);
        
        if (!hasSeenTour) {
            setShowTour(true);
        }

        const driverInstance = driver({
            ...defaultOptions,
            steps: tourSteps[pageName] || []
        });

        setDriverObj(driverInstance);

        return () => {
            driverInstance.destroy();
        };
    }, [pageName]);

    const startTour = () => {
        if (driverObj) {
            driverObj.drive();
            localStorage.setItem(`tour_${pageName}`, 'true');
        }
    };

    useEffect(() => {
        if (showTour && driverObj) {
            startTour();
        }
    }, [showTour, driverObj]);

    return { startTour };
}