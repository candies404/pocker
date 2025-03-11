import {useEffect, useState} from 'react';

export function UpdateNotification({show}) {
    const [isVisible, setIsVisible] = useState(show);

    // 当 show 状态改变时，更新 isVisible
    useEffect(() => {
        if (show) {
            setIsVisible(true);
        }
    }, [show]);

    if (!show || !isVisible) return null;

    return (
        <div
            className="fixed bottom-4 right-4 bg-blue-500 dark:bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-4 z-50">
            <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <div>
                    <p className="font-medium">有新版本可用</p>
                    <p className="text-sm">请拉取最新代码获取最新更新</p>
                </div>
            </div>
            <button
                onClick={() => setIsVisible(false)}
                className="p-1 hover:bg-blue-600 dark:hover:bg-blue-700 rounded-full transition-colors duration-200"
                title="关闭提示"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"/>
                </svg>
            </button>
        </div>
    );
} 