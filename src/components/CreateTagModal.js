import {useEffect, useState} from 'react';
import FormModal from '@/components/FormModal';
import {getAccessKey} from '@/utils/auth';

export default function CreateTagModal({isOpen, onClose, repoName, namespace}) {
    const [sourceImage, setSourceImage] = useState('');
    const [targetTag, setTargetTag] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('initial'); // initial, updating, triggering, checking, completed, error
    const [checkInterval, setCheckInterval] = useState(null);

    useEffect(() => {
        return () => {
            if (checkInterval) {
                clearInterval(checkInterval);
            }
        };
    }, [checkInterval]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!sourceImage.trim() || !targetTag.trim()) {
            setError('请填写完整信息');
            return;
        }

        setCreating(true);
        setStatus('updating');
        setError(null);

        try {
            // 构建目标镜像地址
            const targetImage = `ccr.ccs.tencentyun.com/${namespace}/${repoName}:${targetTag}`;

            // 1. 更新工作流文件
            const updateResponse = await fetch('/api/github/update-workflow', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-key': getAccessKey(),
                },
                body: JSON.stringify({
                    sourceImage: sourceImage.trim(),
                    targetImage
                }),
            });

            if (!updateResponse.ok) {
                throw new Error('更新工作流文件失败');
            }

            // 2. 触发工作流
            setStatus('triggering');
            const triggerResponse = await fetch('/api/github/trigger-workflow', {
                method: 'POST',
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });

            if (!triggerResponse.ok) {
                throw new Error('触发工作流失败');
            }

            // 3. 开始检查工作流状态
            setStatus('checking');
            const interval = setInterval(async () => {
                const checkResponse = await fetch('/api/github/check-workflow-run', {
                    headers: {
                        'x-access-key': getAccessKey(),
                    },
                });

                if (!checkResponse.ok) {
                    clearInterval(interval);
                    throw new Error('检查工作流状态失败');
                }

                const data = await checkResponse.json();
                if (data.data) {
                    const {status, conclusion} = data.data;
                    if (status === 'completed') {
                        clearInterval(interval);
                        if (conclusion === 'success') {
                            setStatus('completed');
                            setTimeout(() => {
                                onClose();
                            }, 2000);
                        } else {
                            throw new Error(`工作流执行失败: ${conclusion}`);
                        }
                    }
                }
            }, 5000); // 每5秒检查一次

            setCheckInterval(interval);
        } catch (error) {
            setError(error.message);
            setStatus('error');
        } finally {
            setCreating(false);
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'updating':
                return '正在更新工作流文件...';
            case 'triggering':
                return '正在触发工作流...';
            case 'checking':
                return '正在执行工作流...';
            case 'completed':
                return '标签创建成功！';
            case 'error':
                return '创建失败';
            default:
                return '';
        }
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title="新增标签"
        >
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Docker Hub 镜像地址
                        </label>
                        <input
                            type="text"
                            value={sourceImage}
                            onChange={(e) => setSourceImage(e.target.value)}
                            placeholder="例如：homeassistant/amd64-addon-mosquitto:latest"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            disabled={creating}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            目标标签
                        </label>
                        <input
                            type="text"
                            value={targetTag}
                            onChange={(e) => setTargetTag(e.target.value)}
                            placeholder="输入新标签名称"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            disabled={creating}
                        />
                    </div>

                    {(sourceImage || targetTag) && (
                        <div className="text-sm text-gray-500">
                            <p>最终地址将为：</p>
                            <p className="font-mono mt-1">
                                ccr.ccs.tencentyun.com/{namespace}/{repoName}:{targetTag || '[标签名]'}
                            </p>
                        </div>
                    )}

                    {status !== 'initial' && (
                        <div className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
                            {getStatusText()}
                        </div>
                    )}

                    {error && (
                        <div className="text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                            disabled={creating}
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-blue-400"
                            disabled={creating || !sourceImage.trim() || !targetTag.trim()}
                        >
                            {creating ? '处理中...' : '确认创建'}
                        </button>
                    </div>
                </div>
            </form>
        </FormModal>
    );
} 