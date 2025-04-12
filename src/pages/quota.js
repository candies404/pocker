import {useEffect, useState} from 'react';
import {getAccessKey, isAuthenticated} from '@/utils/auth';
import Navigation from '@/components/Navigation';
import {useRouter} from 'next/router';
import {useTour} from '@/hooks/useTour';
import withPageAuth from '@/utils/withPageAuth';
import {APP_CONFIG} from '@/config/version';

function QuotaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quotaData, setQuotaData] = useState(null);
    const [isAuth, setIsAuth] = useState(false);
    const {startTour} = useTour('quota');

    useEffect(() => {
        setIsAuth(isAuthenticated());
        setLoading(false);
    }, []);

    useEffect(() => {
        if (isAuth) {
            fetchQuotaData();
        }
    }, [isAuth]);

    const fetchQuotaData = async () => {
        try {
            const response = await fetch('/api/swr/quota', {
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const data = await response.json();
            if (data.success) {
                setQuotaData(data.data);
            } else {
                setError(data.message || '获取配额信息失败');
            }
        } catch (error) {
            setError(error.message || '获取配额信息失败');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navigation/>
                <div className="container mx-auto p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex justify-center items-center h-64">
                            <div className="flex flex-col items-center">
                                <div
                                    className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500 mb-4"></div>
                                <p className="text-gray-500 dark:text-gray-400">正在加载配额信息...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navigation/>
            <div className="container mx-auto p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex justify-end items-center mb-6">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={startTour}
                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                                查看引导
                            </button>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <a
                                href={APP_CONFIG.docs}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                                查看文档
                            </a>
                        </div>
                    </div>

                    {error && (
                        <div
                            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md mb-4">
                            <p className="font-medium">错误提示</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    )}

                    {quotaData ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="p-4 bg-red-50 dark:bg-gray-700/20 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">租户名称</h3>
                                <p className="text-sm font-mono text-gray-600 dark:text-gray-300 break-all">{quotaData.domain_name}</p>
                            </div>

                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">命名空间数量</h3>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{quotaData.namspace_num}</p>
                            </div>

                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">仓库数量</h3>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{quotaData.repo_num}</p>
                            </div>

                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">镜像数量</h3>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{quotaData.image_num}</p>
                            </div>

                            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">存储空间
                                    (GB)</h3>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{quotaData.store_space.toFixed(2)}</p>
                            </div>

                            <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">下行流量
                                    (GB)</h3>
                                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{quotaData.downflow_size.toFixed(2)}</p>
                            </div>

                        </div>
                    ) : (
                        <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                            暂无配额数据
                    </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default withPageAuth(QuotaPage); 