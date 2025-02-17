import {useEffect, useState} from 'react';
import Navigation from '@/components/Navigation';
import {getAccessKey, isAuthenticated} from '@/utils/auth';
import {useRouter} from 'next/router';

export default function GithubConfigPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [repoExists, setRepoExists] = useState(false);
    const [repoData, setRepoData] = useState(null);
    const [creating, setCreating] = useState(false);
    const [workflowExists, setWorkflowExists] = useState(false);
    const [workflowContent, setWorkflowContent] = useState(null);
    const [creatingWorkflow, setCreatingWorkflow] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/');
            return;
        }
        checkRepo();
        checkWorkflow();
    }, [router]);

    const checkRepo = async () => {
        try {
            const response = await fetch('/api/github/check-repo', {
                method: 'GET',
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const data = await response.json();

            if (data.success) {
                setRepoExists(data.exists);
                if (data.exists) {
                    setRepoData(data.data);
                }
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('检查仓库状态失败');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRepo = async () => {
        setCreating(true);
        try {
            const response = await fetch('/api/github/create-repo', {
                method: 'POST',
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const data = await response.json();

            if (data.success) {
                await checkRepo();
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('创建仓库失败');
        } finally {
            setCreating(false);
        }
    };

    const checkWorkflow = async () => {
        try {
            const response = await fetch('/api/github/check-workflow', {
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const data = await response.json();

            if (data.success) {
                setWorkflowExists(data.exists);
                if (data.exists) {
                    setWorkflowContent(data.content);
                }
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('检查工作流文件失败');
        }
    };

    const handleCreateWorkflow = async () => {
        setCreatingWorkflow(true);
        try {
            const response = await fetch('/api/github/create-workflow', {
                method: 'POST',
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const data = await response.json();

            if (data.success) {
                await checkWorkflow();
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('创建工作流文件失败');
        } finally {
            setCreatingWorkflow(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800">
                <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navigation/>
            <div className="container mx-auto p-4 mt-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">

                    {error && (
                        <div
                            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md mb-4">
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {repoExists ? (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium dark:text-white">GitHub Repo 配置</h3>
                            <div
                                className="bg-green-50 dark:bg-gray-800 border border-green-200 dark:border-gray-300 text-green-700 dark:text-emerald-400 px-4 py-3 rounded-lg">
                                <p className="font-semibold">配置仓库已存在</p>
                                <p className="font-medium text-red-600 dark:text-red-300 mt-1">注：千万不要公开这个项目</p>
                                <div className="space-y-1 mt-2 text-sm">
                                    <p className="dark:text-gray-300">仓库名称：{repoData.full_name}</p>
                                    <p className="text-green-600 dark:text-gray-400">创建时间：{new Date(repoData.created_at).toLocaleString()}</p>
                                    <p className="text-green-600 dark:text-gray-400">最后更新：{new Date(repoData.updated_at).toLocaleString()}</p>
                                </div>
                            </div>
                            <a
                                href={repoData.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white dark:hover:text-white"
                            >
                                查看仓库
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-gray-600 dark:text-gray-300">
                                未检测到GitHub配置仓库，点击下方按钮创建一个名为 "myDockerHub" 的私有仓库。
                            </p>
                            <button
                                onClick={handleCreateRepo}
                                disabled={creating}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-blue-400 dark:disabled:bg-blue-300"
                            >
                                {creating ? '创建中...' : '创建配置仓库'}
                            </button>
                        </div>
                    )}

                    {repoExists && (
                        <div className="mt-8 space-y-4">
                            <h3 className="text-lg font-medium dark:text-white">GitHub Actions 配置</h3>
                            {workflowExists ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-300">
                                        工作流文件存在于 .github/workflows/docker-publish.yml
                                    </p>
                                    <div
                                        className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-300">
                                        <pre className="text-sm overflow-x-auto text-gray-700 dark:text-white">
                                            <code>{workflowContent}</code>
                                        </pre>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-gray-600 dark:text-gray-300">
                                        未检测到 Docker 发布工作流文件，点击下方按钮创建。
                                    </p>
                                    <button
                                        onClick={handleCreateWorkflow}
                                        disabled={creatingWorkflow}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 dark:text-white dark:hover:text-white disabled:bg-green-400 dark:disabled:bg-green-300"
                                    >
                                        {creatingWorkflow ? '创建中...' : '创建工作流文件'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 