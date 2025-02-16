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

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/');
            return;
        }
        checkRepo();
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
                    <h2 className="text-xl font-semibold mb-4">GitHub 配置</h2>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {repoExists ? (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                                <p className="font-medium">配置仓库已存在</p>
                                <p className="text-sm mt-1">仓库名称：{repoData.full_name}</p>
                                <p className="text-sm">创建时间：{new Date(repoData.created_at).toLocaleString()}</p>
                                <p className="text-sm">最后更新：{new Date(repoData.updated_at).toLocaleString()}</p>
                            </div>
                            <a
                                href={repoData.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                            >
                                查看仓库
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                未检测到配置仓库，点击下方按钮创建一个名为 "myDockerHub" 的私有仓库。
                            </p>
                            <button
                                onClick={handleCreateRepo}
                                disabled={creating}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-blue-400"
                            >
                                {creating ? '创建中...' : '创建配置仓库'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 