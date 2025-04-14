import {useRouter} from 'next/router';
import {clearAuth} from '@/utils/auth';
import {useTheme} from '@/utils/themeContext';
import {useVersionCheck} from '@/hooks/useVersionCheck';
import {useHeartbeat} from '@/hooks/useHeartbeat';
import {UpdateNotification} from './UpdateNotification';
import {useEffect, useState} from 'react';
import {SWR_CONSTANTS} from '@/utils/constants';

// Region 映射关系，默认 华北-北京四
const REGION_MAP = {
    'cn-north-1': '华北-北京一',
    'cn-north-4': '华北-北京四',
    'cn-north-9': '华北-乌兰察布一',
    'cn-east-3': '华东-上海一',
    'cn-east-2': '华东-上海二',
    'cn-east-5': '华东-青岛',
    'cn-east-4': '华东二',
    'cn-south-1': '华南-广州',
    'cn-south-4': '华南-广州-友好用户环境',
    'cn-southwest-2': '西南-贵阳一',
    'ap-southeast-1': '中国-香港',
    'ap-southeast-2': '亚太-曼谷',
    'ap-southeast-3': '亚太-新加坡',
    'ap-southeast-4': '亚太-雅加达',
    'ap-southeast-5': '亚太-马尼拉',
    'me-east-1': '中东-利雅得',
    'af-north-1': '非洲-开罗',
    'af-south-1': '非洲-约翰内斯堡',
    'tr-west-1': '土耳其-伊斯坦布尔',
    'na-mexico-1': '拉美-墨西哥城一',
    'la-north-2': '拉美-墨西哥城二',
    'sa-brazil-1': '拉美-圣保罗一',
    'la-south-2': '拉美-圣地亚哥'
};

export default function Navigation() {
    const router = useRouter();
    const {isDark, toggleTheme} = useTheme();
    const {needsUpdate} = useVersionCheck();
    const [currentRegion, setCurrentRegion] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // 添加心跳检测
    useHeartbeat();

    useEffect(() => {
        initRegion();
    }, []);

    const initRegion = async () => {
        // 先从 localStorage 获取
        const savedRegion = localStorage.getItem(SWR_CONSTANTS.CURRENT_REGION_KEY);
        if (savedRegion) {
            setCurrentRegion(savedRegion);
            setIsLoading(false);
            return;
        }

        try {
            // 如果没有保存的 region，从 API 获取
            const response = await fetch('/api/swr/api-versions');
            const data = await response.json();
            if (data.success && data.data?.versions?.[0]?.links?.href) {
                // 从 href 中提取 region
                // 例如从 "swr-api.cn-north-4.myhuaweicloud.com" 提取 "cn-north-4"
                const href = data.data.versions[0].links.href;
                const regionMatch = href.match(/swr-api\.([\w-]+)\.myhuaweicloud\.com/);
                if (regionMatch && regionMatch[1]) {
                    const region = regionMatch[1];
                    if (REGION_MAP[region]) {  // 确保是支持的 region
                        setCurrentRegion(region);
                        localStorage.setItem(SWR_CONSTANTS.CURRENT_REGION_KEY, region);
                    } else {
                        // 如果不是支持的 region，使用默认值
                        setCurrentRegion('cn-north-4');
                        localStorage.setItem(SWR_CONSTANTS.CURRENT_REGION_KEY, 'cn-north-4');
                    }
                }
            } else {
                // 如果无法获取 region 信息，使用默认值
                setCurrentRegion('cn-north-4');
                localStorage.setItem(SWR_CONSTANTS.CURRENT_REGION_KEY, 'cn-north-4');
            }
        } catch (error) {
            console.error('获取 region 信息失败:', error);
            // 发生错误时使用默认值
            setCurrentRegion('cn-north-4');
            localStorage.setItem(SWR_CONSTANTS.CURRENT_REGION_KEY, 'cn-north-4');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegionChange = (event) => {
        const newRegion = event.target.value;
        setCurrentRegion(newRegion);
        localStorage.setItem(SWR_CONSTANTS.CURRENT_REGION_KEY, newRegion);
    };

    const menuItems = [
        {path: '/', label: '镜像仓库'},
        {path: '/workflow-logs', label: '构建日志'},
        {path: '/namespaces', label: '命名空间'},
        {path: '/github-config', label: 'GitHub 配置'},
        {path: '/quota', label: '用量统计'},
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
            <style jsx global>{`
                .dark select::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }

                .dark select::-webkit-scrollbar-track {
                    background: #374151;
                    border-radius: 4px;
                }

                .dark select::-webkit-scrollbar-thumb {
                    background: #4B5563;
                    border-radius: 4px;
                }

                .dark select::-webkit-scrollbar-thumb:hover {
                    background: #6B7280;
                }
            `}</style>
            <nav className="bg-white dark:bg-gray-800 shadow-md">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex-shrink-0 flex items-center space-x-4">
                            <span className="text-xl font-bold text-gray-800 dark:text-white">Pocker - 镜像私服</span>
                            <select
                                value={currentRegion}
                                onChange={handleRegionChange}
                                disabled={isLoading}
                                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {isLoading ? (
                                    <option value="">加载中...</option>
                                ) : (
                                    Object.entries(REGION_MAP).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex space-x-0">
                                {menuItems.map((item) => (
                                    <button
                                        id={item.label}
                                        key={item.path}
                                        onClick={() => handleMenuClick(item.path)}
                                        className={`px-2 py-2 rounded-md text-sm font-medium ${
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