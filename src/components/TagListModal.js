import {useEffect, useState} from 'react';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import {SWR_CONSTANTS} from '@/utils/constants';
import {apiRequest} from '@/utils/api';

export default function TagListModal({isOpen, onClose, repoName, namespace, username: defaultUsername}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tags, setTags] = useState(null);
    const [copyStatus, setCopyStatus] = useState('');
    const [deletingTag, setDeletingTag] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [deleteConfirm, setDeleteConfirm] = useState({
        show: false,
        tag: null,
        repoName: null
    });
    const [searchKey, setSearchKey] = useState('');
    const [username, setUsername] = useState(defaultUsername || '');
    const [server, setServer] = useState('');
    const [currentRegion, setCurrentRegion] = useState('');

    useEffect(() => {
        if (isOpen) {
            const region = localStorage.getItem(SWR_CONSTANTS.CURRENT_REGION_KEY) || 'cn-north-4';
            setCurrentRegion(region);
            setServer(`swr.${region}.myhuaweicloud.com`);

            if (defaultUsername && defaultUsername.includes('@')) {
                const parts = defaultUsername.split('@');
                const newUsername = `${region}@${parts[1]}`;
                setUsername(newUsername);
            } else {
                setUsername(defaultUsername || '');
            }
        }
    }, [isOpen, defaultUsername]);

    // 获取总数的函数
    const fetchTotalCount = async (search = searchKey) => {
        try {
            const response = await apiRequest(
                `/api/swr/image-tags?namespace=${encodeURIComponent(namespace)}&repository=${encodeURIComponent(repoName)}&page=1&pageSize=1000&searchKey=${encodeURIComponent(search)}`);
            const data = await response.json();

            if (data.success) {
                const total = data.data.length || 0;
                setTotalCount(total);
                setTotalPages(Math.ceil(total / pageSize));
                return total;
            }
            return 0;
        } catch (error) {
            console.error('获取总数失败:', error);
            return 0;
        }
    };

    // 获取当前页数据的函数
    const fetchTags = async (page, search = searchKey) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiRequest(
                `/api/swr/image-tags?namespace=${encodeURIComponent(namespace)}&repository=${encodeURIComponent(repoName)}&page=${page}&pageSize=${pageSize}&searchKey=${encodeURIComponent(search)}`);
            const data = await response.json();

            if (data.success) {
                setTags(data.data);
            } else {
                setError('获取标签列表失败');
            }
        } catch (error) {
            setError('获取标签列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && repoName) {
            const initData = async () => {
                setLoading(true);
                await fetchTotalCount();
                await fetchTags(currentPage);
            };
            initData();
        }
    }, [isOpen, repoName]);

    useEffect(() => {
        if (isOpen && repoName) {
            fetchTags(currentPage);
        }
    }, [currentPage, pageSize]);

    const formatSize = (size) => {
        if (typeof size === 'string') return size;
        const mb = size / (1024 * 1024);
        return `${mb.toFixed(2)} MB`;
    };

    const handleCopy = async (tag) => {
        const fullImageUrl = `${tag.path}`;
        try {
            await navigator.clipboard.writeText(fullImageUrl);
            setCopyStatus(tag.Tag);
            setTimeout(() => {
                setCopyStatus('');
            }, 1500);
        } catch (err) {
            setError('复制失败');
        }
    };

    const handleDeleteClick = (tag) => {
        setDeleteConfirm({
            show: true,
            tag,
            repoName: repoName
        });
    };

    const handleDeleteCancel = () => {
        setDeleteConfirm({
            show: false,
            tag: null,
            repoName: null
        });
    };

    const handleDeleteConfirm = async () => {
        const tag = deleteConfirm.tag;
        const currentRepoName = deleteConfirm.repoName;
        setDeletingTag(tag.Tag);

        try {
            const response = await apiRequest(
                `/api/swr/delete-tag?namespace=${encodeURIComponent(namespace)}&repository=${encodeURIComponent(currentRepoName)}&tag=${encodeURIComponent(tag.Tag)}`,
                {
                    method: 'DELETE',
                }
            );

            const data = await response.json();

            if (data.success) {
                await fetchTags(currentPage);
            } else {
                setError("删除标签失败：" + data.error);
            }
        } catch (error) {
            setError('删除标签失败');
        } finally {
            setDeletingTag(null);
            setDeleteConfirm({
                show: false,
                tag: null,
                repoName: null
            });
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handlePageSizeChange = async (e) => {
        const newSize = parseInt(e.target.value);
        setPageSize(newSize);
        setCurrentPage(1);
        // 重新计算总页数
        setTotalPages(Math.ceil(totalCount / newSize));
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchKey(value);
    };

    const handleKeyPress = async (e) => {
        if (e.key === 'Enter') {
            setCurrentPage(1);
            await fetchTotalCount(searchKey);
            await fetchTags(1);
        }
    };

    const handleSearchClick = async () => {
        setCurrentPage(1);
        await fetchTotalCount(searchKey);
        await fetchTags(1);
    };

    const handleClearSearch = async () => {
        setSearchKey('');
        setCurrentPage(1);
        await fetchTotalCount('');
        await fetchTags(1, '');
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={`镜像标签列表 - ${namespace}/${repoName}`}
                maxWidth="max-w-4xl"
                maxHeight="max-h-[93vh]"
            >
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div
                            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div
                        className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md dark:bg-red-700 dark:text-white">
                        <p className="text-sm">{error}</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm text-yellow-600 font-bold mt-4">
                            <span className="font-semibold">💡</span> 请确保在首次使用前运行以下命令：
                            <code className="font-mono text-yellow-700 dark:text-yellow-500">
                                docker login {server} --username={username}
                            </code><br/>
                            <span className="font-semibold">🔑</span> 密码就是环境变量 HUAWEICLOUD_PASSWORD 的值
                        </p>
                        <div className="mb-4 flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                {tags && (
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        标签总数：<span className="font-medium text-blue-600 dark:text-blue-400">
                                            {totalCount}
                                        </span>
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchKey}
                                        onChange={handleSearch}
                                        onKeyPress={handleKeyPress}
                                        placeholder="搜索标签"
                                        className="w-48 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400"
                                    />
                                    {searchKey ? (
                                        <button
                                            onClick={handleClearSearch}
                                            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                            title="清除搜索"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor"
                                                 viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                      d="M6 18L18 6M6 6l12 12"/>
                                            </svg>
                                        </button>
                                    ) : null}
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
                        </div>
                        {tags && tags.length > 0 ? (
                            <>
                                <div className="overflow-x-auto max-h-[calc(100vh-16rem)] scrollbar-custom">
                                    <style jsx global>{`
                                        .scrollbar-custom {
                                            scrollbar-width: thin;
                                            scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
                                        }

                                        .dark .scrollbar-custom {
                                            scrollbar-color: rgba(75, 85, 99, 0.5) transparent;
                                        }

                                        .scrollbar-custom::-webkit-scrollbar {
                                            width: 8px;
                                            height: 8px;
                                        }

                                        .scrollbar-custom::-webkit-scrollbar-track {
                                            background: transparent;
                                        }

                                        .scrollbar-custom::-webkit-scrollbar-thumb {
                                            background-color: rgba(156, 163, 175, 0.5);
                                            border-radius: 4px;
                                        }

                                        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
                                            background-color: rgba(156, 163, 175, 0.7);
                                        }

                                        .dark .scrollbar-custom::-webkit-scrollbar-thumb {
                                            background-color: rgba(75, 85, 99, 0.5);
                                        }

                                        .dark .scrollbar-custom::-webkit-scrollbar-thumb:hover {
                                            background-color: rgba(75, 85, 99, 0.7);
                                        }
                                    `}</style>
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">标签</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">大小</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">推送时间</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">操作</th>
                                        </tr>
                                        </thead>
                                        <tbody
                                            className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {tags.map((tag, index) => (
                                            <tr key={`${tag.Tag}-${index}`}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-600 dark:text-blue-500">
                                                    {tag.Tag}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {formatSize(tag.size)}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {tag.updated}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => handleCopy(tag)}
                                                            className="group relative p-1 hover:bg-gray-100 rounded dark:hover:bg-gray-500"
                                                            title={`复制：${tag.path}`}
                                                        >
                                                            {copyStatus === tag.Tag ? (
                                                                <svg
                                                                    className="w-5 h-5 text-green-500 dark:text-green-400"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round"
                                                                          strokeWidth={2}
                                                                          d="M5 13l4 4L19 7"/>
                                                                </svg>
                                                            ) : (
                                                                <svg
                                                                    className="w-5 h-5 text-gray-400 group-hover:text-gray-500 dark:text-gray-300 dark:group-hover:text-gray-400"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round"
                                                                          strokeWidth={2}
                                                                          d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
                                                                </svg>
                                                            )}
                                                            <span className="sr-only">复制镜像地址</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(tag)}
                                                            disabled={deletingTag === tag.Tag}
                                                            className={`group relative p-1 hover:bg-gray-100 rounded dark:hover:bg-gray-500 ${
                                                                deletingTag === tag.Tag ? 'opacity-50 cursor-not-allowed' : ''
                                                            }`}
                                                            title="删除标签"
                                                        >
                                                            <svg className="w-5 h-5 text-red-500 dark:text-red-400"
                                                                 fill="none"
                                                                 viewBox="0 0 24 24"
                                                                 stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                                      strokeWidth={2}
                                                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* 添加分页控件 */}
                                <div className="mt-2 flex items-center justify-between">
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
                            <div className="text-center py-8 text-gray-500 dark:text-gray-300">
                                {searchKey ? '没有找到匹配的标签' : '暂无标签数据'}
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* 删除确认模态框 */}
            <ConfirmModal
                isOpen={deleteConfirm.show}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="删除标签"
                message={`确定要删除标签 "${deleteConfirm.tag?.Tag}" 吗？此操作不可恢复。`}
                confirmText="删除"
                cancelText="取消"
                isLoading={!!deletingTag}
            />
        </>
    );
} 