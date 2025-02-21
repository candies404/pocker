import {useEffect, useState} from 'react';
import {getAccessKey, isAuthenticated} from '@/utils/auth';
import Navigation from '@/components/Navigation';
import {useRouter} from 'next/router';
import {useTour} from '@/hooks/useTour';

export default function QuotaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quotaData, setQuotaData] = useState(null);
    const [usageData, setUsageData] = useState({
        namespaceCount: 0,
        repoCount: 0,
        tagCount: 0,
        loading: {
            namespace: true,
            repo: true,
            tag: true,
        }
    });
    const [isAuth, setIsAuth] = useState(false);
    const {startTour} = useTour('quota');

    useEffect(() => {
        setIsAuth(isAuthenticated());
        setLoading(false);
    }, []);

    useEffect(() => {
        if (isAuth) {
            // 检查命名空间是否已初始化
            checkNamespaceInitialization();
        }
    }, [isAuth]);

    const checkNamespaceInitialization = async () => {
        try {
            const response = await fetch('/api/tcr/namespaces?pageSize=1', {
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const data = await response.json();
            if (data.Data) {
                // 并行发起所有请求
                setLoading(true);
                setError("");
                Promise.all([
                    fetchQuotaData(),
                    fetchNamespaceCount(),
                    fetchRepoAndTagCount(),
                ]).finally(() => {
                    setLoading(false);
                });
            } else if (data.code === "ResourceNotFound.ErrNoUser") {
                setError('获取命名空间失败：ResourceNotFound.ErrNoUser');
                setUsageData(prev => ({
                    ...prev,
                    loading: {...prev.loading, namespace: false, repo: false, tag: false}
                }));
            } else {
                setError('获取命名空间列表失败');
            }
        } catch (error) {
            setError('获取命名空间信息失败');
            setLoading(false);
        }
    };

    // 获取配额信息
    const fetchQuotaData = async () => {
        try {
            const response = await fetch('/api/tcr/quota', {
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const data = await response.json();
            setQuotaData(data.Data);
        } catch (error) {
            setError('获取配额信息失败');
        }
    };

    // 获取命名空间数量
    const fetchNamespaceCount = async () => {
        try {
            const response = await fetch('/api/tcr/namespaces?pageSize=1', {
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const data = await response.json();
            setUsageData(prev => ({
                ...prev,
                namespaceCount: data.Data.NamespaceCount,
                loading: {...prev.loading, namespace: false}
            }));
        } catch (error) {
            console.error('获取命名空间数量失败:', error);
        }
    };

    // 获取仓库数量和标签数量
    const fetchRepoAndTagCount = async () => {
        try {
            // 先获取仓库总数
            const repoResponse = await fetch('/api/tcr/repositories?pageSize=1', {
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const repoData = await repoResponse.json();
            const totalRepos = repoData.Data.TotalCount;
            setUsageData(prev => ({
                ...prev,
                repoCount: totalRepos,
                loading: {...prev.loading, repo: false}
            }));

            // 如果有仓库，则分批获取所有仓库的标签数
            if (totalRepos > 0) {
                // 使用较大的 pageSize 减少请求次数
                const pageSize = 100;
                const pages = Math.ceil(totalRepos / pageSize);
                let totalTags = 0;

                // 分批请求所有仓库信息
                for (let page = 1; page <= pages; page++) {
                    const response = await fetch(`/api/tcr/repositories?page=${page}&pageSize=${pageSize}`, {
                        headers: {
                            'x-access-key': getAccessKey(),
                        },
                    });
                    const data = await response.json();

                    // 累加所有仓库的标签数
                    totalTags += data.Data.RepoInfo.reduce((sum, repo) => sum + (repo.TagCount || 0), 0);

                    // 更新进度
                    setUsageData(prev => ({
                        ...prev,
                        tagCount: totalTags,
                    }));
                }
            }

            setUsageData(prev => ({
                ...prev,
                loading: {...prev.loading, tag: false}
            }));
        } catch (error) {
            console.error('获取仓库和标签数量失败:', error);
        }
    };

    const isAllDataLoaded = !usageData.loading.namespace &&
        !usageData.loading.repo &&
        !usageData.loading.tag;

    if (loading || !isAllDataLoaded) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navigation/>
                <div className="container mx-auto p-4 mt-0">
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
            <div className="container mx-auto p-4 mt-0">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex justify-end items-center mb-6">
                        <button
                            onClick={startTour}
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                            查看引导
                        </button>
                    </div>

                    {error && (
                        <div
                            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md mb-4">
                            <p className="font-medium">错误提示</p>
                            <p className="text-sm mt-1">{error}</p>
                            {error.includes('ResourceNotFound.ErrNoUser') && (
                                <a
                                    href="https://console.cloud.tencent.com/tcr/?rid=1"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block dark:text-blue-400 dark:hover:text-blue-600"
                                >
                                    您还没开通镜像服务，点击此处前往腾讯云控制台初始化
                                </a>
                            )}
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto divide-y divide-gray-200 dark:divide-gray-700">
                            <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700">
                                <th id="repoType" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    资源类型
                                </th>
                                <th id="quota" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    已用/总数
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">命名空间数量</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-300">
                                    <span
                                        className="text-blue-600 font-mono dark:text-blue-400">{usageData.namespaceCount}</span>
                                    <span className="text-gray-500 mx-1 dark:text-gray-500">/</span>
                                    <span className="text-gray-600 font-mono dark:text-gray-400">
                                            {quotaData?.LimitInfo.find(i => i.Type === 'namespace')?.Value || '-'}
                                        </span>
                                </td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">仓库数量</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span
                                        className="text-blue-600 font-mono dark:text-blue-400">{usageData.repoCount}</span>
                                    <span className="text-gray-500 mx-1 dark:text-gray-500">/</span>
                                    <span className="text-gray-600 font-mono dark:text-gray-400">
                                            {quotaData?.LimitInfo.find(i => i.Type === 'repo')?.Value || '-'}
                                        </span>
                                </td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">标签数量</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span
                                        className="text-blue-600 font-mono dark:text-blue-400">{usageData.tagCount}</span>
                                    <span className="text-gray-500 mx-1 dark:text-gray-500">/</span>
                                    <span className="text-gray-600 font-mono dark:text-gray-400">
                                            {quotaData?.LimitInfo.find(i => i.Type === 'tag')?.Value || '-'}
                                        </span>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
} 