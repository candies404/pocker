import {useEffect, useState} from 'react';
import Navigation from '@/components/Navigation';
import {getAccessKey, isAuthenticated} from '@/utils/auth';
import {useRouter} from 'next/router';
import {useTour} from '@/hooks/useTour';
import withPageAuth from '@/utils/withPageAuth';
import {APP_CONFIG} from '@/config/version';
import FormModal from '@/components/FormModal';
import {GITHUB_CONSTANTS} from '@/utils/constants';

function GithubConfigPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [repoExists, setRepoExists] = useState(false);
    const [repoData, setRepoData] = useState(null);
    const [creating, setCreating] = useState(false);
    const [workflowExists, setWorkflowExists] = useState(false);
    const [workflowContent, setWorkflowContent] = useState(null);
    const [creatingWorkflow, setCreatingWorkflow] = useState(false);
    const [isAuth, setIsAuth] = useState(false);
    const [isAutoUpdateModalOpen, setIsAutoUpdateModalOpen] = useState(false);
    const [autoUpdateRepo, setAutoUpdateRepo] = useState('');
    const [configuringAutoUpdate, setConfiguringAutoUpdate] = useState(false);
    const {startTour} = useTour('github-config');

    useEffect(() => {
        setIsAuth(isAuthenticated());
        setLoading(false);
    }, []);

    useEffect(() => {
        if (isAuth) {
            checkRepo();
        }
    }, [isAuth]);

    const checkRepo = async () => {
        setLoading(true);
        setError("");
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
                    await checkWorkflow();
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
        setLoading(true);
        setError("");
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
        } finally {
            setLoading(false);
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

    const handleOpenAutoUpdateModal = () => {
        const savedRepo = localStorage.getItem(GITHUB_CONSTANTS.VERCEL_REPO_NAME_KEY);
        if (savedRepo) {
            setAutoUpdateRepo(savedRepo);
        }
        setIsAutoUpdateModalOpen(true);
    };

    // 自动更新工作流
    const AUTO_UPDATE_WORKFLOW_FILE = '.github/workflows/auto-update.yml';

    const handleConfigureAutoUpdate = async () => {
        setConfiguringAutoUpdate(true);
        try {
            // 1. 先检查仓库是否存在
            const repoResponse = await fetch(`/api/github/check-repo?repoName=${encodeURIComponent(autoUpdateRepo.trim())}`, {
                method: 'GET',
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const repoData = await repoResponse.json();

            if (!repoData.success || !repoData.exists) {
                setError(`仓库 ${autoUpdateRepo.trim()} 不存在，请确认仓库名称是否正确`);
                return;
            }

            // 2. 检查工作流是否已配置
            const workflowResponse = await fetch(`/api/github/check-workflow?repo=${encodeURIComponent(autoUpdateRepo.trim())}&workflowFile=${AUTO_UPDATE_WORKFLOW_FILE}`, {
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const workflowData = await workflowResponse.json();

            if (workflowData.success && workflowData.exists) {
                // 工作流已存在，直接保存并关闭
                localStorage.setItem(GITHUB_CONSTANTS.VERCEL_REPO_NAME_KEY, autoUpdateRepo.trim());
                setIsAutoUpdateModalOpen(false);
                setAutoUpdateRepo('');
                setError(null);
                return;
            }

            // 3. 配置自动更新工作流
            const response = await fetch('/api/github/configure-auto-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-key': getAccessKey(),
                },
                body: JSON.stringify({
                    repoName: autoUpdateRepo.trim()
                })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem(GITHUB_CONSTANTS.VERCEL_REPO_NAME_KEY, autoUpdateRepo.trim());
                setIsAutoUpdateModalOpen(false);
                setAutoUpdateRepo('');
                setError(null);
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('配置自动更新失败');
        } finally {
            setConfiguringAutoUpdate(false);
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
                                <p className="text-gray-500 dark:text-gray-400">正在加载GitHub配置...</p>
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
            <div className="container mx-auto p-4 mt-0">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex justify-end items-center mb-6">
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
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {repoExists ? (
                        <div className="space-y-4">
                            <h3 id="repo-status" className="text-lg font-medium dark:text-white">GitHub
                                中转仓库配置</h3>
                            <div
                                className="bg-green-50 dark:bg-gray-800 border border-green-200 dark:border-gray-300 text-green-700 dark:text-emerald-400 px-4 py-3 rounded-lg">
                                <p className="font-semibold">中转仓库已存在</p>
                                <p className="font-medium text-red-600 dark:text-red-300 mt-1">警告：请务必保持此中转仓库为私有状态，切勿公开</p>
                                <div className="space-y-1 mt-2 text-sm">
                                    <p className="dark:text-gray-300">中转仓库名称：{repoData.full_name}</p>
                                    <p className="text-green-600 dark:text-gray-400">创建时间：{new Date(repoData.created_at).toLocaleString()}</p>
                                    <p className="text-green-600 dark:text-gray-400">最后更新：{new Date(repoData.updated_at).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <a
                                    href={repoData.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white dark:hover:text-white"
                                >
                                    查看中转仓库
                                </a>
                                <button
                                    onClick={handleOpenAutoUpdateModal}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white dark:hover:text-white"
                                >
                                    配置自动更新
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-gray-600 dark:text-gray-300">
                                未检测到 GitHub 中转仓库，点击下方按钮创建一个名为 "myDockerHub" 的私有中转仓库。
                            </p>
                            <button
                                onClick={handleCreateRepo}
                                disabled={creating}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-blue-400 dark:disabled:bg-blue-300"
                            >
                                {creating ? '创建中...' : '创建中转仓库'}
                            </button>
                        </div>
                    )}

                    {repoExists && (
                        <div className="mt-8 space-y-4">
                            <h3 id="workflow-status" className="text-lg font-medium dark:text-white">GitHub 中转仓库工作流</h3>
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
                                        未检测到中转仓库工作流文件，点击下方按钮创建。
                                    </p>
                                    <button
                                        onClick={handleCreateWorkflow}
                                        disabled={creatingWorkflow}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 dark:text-white dark:hover:text-white disabled:bg-green-400 dark:disabled:bg-green-300"
                                    >
                                        {creatingWorkflow ? '创建中...' : '创建中转仓库工作流文件'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <FormModal
                        isOpen={isAutoUpdateModalOpen}
                        onClose={() => {
                            setIsAutoUpdateModalOpen(false);
                            setAutoUpdateRepo('');
                        }}
                        title="配置自动更新"
                        isLoading={configuringAutoUpdate}
                    >
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleConfigureAutoUpdate();
                        }}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                                    关联 Vercel 的私有仓库名
                                </label>
                                <input
                                    type="text"
                                    value={autoUpdateRepo}
                                    onChange={(e) => setAutoUpdateRepo(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:focus:ring-blue-600 dark:focus:border-blue-600 dark:bg-gray-700 dark:text-white"
                                    placeholder="请输入你关联的 Vercel 私有仓库名，例如：my-pocker"
                                    disabled={configuringAutoUpdate}
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAutoUpdateModalOpen(false);
                                        setAutoUpdateRepo('');
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-white dark:hover:text-white"
                                    disabled={configuringAutoUpdate}
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-blue-400 dark:disabled:bg-blue-500 dark:text-white"
                                    disabled={!autoUpdateRepo.trim() || configuringAutoUpdate}
                                >
                                    {configuringAutoUpdate ? '配置中...' : '确认'}
                                </button>
                            </div>
                        </form>
                    </FormModal>
                </div>
            </div>
        </div>
    );
}

export default withPageAuth(GithubConfigPage); 