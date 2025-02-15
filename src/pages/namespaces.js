import Navigation from '@/components/Navigation';
import {useEffect, useState} from 'react';
import {getAccessKey, isAuthenticated} from '@/utils/auth';
import {useRouter} from 'next/router';
import ConfirmModal from '@/components/ConfirmModal';

export default function NamespacesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [namespaces, setNamespaces] = useState(null);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newNamespace, setNewNamespace] = useState('');
    const [creating, setCreating] = useState(false);
    const [deletingNamespace, setDeletingNamespace] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({
        show: false,
        namespace: null
    });

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/');
            return;
        }
        fetchNamespaces(currentPage);
        setError("")
    }, [router, currentPage, pageSize]);

    const fetchNamespaces = async (page) => {
        setLoading(true);
        setError("")
        try {
            const response = await fetch(`/api/tcr/namespaces?page=${page}&pageSize=${pageSize}`, {
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const data = await response.json();

            if (data.success === false) {
                setError(data.message);
            } else {
                setNamespaces(data.Data);
                // 计算总页数
                const total = data.Data.NamespaceCount;
                setTotalPages(Math.ceil(total / pageSize));
            }
            setLoading(false);
        } catch (error) {
            setError(error.message || '获取命名空间列表失败');
            setLoading(false);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handlePageSizeChange = (e) => {
        const newSize = parseInt(e.target.value);
        setPageSize(newSize);
        setCurrentPage(1); // 重置到第一页
    };

    const handleCreateNamespace = async (e) => {
        e.preventDefault();
        if (!newNamespace.trim()) {
            setError('命名空间名称不能为空');
            return;
        }

        setCreating(true);
        try {
            const response = await fetch('/api/tcr/create-namespace', {
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
                fetchNamespaces(currentPage);
            } else {
                setError("创建命名空间失败：" + data.error);
                setShowCreateModal(false)
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
            const response = await fetch(`/api/tcr/delete-namespace?namespace=${encodeURIComponent(namespace)}`, {
                method: 'DELETE',
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });

            const data = await response.json();

            if (data.success) {
                // 刷新列表
                fetchNamespaces(currentPage);
            } else {
                setError("删除命名空间失败：" + data.error);
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
                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-500">
                                命名空间总数: {namespaces?.NamespaceCount || 0}
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-3 py-1.5 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            >
                                创建命名空间
                            </button>
                        </div>
                        <div className="flex items-center space-x-4">
                            <label className="text-sm text-gray-600">每页显示：</label>
                            <select
                                value={pageSize}
                                onChange={handlePageSizeChange}
                                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </select>
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
                        <>
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            操作
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
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <button
                                                    onClick={() => handleDeleteClick(namespace.Namespace)}
                                                    disabled={namespace.RepoCount > 0}
                                                    className={`text-sm rounded px-2 py-1 ${
                                                        namespace.RepoCount > 0
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                    }`}
                                                    title={namespace.RepoCount > 0 ? "无法删除非空命名空间" : ""}
                                                >
                                                    删除
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* 分页控件 */}
                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1 rounded-md text-sm ${
                                            currentPage === 1
                                                ? 'bg-gray-100 text-gray-400'
                                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                        }`}
                                    >
                                        上一页
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handlePageChange(i + 1)}
                                            className={`px-3 py-1 rounded-md text-sm ${
                                                currentPage === i + 1
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`px-3 py-1 rounded-md text-sm ${
                                            currentPage === totalPages
                                                ? 'bg-gray-100 text-gray-400'
                                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                        }`}
                                    >
                                        下一页
                                    </button>
                                </div>
                                <div className="text-sm text-gray-500">
                                    第 {currentPage} 页，共 {totalPages} 页
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            暂无命名空间数据
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
                confirmButtonClass="bg-red-600 hover:bg-red-700"
                isLoading={!!deletingNamespace}
            />

            {/* 创建命名空间的模态框 */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium mb-4">创建新命名空间</h3>
                        <form onSubmit={handleCreateNamespace}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    命名空间名称
                                </label>
                                <input
                                    type="text"
                                    value={newNamespace}
                                    onChange={(e) => setNewNamespace(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="请输入命名空间名称"
                                    disabled={creating}
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                                    disabled={creating}
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-blue-400"
                                    disabled={creating}
                                >
                                    {creating ? '创建中...' : '创建'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 