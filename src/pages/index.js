import {useEffect, useState} from 'react';
import {isAuthenticated, setAccessKey} from '@/utils/auth';
import Navigation from '@/components/Navigation';
import ConfirmModal from '@/components/ConfirmModal';
import FormModal from '@/components/FormModal';
import TagListModal from '@/components/TagListModal';
import CreateTagModal from '@/components/CreateTagModal';
import {useTour} from '@/hooks/useTour';
import {APP_CONFIG} from '@/config/version';
import {apiRequest} from '@/utils/api';

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
    const [verifying, setVerifying] = useState(false);
    const [fetchNameSpacesIng, setFetchNameSpacesIng] = useState(false);
    const [namespaces, setNamespaces] = useState([]);
    const [selectedNamespace, setSelectedNamespace] = useState('');
    const [deletingRepo, setDeletingRepo] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({
        show: false,
        repo: null
    });
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [createTagRepo, setCreateTagRepo] = useState(null);
    const {startTour, shouldShowTour} = useTour('home');
    const [showTour, setShowTour] = useState(false);

    useEffect(() => {
        setIsAuth(isAuthenticated());
        setLoading(false);
    }, []);

    useEffect(() => {
        if (isAuth) {
            fetchRepositories(currentPage);
        }
    }, [isAuth, currentPage, pageSize]);

    useEffect(() => {
        if (isAuth && shouldShowTour) {
            startTour();
        }
    }, [isAuth, shouldShowTour]);

    const fetchRepositories = async (page, search = searchKey) => {
        setLoading(true);
        setError("");
        try {
            const response = await apiRequest(`/api/swr/repositories?page=${page}&pageSize=${pageSize}&searchKey=${encodeURIComponent(search)}`);
            const data = await response.json();
            if (data.success) {
                setRepositories(data);
                const total = data.data[0].total_range || 0;
                setTotalPages(Math.ceil(total / pageSize));
            } else {
                setError(data.message || '获取仓库列表失败');
            }
        } catch (error) {
            setError(error.message || '获取仓库列表失败');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setVerifying(true)
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

                // 检查是否首次访问首页
                const hasSeenTour = localStorage.getItem(`tour_home`);
                if (!hasSeenTour) {
                    // 登录成功后延迟一点时间再显示引导，确保页面已经渲染完成
                    setTimeout(() => {
                        startTour();
                    }, 500);
                }
            } else {
                setError('密钥无效');
            }
        } catch (err) {
            setError('验证过程出错');
        } finally {
            setVerifying(false);
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
    };

    // 新增处理回车事件的函数
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            fetchRepositories(1, searchKey); // 触发搜索
            setCurrentPage(1); // 重置到第一页
        }
    };

    // 新增处理搜索的函数
    const handleSearchClick = () => {
        fetchRepositories(1, searchKey); // 触发搜索
        setCurrentPage(1); // 重置到第一页
    };

    const fetchNamespaces = async () => {
        try {
            const response = await apiRequest('/api/swr/namespaces');
            const data = await response.json();

            if (data.success) {
                setNamespaces(data.data.namespaces || []);
                // 如果有命名空间，默认选中第一个
                if (data.data.namespaces && data.data.namespaces.length > 0) {
                    setSelectedNamespace(data.data.namespaces[0].name);
                }
            }
        } catch (error) {
            setError('获取命名空间列表失败');
        } finally {
            setFetchNameSpacesIng(false);
        }
    };

    const handleOpenCreateModal = async () => {
        setShowCreateModal(true);
        setFetchNameSpacesIng(true)
        await fetchNamespaces();
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

        setCreating(true);
        setError(null);

        try {
            const response = await apiRequest('/api/swr/create-repository', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    namespace: selectedNamespace,
                    repository: newRepoName.trim()
                }),
            });

            const data = await response.json();

            if (data.success) {
                setShowCreateModal(false);
                setNewRepoName('');
                setSelectedNamespace('');
                // 刷新列表
                await fetchRepositories(currentPage);
            } else {
                setError("创建仓库失败：" + data.error);
                setShowCreateModal(false);
            }
        } catch (error) {
            setError('创建仓库失败');
        } finally {
            setCreating(false);
            setLoading(false);
        }
    };

    const handleDeleteClick = (repo) => {
        if (repo.TagCount > 0) {
            return; // 如果有标签，直接返回，不执行删除操作
        }
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
        setDeletingRepo(repo.name);

        try {
            const response = await apiRequest(`/api/swr/delete-repository?namespace=${encodeURIComponent(repo.namespace)}&repository=${encodeURIComponent(repo.name)}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                // 刷新列表
                await fetchRepositories(currentPage);
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
        setSelectedRepo(repo.name);
        setSelectedNamespace(repo.namespace)
    };

    const handleToggleAccess = async (repo) => {
        try {
            setLoading(true);
            const response = await apiRequest('/api/swr/toggle-repo-access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    namespace: repo.namespace,
                    repository: repo.name,
                    isPublic: repo.is_public !== true
                }),
            });

            const data = await response.json();

            if (data.success) {
                // 刷新列表
                await fetchRepositories(currentPage);
            } else {
                setError("修改访问级别失败：" + data.error);
            }
        } catch (error) {
            setError('修改访问级别失败');
        } finally {
            setLoading(false);
        }
    };


    const handleCloseCreateTagModal = async (repo) => {
        setCreateTagRepo(null);
        await fetchRepositories(currentPage);
    }

    const handleCloseTagListModal = async (repo) => {
        setSelectedRepo(null);
        setSelectedNamespace("")
        await fetchRepositories(currentPage);
    }

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
                                <p className="text-gray-500 dark:text-gray-400">正在加载镜像仓库...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isAuth) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navigation/>
                <div className="container mx-auto p-4 mt-0">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center space-x-4">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    镜像总数: {repositories?.data?.[0]?.total_range || 0}
                                </div>
                                <button
                                    id="create-image-btn"
                                    onClick={handleOpenCreateModal}
                                    className="px-3 py-1.5 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-offset-gray-800"
                                >
                                    创建镜像
                                </button>
                                <div className="relative">
                                    <input
                                        id="search-image"
                                        type="text"
                                        value={searchKey}
                                        onChange={handleSearch}
                                        onKeyPress={handleKeyPress}
                                        placeholder="搜索镜像名称"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                    />
                                    {searchKey && (
                                        <button
                                            onClick={() => {
                                                setSearchKey('');
                                                fetchRepositories(1, '');
                                            }}
                                            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-700"
                                            title="清除搜索"
                                        >
                                            <svg
                                                className="w-4 h-4 text-gray-400 dark:text-gray-300"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    )}
                                    <button onClick={handleSearchClick}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <svg
                                            className="w-4 h-4 text-gray-400 dark:text-gray-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <label className="text-sm text-gray-600 dark:text-gray-300">每页显示：</label>
                                    <select
                                        value={pageSize}
                                        onChange={handlePageSizeChange}
                                        className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="5">5</option>
                                        <option value="10">10</option>
                                        <option value="20">20</option>
                                        <option value="50">50</option>
                                    </select>
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
                        </div>

                        {error && (
                            <div
                                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md mb-4">
                                <p className="font-medium">错误提示</p>
                                <p className="text-sm mt-1">{error}</p>
                            </div>
                        )}

                        {repositories && repositories.data.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th id="tag-list"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                命名空间/镜像名称
                                            </th>
                                            <th id="tag-count"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                标签数
                                            </th>
                                            <th id="access-level"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                访问级别
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                更新时间
                                            </th>
                                            <th id="repo-actions"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                操作
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody
                                            className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {repositories.data.map((repo, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    <button
                                                        onClick={() => handleRepoClick(repo)}
                                                        className="hover:underline focus:outline-none"
                                                    >
                                                        {`${repo.namespace}/${repo.name}`}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {repo.num_images}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {repo.is_public === true ? '公开' : '私有'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {repo.updated_at}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRepo(repo.name);
                                                                setSelectedNamespace(repo.namespace);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-600"
                                                        >
                                                            查看标签
                                                        </button>
                                                        <button
                                                            onClick={() => setCreateTagRepo(repo)}
                                                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-600"
                                                        >
                                                            新增标签
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleAccess(repo)}
                                                            className="text-sm rounded px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                                            title={repo.is_public === true ? "设为私有" : "设为公开"}
                                                        >
                                                            {repo.is_public === true ? "私有" : "公开"}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(repo)}
                                                            disabled={repo.TagCount > 0}
                                                            className={`group relative p-1 hover:bg-gray-100 rounded dark:hover:bg-gray-700 ${
                                                                repo.TagCount > 0 ? 'cursor-not-allowed opacity-50' : 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600'
                                                            }`}
                                                            title={repo.TagCount > 0 ? '仓库存在标签，请先删除所有标签' : '删除仓库'}
                                                        >
                                                            <svg
                                                                className="w-5 h-5"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
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
                                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                                                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
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
                                                        ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white'
                                                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
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
                                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                                                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                                            }`}
                                        >
                                            下一页
                                        </button>
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        第 {currentPage} 页，共 {totalPages} 页
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th id="tag-list"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            命名空间/镜像名称
                                        </th>
                                        <th id="tag-count"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            标签数
                                        </th>
                                        <th id="access-level"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            访问级别
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            更新时间
                                        </th>
                                        <th id="repo-actions"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            操作
                                        </th>
                                    </tr>
                                    </thead>
                                </table>
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    暂无镜像数据
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 创建仓库的模态框 */}
                <FormModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="创建新镜像"
                    isLoading={creating}
                >
                    <form onSubmit={handleCreateRepository}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                                选择命名空间
                            </label>
                            <select
                                value={selectedNamespace}
                                onChange={(e) => setSelectedNamespace(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:focus:ring-blue-600 dark:focus:border-blue-600 dark:bg-gray-700 dark:text-white"
                                disabled={creating || namespaces.length === 0}
                            >
                                {fetchNameSpacesIng === true ? (
                                    <option value="">获取中...</option>) : (namespaces.length === 0 ? (
                                    <option value="">暂无可用命名空间，请先创建</option>
                                ) : (
                                    namespaces.map((ns) => (
                                        <option key={ns.name} value={ns.name}>
                                            {ns.name}
                                        </option>
                                    ))
                                ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                                镜像名称
                            </label>
                            <input
                                type="text"
                                value={newRepoName}
                                onChange={(e) => setNewRepoName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:focus:ring-blue-600 dark:focus:border-blue-600 dark:bg-gray-700 dark:text-white"
                                placeholder="请输入镜像名称"
                                disabled={creating || !selectedNamespace}
                            />
                            {selectedNamespace && (
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    完整镜像名称: {selectedNamespace}/{newRepoName || '[镜像名称]'}
                                </p>
                            )}
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                注：镜像默认创建为私有镜像
                            </p>
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
                    message={`确定要删除仓库 "${deleteConfirm.repo?.namespace}/${deleteConfirm.repo?.name}" 吗？此操作不可恢复。`}
                    confirmText="删除"
                    cancelText="取消"
                    isLoading={!!deletingRepo}
                />

                {/* 标签列表模态框 */}
                <TagListModal
                    isOpen={!!selectedRepo}
                    onClose={() => handleCloseTagListModal()}
                    repoName={selectedRepo}
                    namespace={selectedNamespace}
                    username={process.env.NEXT_PUBLIC_HUAWEICLOUD_USERNAME}
                />

                {/* 新增标签模态框 */}
                {createTagRepo && (
                    <CreateTagModal
                        isOpen={!!createTagRepo}
                        onClose={() => handleCloseCreateTagModal()}
                        repoName={createTagRepo.name}
                        namespace={createTagRepo.namespace}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        Pocker - 镜像私服
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <input
                            type="password"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="请输入访问密钥"
                            required
                        />
                    </div>
                    {error && (
                        <div className="text-red-500 dark:text-red-400 text-sm text-center">{error}</div>
                    )}
                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                        >
                            {verifying ? '验证中...' : '验证'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
