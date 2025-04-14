import Navigation from '@/components/Navigation';
import {useEffect, useState} from 'react';
import {getAccessKey, isAuthenticated} from '@/utils/auth';
import {useRouter} from 'next/router';
import ConfirmModal from '@/components/ConfirmModal';
import FormModal from '@/components/FormModal';
import {useTour} from '@/hooks/useTour';
import withPageAuth from '@/utils/withPageAuth';
import {APP_CONFIG} from '@/config/version';

function NamespacesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [namespaces, setNamespaces] = useState(null);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newNamespace, setNewNamespace] = useState('');
    const [creating, setCreating] = useState(false);
    const [deletingNamespace, setDeletingNamespace] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({
        show: false,
        namespace: null
    });
    const [isAuth, setIsAuth] = useState(false);
    const {startTour} = useTour('namespaces');

    useEffect(() => {
        setIsAuth(isAuthenticated());
        setLoading(false);
    }, []);

    useEffect(() => {
        if (isAuth) {
            fetchNamespaces();
        }
    }, [isAuth]);

    const fetchNamespaces = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch('/api/swr/namespaces', {
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const data = await response.json();
            if (data.success) {
                setNamespaces(data.data);
            } else {
                setError(data.message || '获取命名空间列表失败');
            }
        } catch (error) {
            setError(error.message || '获取命名空间列表失败');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNamespace = async (e) => {
        e.preventDefault();
        if (!newNamespace.trim()) {
            setError('命名空间名称不能为空');
            return;
        }

        setCreating(true);
        try {
            const response = await fetch('/api/swr/create-namespace', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-key': getAccessKey(),
                },
                body: JSON.stringify({
                    namespace: newNamespace.trim()
                }),
            });

            const data = await response.json();

            if (data.success) {
                setShowCreateModal(false);
                setNewNamespace('');
                // 刷新列表
                fetchNamespaces();
            } else {
                setError(data.message || "创建命名空间失败");
                setShowCreateModal(false);
            }
        } catch (error) {
            setError('创建命名空间失败');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteClick = (namespace) => {
        setDeleteConfirm({
            show: true,
            namespace
        });
    };

    const handleDeleteCancel = () => {
        setDeleteConfirm({
            show: false,
            namespace: null
        });
    };

    const handleDeleteConfirm = async () => {
        const namespace = deleteConfirm.namespace;
        setDeletingNamespace(namespace);

        try {
            const response = await fetch(`/api/swr/delete-namespace?namespace=${encodeURIComponent(namespace)}`, {
                method: 'DELETE',
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });

            const data = await response.json();

            if (data.success) {
                // 刷新列表
                fetchNamespaces();
            } else {
                setError(data.message || "删除命名空间失败");
            }
        } catch (error) {
            setError('删除命名空间失败');
        } finally {
            setDeletingNamespace(null);
            setDeleteConfirm({
                show: false,
                namespace: null
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navigation/>
                <div className="container mx-auto p-4 mt-0">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex justify-center items-center h-64">
                            <div className="flex flex-col items-center">
                                <div
                                    className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500 mb-4"></div>
                                <p className="text-gray-500 dark:text-gray-400">正在加载命名空间...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
            <Navigation/>
            <div className="container mx-auto p-4 mt-0">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-500 dark:text-gray-300">
                                命名空间总数: {namespaces?.namespaces?.length || 0}
                            </div>
                            <button
                                id="create-namespace-btn"
                                onClick={() => setShowCreateModal(true)}
                                className="px-3 py-1.5 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-500"
                            >
                                创建命名空间
                            </button>
                        </div>
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

                    {namespaces?.namespaces?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        命名空间
                                    </th>
                                    <th id="repository-count"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        镜像数量
                                    </th>
                                    <th id="del-namespace"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        操作
                                    </th>
                                </tr>
                                </thead>
                                <tbody
                                    className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                {namespaces.namespaces.map((namespace, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                                            {namespace.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            {namespace.repo_count || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                            <button
                                                onClick={() => handleDeleteClick(namespace.name)}
                                                disabled={namespace.repo_count > 0}
                                                className={`text-sm rounded px-2 py-1 ${
                                                    namespace.repo_count > 0
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-300 dark:text-gray-500 dark:cursor-not-allowed'
                                                        : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-700 dark:text-red-300 dark:hover:bg-red-600 dark:hover:bg-red-700'
                                                } dark:bg-gray-700 dark:text-gray-500`}
                                                title={namespace.repo_count > 0 ? "无法删除非空命名空间" : ""}
                                            >
                                                删除
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        命名空间
                                    </th>
                                    <th id="repository-count"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        镜像数量
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        创建时间
                                    </th>
                                    <th id="del-namespace"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        操作
                                    </th>
                                </tr>
                                </thead>
                            </table>
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                暂无命名空间数据
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 删除确认模态框 */}
            <ConfirmModal
                isOpen={deleteConfirm.show}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="删除命名空间"
                message={`确定要删除命名空间 "${deleteConfirm.namespace}" 吗？此操作不可恢复。`}
                confirmText="删除"
                cancelText="取消"
                isLoading={!!deletingNamespace}
            />

            {/* 创建命名空间的模态框 */}
            <FormModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="创建新命名空间"
                isLoading={creating}
            >
                <form onSubmit={handleCreateNamespace}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                            命名空间名称
                        </label>
                        <input
                            type="text"
                            value={newNamespace}
                            onChange={(e) => setNewNamespace(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:focus:ring-blue-600 dark:focus:border-blue-600 dark:bg-gray-700 dark:text-white"
                            placeholder="请输入命名空间名称"
                            disabled={creating}
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-white dark:hover:text-white"
                            disabled={creating}
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-blue-400 dark:disabled:bg-blue-500 dark:text-white"
                            disabled={creating}
                        >
                            {creating ? '创建中...' : '创建'}
                        </button>
                    </div>
                </form>
            </FormModal>
        </div>
    );
}

export default withPageAuth(NamespacesPage); 