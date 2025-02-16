import {useEffect, useState} from 'react';
import {getAccessKey, isAuthenticated} from '@/utils/auth';
import Navigation from '@/components/Navigation';
import {useRouter} from 'next/router';

export default function QuotaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quotaData, setQuotaData] = useState(null);
    const [usageData, setUsageData] = useState({
        namespaceCount: 0,
        repoCount: 0,
        tagCount: 0,
        triggerCount: 0,
        loading: {
            namespace: true,
            repo: true,
            tag: true,
            trigger: true
        }
    });

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

    // 获取触发器数量（如果有相关API的话）
    const fetchTriggerCount = async () => {
        try {
            // 实现触发器数量获取逻辑
            setUsageData(prev => ({
                ...prev,
                loading: {...prev.loading, trigger: false}
            }));
        } catch (error) {
            console.error('获取触发器数量失败:', error);
        }
    };

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/');
            return;
        }

        // 并行发起所有请求
        Promise.all([
            fetchQuotaData(),
            fetchNamespaceCount(),
            fetchRepoAndTagCount(),
            fetchTriggerCount()
        ]).finally(() => {
            setLoading(false);
        });
    }, [router]);

    const isAllDataLoaded = !usageData.loading.namespace && 
                           !usageData.loading.repo && 
                           !usageData.loading.tag && 
                           !usageData.loading.trigger;

    if (loading || !isAllDataLoaded) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navigation/>
                <div className="container mx-auto p-4 mt-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-center items-center h-64">
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                                <p className="text-gray-500">正在加载配额信息...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation/>
            <div className="container mx-auto p-4 mt-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        资源类型
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        使用情况
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">命名空间数量</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="text-blue-600 font-mono">{usageData.namespaceCount}</span>
                                        <span className="text-gray-500 mx-1">/</span>
                                        <span className="text-gray-600 font-mono">
                                            {quotaData?.LimitInfo.find(i => i.Type === 'namespace')?.Value || '-'}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">仓库数量</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="text-blue-600 font-mono">{usageData.repoCount}</span>
                                        <span className="text-gray-500 mx-1">/</span>
                                        <span className="text-gray-600 font-mono">
                                            {quotaData?.LimitInfo.find(i => i.Type === 'repo')?.Value || '-'}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">标签总数</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="text-blue-600 font-mono">{usageData.tagCount}</span>
                                        <span className="text-gray-500 mx-1">/</span>
                                        <span className="text-gray-600 font-mono">
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