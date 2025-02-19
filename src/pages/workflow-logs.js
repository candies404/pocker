import {useEffect, useState} from 'react';
import {getAccessKey, isAuthenticated} from '@/utils/auth';
import {useRouter} from 'next/router';
import Navigation from '@/components/Navigation';

export default function WorkflowLogsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
        setIsAuth(isAuthenticated());
        setLoading(false);
    }, []);

    useEffect(() => {
        if (isAuth) {
            fetchLogs(currentPage);
        }
    }, [isAuth, currentPage, pageSize]);

    const fetchLogs = async (page) => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch(
                `/api/github/workflow-logs?page=${page}&per_page=${pageSize}`,
                {
                    headers: {
                        'x-access-key': getAccessKey(),
                    },
                }
            );
            const data = await response.json();

            if (data.workflow_runs) {
                setLogs(data);
                setTotalPages(Math.ceil(data.total_count / pageSize));
            } else {
                setError('获取构建日志失败');
            }
        } catch (error) {
            setError('获取构建日志失败');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handlePageSizeChange = (e) => {
        const newSize = parseInt(e.target.value);
        setPageSize(newSize);
        setCurrentPage(1);
    };

    const getStatusColor = (status, conclusion) => {
        if (status === 'completed') {
            switch (conclusion) {
                case 'success':
                    return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
                case 'failure':
                    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
                default:
                    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
            }
        }
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navigation/>
                <div className="container mx-auto p-4 mt-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex justify-center items-center h-64">
                            <div className="flex flex-col items-center">
                                <div
                                    className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500 mb-4"></div>
                                <p className="text-gray-500 dark:text-gray-400">正在加载构建日志...</p>
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
            <div className="container mx-auto p-4 mt-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                            日志总数：
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                                {logs?.total_count || 0}
                            </span>
                        </span>
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
                    </div>

                    {error && (
                        <div
                            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md mb-4">
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {logs?.workflow_runs?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                        工作流
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                        构建内容
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                        状态
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                        结果
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                        构建时间
                                    </th>
                                </tr>
                                </thead>
                                <tbody
                                    className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {logs.workflow_runs.map((run) => (
                                    <tr key={run.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                                            <a
                                                href={run.html_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:underline"
                                            >
                                                {run.name} - {run.run_number}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                            {run.head_commit.message}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                            {{
                                                completed: '已完成',
                                                action_required: '需人工介入',
                                                cancelled: '已取消',
                                                failure: '失败',
                                                neutral: '中立',
                                                skipped: '已跳过',
                                                stale: '已过期',
                                                success: '成功',
                                                timed_out: '超时',
                                                in_progress: '进行中',
                                                queued: '队列中',
                                                requested: '已请求',
                                                waiting: '等待中',
                                                pending: '待处理'
                                            }[run.status] || run.status}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(run.status, run.conclusion)}`}
                                            >
                                                {run.status === 'completed'
                                                    ? (run.conclusion === 'success' ? '成功' : '失败')
                                                    : '进行中'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {run.created_at}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            暂无构建日志
                        </div>
                    )}

                    {/* 分页控件 */}
                    {logs?.workflow_runs?.length > 0 && (
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
                    )}
                </div>
            </div>
        </div>
    );
} 