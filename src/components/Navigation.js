import {useRouter} from 'next/router';
import {clearAuth} from '@/utils/auth';
import {useTheme} from '@/utils/themeContext';
import {useVersionCheck} from '@/hooks/useVersionCheck';
import {useHeartbeat} from '@/hooks/useHeartbeat';
import {UpdateNotification} from './UpdateNotification';

export default function Navigation() {
    const router = useRouter();
    const {isDark, toggleTheme} = useTheme();
    const {needsUpdate} = useVersionCheck();
    
    // 添加心跳检测
    useHeartbeat();

    const menuItems = [
        {path: '/', label: '镜像仓库'},
        {path: '/workflow-logs', label: '构建日志'},
        {path: '/namespaces', label: '命名空间'},
        {path: '/github-config', label: 'GitHub配置'},
        {path: '/quota', label: '配额信息'},
        {path: '/donate', label: '支持项目'},
    ];

    const handleLogout = () => {
        clearAuth();
        router.replace('/').then(() => {
            window.location.reload();
        });
    };

    const handleMenuClick = (path) => {
        if (router.pathname === path) {
            router.reload();
        } else {
            router.push(path);
        }
    };

    return (
        <>
            <nav className="bg-white dark:bg-gray-800 shadow-md">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex-shrink-0 flex flex-col items-start">
                            <span
                                className="text-xl font-bold text-gray-800 dark:text-white">Docker 镜像私服 - Pocker</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex space-x-4">
                                {menuItems.map((item) => (
                                    <button
                                        id={item.label}
                                        key={item.path}
                                        onClick={() => handleMenuClick(item.path)}
                                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                                            router.pathname === item.path
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-600 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-md text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
                            >
                                {isDark ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                                    </svg>
                                )}
                            </button>
                            <button
                                onClick={handleLogout}
                                className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 dark:bg-red-900/20"
                            >
                                退出登录
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            <UpdateNotification show={needsUpdate}/>
        </>
    );
} 