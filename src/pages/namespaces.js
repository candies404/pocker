import Navigation from '@/components/Navigation';
import {useEffect, useState} from 'react';
import {getAccessKey, isAuthenticated} from '@/utils/auth';
import {useRouter} from 'next/router';

export default function NamespacesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [namespaces, setNamespaces] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/');
            return;
        }
        fetchNamespaces();
    }, [router]);

    const fetchNamespaces = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/tcr/namespaces', {
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const data = await response.json();

            if (data.success === false) {
                setError(data.message);
            } else {
                setNamespaces(data.Data);
            }
            setLoading(false);
        } catch (error) {
            setError(error.message || '获取命名空间列表失败');
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
                        <div className="text-sm text-gray-500">
                            命名空间总数: {namespaces?.NamespaceCount || 0}
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

                    {namespaces && namespaces.NamespaceInfo.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        命名空间
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        仓库数量
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        创建时间
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {namespaces.NamespaceInfo.map((namespace, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                            {namespace.Namespace}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {namespace.RepoCount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {namespace.CreationTime}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            暂无命名空间数据
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 