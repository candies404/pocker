import {useEffect, useState} from 'react';
import {getAccessKey, isAuthenticated, setAccessKey} from '@/utils/auth';
import {Geist, Geist_Mono} from "next/font/google";
import Navigation from '@/components/Navigation';
import ConfirmModal from '@/components/ConfirmModal';
import FormModal from '@/components/FormModal';
import TagListModal from '@/components/TagListModal';

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export default function HomePage() {
    const [key, setKey] = useState('');
    const [isAuth, setIsAuth] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [repositories, setRepositories] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [searchKey, setSearchKey] = useState('');
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRepoName, setNewRepoName] = useState('');
    const [creating, setCreating] = useState(false);
    const [namespaces, setNamespaces] = useState([]);
    const [selectedNamespace, setSelectedNamespace] = useState('');
    const [deletingRepo, setDeletingRepo] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({
        show: false,
        repo: null
    });
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [selectedRepos, setSelectedRepos] = useState(new Set());
    const [batchDeleting, setBatchDeleting] = useState(false);
    const [batchDeleteConfirm, setBatchDeleteConfirm] = useState(false);

    useEffect(() => {
        setIsAuth(isAuthenticated());
        setLoading(false);
    }, []);

    useEffect(() => {
        if (isAuth) {
            fetchRepositories(currentPage);
        }
    }, [isAuth, currentPage, pageSize]);

    const fetchRepositories = async (page, search = searchKey) => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch(`/api/tcr/repositories?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`, {
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const data = await response.json();
            if (data.Data) {
                setRepositories(data.Data);
                const total = data.Data.TotalCount;
                setTotalPages(Math.ceil(total / pageSize));
            } else if (data.code === "ResourceNotFound.ErrNoUser") {
                setError('获取仓库列表失败：ResourceNotFound.ErrNoUser');
            } else {
                setError('获取仓库列表失败');
            }
            setLoading(false);
        } catch (error) {
            setError(error.message || '获取仓库列表失败');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('/api/verify-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({key}),
            });

            const data = await response.json();

            if (data.success) {
                setAccessKey(key);
                setIsAuth(true);
            } else {
                setError('密钥无效');
            }
        } catch (err) {
            setError('验证过程出错');
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

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchKey(value);

        // 清除之前的定时器
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // 设置新的定时器，300ms 后执行搜索
        const timeoutId = setTimeout(() => {
            setCurrentPage(1); // 重置到第一页
            fetchRepositories(1, value);
        }, 300);

        setSearchTimeout(timeoutId);
    };

    const fetchNamespaces = async () => {
        try {
            const response = await fetch('/api/tcr/namespaces', {
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const data = await response.json();

            if (data.Data && data.Data.NamespaceInfo) {
                setNamespaces(data.Data.NamespaceInfo);
                // 如果有命名空间，默认选中第一个
                if (data.Data.NamespaceInfo.length > 0) {
                    setSelectedNamespace(data.Data.NamespaceInfo[0].Namespace);
                }
            }
        } catch (error) {
            setError('获取命名空间列表失败');
        }
    };

    const handleOpenCreateModal = () => {
        setShowCreateModal(true);
        fetchNamespaces();
    };

    const handleCreateRepository = async (e) => {
        e.preventDefault();
        if (!selectedNamespace) {
            setError('请选择命名空间');
            return;
        }
        if (!newRepoName.trim()) {
            setError('仓库名称不能为空');
            return;
        }

        const fullRepoName = `${selectedNamespace}/${newRepoName.trim()}`;

        setCreating(true);
        try {
            const response = await fetch('/api/tcr/create-repository', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-key': getAccessKey(),
                },
                body: JSON.stringify({
                    repoName: fullRepoName
                }),
            });

            const data = await response.json();

            if (data.success) {
                setShowCreateModal(false);
                setNewRepoName('');
                setSelectedNamespace('');
                // 刷新列表
                fetchRepositories(currentPage);
            } else {
                setError("创建仓库失败：" + data.error);
                setShowCreateModal(false);
            }
        } catch (error) {
            setError('创建仓库失败');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteClick = (repo) => {
        setDeleteConfirm({
            show: true,
            repo
        });
    };

    const handleDeleteCancel = () => {
        setDeleteConfirm({
            show: false,
            repo: null
        });
    };

    const handleDeleteConfirm = async () => {
        const repo = deleteConfirm.repo;
        setDeletingRepo(repo.RepoName);

        try {
            const response = await fetch(`/api/tcr/delete-repository?repoName=${encodeURIComponent(repo.RepoName)}`, {
                method: 'DELETE',
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });

            const data = await response.json();

            if (data.success) {
                // 刷新列表
                fetchRepositories(currentPage);
            } else {
                setError("删除仓库失败：" + data.error);
            }
        } catch (error) {
            setError('删除仓库失败');
        } finally {
            setDeletingRepo(null);
            setDeleteConfirm({
                show: false,
                repo: null
            });
        }
    };

    const handleRepoClick = (repo) => {
        setSelectedRepo(repo.RepoName);
    };

    const handleSelectRepo = (repoName) => {
        const newSelected = new Set(selectedRepos);
        if (newSelected.has(repoName)) {
            newSelected.delete(repoName);
        } else {
            newSelected.add(repoName);
        }
        setSelectedRepos(newSelected);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allRepos = new Set(repositories.RepoInfo.map(repo => repo.RepoName));
            setSelectedRepos(allRepos);
        } else {
            setSelectedRepos(new Set());
        }
    };

    const handleBatchDelete = () => {
        setBatchDeleteConfirm(true);
    };

    const handleBatchDeleteConfirm = async () => {
        setBatchDeleting(true);
        try {
            const response = await fetch('/api/tcr/batch-delete-repository', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-key': getAccessKey(),
                },
                body: JSON.stringify({
                    repoNames: Array.from(selectedRepos)
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSelectedRepos(new Set());
                fetchRepositories(currentPage);
            } else {
                setError("批量删除仓库失败：" + data.error);
            }
        } catch (error) {
            setError('批量删除仓库失败');
        } finally {
            setBatchDeleting(false);
            setBatchDeleteConfirm(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (isAuth) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navigation/>
                <div className="container mx-auto p-4 mt-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center space-x-4">
                                <div className="text-sm text-gray-500">
                                    总仓库数: {repositories?.TotalCount || 0}
                                </div>
                                <button
                                    onClick={handleOpenCreateModal}
                                    className="px-3 py-1.5 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                >
                                    创建仓库
                                </button>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchKey}
                                        onChange={handleSearch}
                                        placeholder="搜索仓库名称..."
                                        className="pl-8 pr-4 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <svg
                                        className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </div>
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

                        {repositories && repositories.RepoInfo.length > 0 ? (
                            <>
                                {/* 添加批量删除按钮 */}
                                {selectedRepos.size > 0 && (
                                    <div className="mt-4 flex items-center space-x-2">
                                        <span className="text-sm text-gray-500">
                                            已选择 {selectedRepos.size} 个仓库
                                        </span>
                                        <button
                                            onClick={handleBatchDelete}
                                            disabled={batchDeleting}
                                            className="px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50"
                                        >
                                            {batchDeleting ? '删除中...' : '批量删除'}
                                        </button>
                                    </div>
                                )}
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    checked={selectedRepos.size === repositories?.RepoInfo.length}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                仓库名称
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
                                                创建时间
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                更新时间
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                操作
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                        {repositories.RepoInfo.map((repo, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        checked={selectedRepos.has(repo.RepoName)}
                                                        onChange={() => handleSelectRepo(repo.RepoName)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                                    <button
                                                        onClick={() => handleRepoClick(repo)}
                                                        className="hover:underline focus:outline-none"
                                                    >
                                                        {repo.RepoName}
                                                    </button>
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
                                                    {repo.CreationTime}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {repo.UpdateTime}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <button
                                                        onClick={() => handleDeleteClick(repo)}
                                                        disabled={deletingRepo === repo.RepoName}
                                                        className={`text-sm rounded px-2 py-1 ${
                                                            deletingRepo === repo.RepoName
                                                                ? 'bg-red-100 text-red-400'
                                                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                        }`}
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
                                暂无仓库数据
                            </div>
                        )}
                    </div>
                </div>

                {/* 创建仓库的模态框 */}
                <FormModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="创建新仓库"
                    isLoading={creating}
                >
                    <form onSubmit={handleCreateRepository}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                选择命名空间
                            </label>
                            <select
                                value={selectedNamespace}
                                onChange={(e) => setSelectedNamespace(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                disabled={creating || namespaces.length === 0}
                            >
                                {namespaces.length === 0 ? (
                                    <option value="">暂无可用命名空间，请先创建</option>
                                ) : (
                                    namespaces.map((ns) => (
                                        <option key={ns.Namespace} value={ns.Namespace}>
                                            {ns.Namespace}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                仓库名称
                            </label>
                            <input
                                type="text"
                                value={newRepoName}
                                onChange={(e) => setNewRepoName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="请输入仓库名称"
                                disabled={creating || !selectedNamespace}
                            />
                            {selectedNamespace && (
                                <p className="mt-2 text-sm text-gray-500">
                                    完整仓库名称: {selectedNamespace}/{newRepoName || '[仓库名称]'}
                                </p>
                            )}
                            <p className="mt-1 text-sm text-gray-500">
                                注：仓库默认创建为私有仓库
                            </p>
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
                                disabled={creating || !selectedNamespace || !newRepoName.trim()}
                            >
                                {creating ? '创建中...' : '创建'}
                            </button>
                        </div>
                    </form>
                </FormModal>

                {/* 删除确认模态框 */}
                <ConfirmModal
                    isOpen={deleteConfirm.show}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    title="删除仓库"
                    message={`确定要删除仓库 "${deleteConfirm.repo?.RepoName}" 吗？此操作不可恢复。`}
                    confirmText="删除"
                    cancelText="取消"
                    confirmButtonClass="bg-red-600 hover:bg-red-700"
                    isLoading={!!deletingRepo}
                />

                {/* 标签列表模态框 */}
                <TagListModal
                    isOpen={!!selectedRepo}
                    onClose={() => setSelectedRepo(null)}
                    repoName={selectedRepo}
                />

                {/* 批量删除确认模态框 */}
                <ConfirmModal
                    isOpen={batchDeleteConfirm}
                    onClose={() => setBatchDeleteConfirm(false)}
                    onConfirm={handleBatchDeleteConfirm}
                    title="批量删除仓库"
                    message={`确定要删除选中的 ${selectedRepos.size} 个仓库吗？此操作不可恢复。`}
                    confirmText="删除"
                    cancelText="取消"
                    confirmButtonClass="bg-red-600 hover:bg-red-700"
                    isLoading={batchDeleting}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-gray-900">
                        请输入访问密钥
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <input
                            type="password"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="请输入密钥"
                            required
                        />
                    </div>
                    {error && (
                        <div className="text-red-500 text-sm text-center">{error}</div>
                    )}
                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            验证
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
