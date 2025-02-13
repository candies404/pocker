import Navigation from '@/components/Navigation';
import {useEffect, useState} from 'react';
import {getAccessKey, isAuthenticated} from '@/utils/auth';
import {useRouter} from 'next/router';

export default function RepositoriesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [repositories, setRepositories] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/');
            return;
        }
        fetchRepositories();
    }, [router]);

    const fetchRepositories = async () => {
        try {
            const response = await fetch('/api/tcr/repositories', {
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const data = await response.json();
            if (data.Data) {
                setRepositories(data.Data);
            } else if (data.code === "ResourceNotFound.ErrNoUser") {
                setError('获取仓库列表失败:ResourceNotFound.ErrNoUser');
            } else {
                setError('获取仓库列表失败');
            }
            setLoading(false);
        } catch (error) {
            console.error('获取仓库列表失败:', error);
            setError('获取仓库列表失败');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation/>
            <div className="container mx-auto p-4 mt-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">镜像仓库管理</h2>
                        <div className="text-sm text-gray-500">
                            总仓库数: {repositories?.TotalCount || 0}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                            <p className="font-medium">错误提示</p>
                            <p className="text-sm mt-1">{error}</p>
                            {error.includes('ResourceNotFound.ErrNoUser') && (
                                <a
                                    href="https://console.cloud.tencent.com/tcr/repository"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
                                >
                                    点击此处前往控制台初始化
                                </a>
                            )}
                        </div>
                    )}

                    {repositories && repositories.RepoInfo.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        仓库名称
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        类型
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        标签数
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        拉取次数
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        访问级别
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        更新时间
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {repositories.RepoInfo.map((repo, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                            {repo.RepoName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {repo.RepoType}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {repo.TagCount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {repo.PullCount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {repo.Public ? '公开' : '私有'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {repo.UpdateTime}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            暂无仓库数据
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 