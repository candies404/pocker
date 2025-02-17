import {useEffect, useState} from 'react';
import FormModal from '@/components/FormModal';
import {getAccessKey} from '@/utils/auth';
import ConfirmModal from '@/components/ConfirmModal';

export default function TagListModal({isOpen, onClose, repoName}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tags, setTags] = useState(null);
    const [copyStatus, setCopyStatus] = useState('');
    const [deletingTag, setDeletingTag] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({
        show: false,
        tag: null,
        repoName: null
    });
    const [selectedTags, setSelectedTags] = useState(new Set());
    const [batchDeleting, setBatchDeleting] = useState(false);
    const [batchDeleteConfirm, setBatchDeleteConfirm] = useState({
        show: false,
        repoName: null
    });

    useEffect(() => {
        if (isOpen && repoName) {
            fetchTags();
        }
    }, [isOpen, repoName]);

    const fetchTags = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/tcr/image-tags?repoName=${encodeURIComponent(repoName)}`, {
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const data = await response.json();

            if (data.Data) {
                setTags(data.Data);
            } else {
                setError('获取标签列表失败');
            }
        } catch (error) {
            setError('获取标签列表失败');
        } finally {
            setLoading(false);
        }
    };

    const formatSize = (size) => {
        if (typeof size === 'string') return size;
        const mb = size / (1024 * 1024);
        return `${mb.toFixed(2)} MB`;
    };

    const handleCopy = async (tag) => {
        const fullImageUrl = `${tags.Server}/${repoName}:${tag.TagName}`;
        try {
            await navigator.clipboard.writeText(fullImageUrl);
            setCopyStatus(tag.TagId);
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
        setDeletingTag(tag.TagName);

        try {
            const response = await fetch(
                `/api/tcr/delete-tag?repoName=${encodeURIComponent(currentRepoName)}&tag=${encodeURIComponent(tag.TagName)}`,
                {
                    method: 'DELETE',
                    headers: {
                        'x-access-key': getAccessKey(),
                    },
                }
            );

            const data = await response.json();

            if (data.success) {
                // 使用保存的 currentRepoName 重新获取标签列表
                const tagsResponse = await fetch(`/api/tcr/image-tags?repoName=${encodeURIComponent(currentRepoName)}`, {
                    headers: {
                        'x-access-key': getAccessKey(),
                    },
                });
                const tagsData = await tagsResponse.json();

                if (tagsData.Data) {
                    setTags(tagsData.Data);
                } else {
                    setError('获取标签列表失败');
                }
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

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allTags = new Set(tags.TagInfo.map(tag => tag.TagName));
            setSelectedTags(allTags);
        } else {
            setSelectedTags(new Set());
        }
    };

    const handleSelectTag = (tagName) => {
        const newSelectedTags = new Set(selectedTags);
        if (newSelectedTags.has(tagName)) {
            newSelectedTags.delete(tagName);
        } else {
            newSelectedTags.add(tagName);
        }
        setSelectedTags(newSelectedTags);
    };

    const handleBatchDelete = () => {
        if (selectedTags.size > 0) {
            setBatchDeleteConfirm({
                show: true,
                repoName: repoName
            });
        }
    };

    const handleBatchDeleteConfirm = async () => {
        setBatchDeleting(true);
        try {
            const response = await fetch('/api/tcr/batch-delete-tag', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-key': getAccessKey(),
                },
                body: JSON.stringify({
                    repoName: batchDeleteConfirm.repoName,
                    tags: Array.from(selectedTags)
                }),
            });

            const data = await response.json();
            if (data.success) {
                setSelectedTags(new Set());
                await fetchTags();
            } else {
                setError(data.message || '批量删除失败');
            }
        } catch (error) {
            setError('批量删除失败');
        } finally {
            setBatchDeleting(false);
            setBatchDeleteConfirm({
                show: false,
                repoName: null
            });
        }
    };

    return (
        <>
            <FormModal
                isOpen={isOpen}
                onClose={onClose}
                title={`镜像标签列表 - ${repoName}`}
                maxWidth="max-w-4xl"
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
                ) : tags?.TagInfo?.length > 0 ? (
                    <div>
                        <div className="mb-4 flex justify-between items-center">
                            {selectedTags.size > 0 && (
                                <button
                                    onClick={handleBatchDelete}
                                    className="px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-4 dark:focus:ring-red-600"
                                >
                                    批量删除 ({selectedTags.size})
                                </button>
                            )}
                        </div>
                        <div className="overflow-x-auto max-h-[calc(100vh-16rem)]">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:text-blue-500 dark:focus:ring-blue-400"
                                            checked={selectedTags.size === tags.TagInfo.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">标签</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">大小</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">推送时间</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">操作</th>
                                </tr>
                                </thead>
                                <tbody
                                    className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {tags.TagInfo.map((tag) => (
                                    <tr key={tag.TagId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:text-blue-500 dark:focus:ring-blue-400"
                                                checked={selectedTags.has(tag.TagName)}
                                                onChange={() => handleSelectTag(tag.TagName)}
                                            />
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-600 dark:text-blue-500">
                                            {tag.TagName}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {formatSize(tag.SizeByte || tag.Size)}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {tag.PushTime}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleCopy(tag)}
                                                    className="group relative p-1 hover:bg-gray-100 rounded dark:hover:bg-gray-500"
                                                    title={`复制：${tags.Server}/${repoName}:${tag.TagName}`}
                                                >
                                                    {copyStatus === tag.TagId ? (
                                                        <svg className="w-5 h-5 text-green-500 dark:text-green-400"
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
                                                    disabled={deletingTag === tag.TagName}
                                                    className={`group relative p-1 hover:bg-gray-100 rounded dark:hover:bg-gray-500 ${
                                                        deletingTag === tag.TagName ? 'opacity-50 cursor-not-allowed' : ''
                                                    }`}
                                                    title="删除标签"
                                                >
                                                    <svg className="w-5 h-5 text-red-500 dark:text-red-400" fill="none"
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
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-300">
                        暂无标签数据
                    </div>
                )}
            </FormModal>

            {/* 删除确认模态框 */}
            <ConfirmModal
                isOpen={deleteConfirm.show}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="删除标签"
                message={`确定要删除标签 "${deleteConfirm.tag?.TagName}" 吗？此操作不可恢复。`}
                confirmText="删除"
                cancelText="取消"
                confirmButtonClass="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                cancelButtonClass="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
                isLoading={!!deletingTag}
            />

            {/* 批量删除确认模态框 */}
            <ConfirmModal
                isOpen={batchDeleteConfirm.show}
                onClose={() => setBatchDeleteConfirm({
                    show: false,
                    repoName: null
                })}
                onConfirm={handleBatchDeleteConfirm}
                title="批量删除标签"
                message={`确定要从仓库 "${batchDeleteConfirm.repoName}" 中删除选中的 ${selectedTags.size} 个标签吗？此操作不可恢复。`}
                confirmText="删除"
                cancelText="取消"
                confirmButtonClass="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                cancelButtonClass="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
                isLoading={batchDeleting}
            />
        </>
    );
} 