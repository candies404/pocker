import {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import {isAuthenticated} from '@/utils/auth';

export default function withPageAuth(Component) {
    return function AuthenticatedComponent(props) {
        const router = useRouter();
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            // 检查用户是否已登录
            if (!isAuthenticated()) {
                // 如果未登录，重定向到首页
                router.replace('/');
            } else {
                setLoading(false);
            }
        }, []);

        // 如果正在加载或未登录，显示加载状态
        if (loading) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <div className="flex flex-col items-center">
                        <div
                            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500 mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400">正在验证登录状态...</p>
                    </div>
                </div>
            );
        }

        // 如果已登录，渲染原始组件
        return <Component {...props} />;
    };
} 