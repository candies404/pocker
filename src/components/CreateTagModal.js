import {useEffect, useState} from 'react';
import {getAccessKey} from '@/utils/auth';
import ConfirmModal from '@/components/ConfirmModal';
import Modal from '@/components/Modal';

export default function CreateTagModal({isOpen, onClose, repoName, namespace}) {
    const [sourceImage, setSourceImage] = useState('');
    const [targetTag, setTargetTag] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('initial'); // initial, updating, triggering, checking, completed, error
    const [checkInterval, setCheckInterval] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false); // 控制确认模态框的显示
    const [isOfficial, setIsOfficial] = useState(true); // 默认是官方镜像

    useEffect(() => {
        return () => {
            if (checkInterval) {
                clearInterval(checkInterval);
            }
        };
    }, [checkInterval]);

    const handleSourceImageChange = (e) => {
        setSourceImage(e.target.value);
    };

    // 在焦点丢失时触发的函数
    const handleBlur = (e) => {
        // 这里可以添加触发的逻辑，比如验证或保存数据
        checkSourceImageChange(e);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!sourceImage.trim() || !targetTag.trim()) {
            setError('请填写完整信息');
            return;
        }

        setCreating(true);
        setStatus('examining'); // 设置状态为检查中
        setError(null);

        // 检查源镜像地址是否存在
        const {exists, isOfficial: official} = await checkSourceImageExists(sourceImage.trim());
        setIsOfficial(official);

        if (!exists) {
            setError('Docker Hub 镜像地址输入错误，请检查，建议去 Docker Hub 复制指令。');
            setCreating(false); // 结束创建状态
            setStatus('initial'); // 重置状态
            return;
        }

        if (!official) {
            // 如果不是官方镜像，显示确认模态框
            setShowConfirm(true);
            setCreating(false); // 结束创建状态
            return;
        }

        // 如果是官方镜像，继续执行创建标签的逻辑
        await handleCreateTag();
    };

    const handleConfirm = async (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        setShowConfirm(false); // 关闭确认模态框
        await handleCreateTag(); // 确认后继续执行创建标签的逻辑
    };

    const handleCancle = async (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        setShowConfirm(false); // 关闭确认模态框
        setStatus('initial')
    };

    const handleCreateTag = async () => {
        setStatus('updating'); // 更新状态

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
                setError('更新工作流文件失败');
                setCreating(false); // 结束创建状态
                setStatus('initial'); // 重置状态
                return;
            }

            // 2. 触发工作流
            setStatus('triggering'); // 更新状态
            const triggerResponse = await fetch('/api/github/trigger-workflow', {
                method: 'POST',
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });

            if (!triggerResponse.ok) {
                setError('触发工作流失败');
                setCreating(false); // 结束创建状态
                setStatus('initial'); // 重置状态
                return;
            }

            // 3. 开始检查工作流状态
            setStatus('checking'); // 更新状态
            const interval = setInterval(async () => {
                const checkResponse = await fetch('/api/github/check-workflow-run', {
                    headers: {
                        'x-access-key': getAccessKey(),
                    },
                });

                if (!checkResponse.ok) {
                    clearInterval(interval);
                    setError('检查工作流状态失败');
                    setCreating(false); // 结束创建状态
                    setStatus('initial'); // 重置状态
                    return;
                }

                const data = await checkResponse.json();
                if (data.data) {
                    const {status, conclusion} = data.data;
                    if (status === 'completed') {
                        clearInterval(interval);
                        if (conclusion === 'success') {
                            setStatus('completed');
                        } else {
                            setError(`工作流执行失败: ${conclusion}，具体错误日志请看《构建日志》`);
                            setCreating(false); // 结束创建状态
                            setStatus('initial'); // 重置状态
                        }
                    }
                }
            }, 5000);

            setCheckInterval(interval);
        } catch (error) {
            setError(error.message);
            setStatus('error');
        } finally {
            setCreating(false); // 结束创建状态
        }
    };

    // 检查源镜像地址是否存在的函数
    const checkSourceImageExists = async (image) => {
        try {
            const response = await fetch(`/api/dockerHub/check-repository-tag?image=${encodeURIComponent(image)}`, {
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const data = await response.json();
            return {exists: data.exists, isOfficial: data.isOfficial}; // 返回存在性和是否为官方镜像
        } catch (error) {
            console.error('检查源镜像地址失败:', error);
            return {exists: false, isOfficial: false}; // 网络错误处理
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'examining':
                return '正在检查源镜像地址...';
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
                return '处理中...';
        }
    };

    // 添加处理 docker pull 命令的函数
    const checkSourceImageChange = (e) => {
        const value = e.target.value;

        // 检查是否是 docker pull 格式
        if (value.startsWith('docker pull ')) {
            const imageAddress = value.replace('docker pull ', '').trim();

            // 如果没有标签，自动添加 latest
            if (!imageAddress.includes(':')) {
                setSourceImage(`${imageAddress}:latest`);
                setTargetTag('latest');
            } else {
                // 设置源镜像地址
                setSourceImage(imageAddress);

                // 提取标签
                const tagMatch = imageAddress.match(/:([^/]+)$/);
                if (tagMatch) {
                    setTargetTag(tagMatch[1]);
                }
            }
        } else {
            // 非 docker pull 格式的输入
            setSourceImage(value);

            // 如果输入的是不带标签的镜像名，自动添加 latest
            if (value && !value.includes(':')) {
                setSourceImage(`${value}:latest`);
                setTargetTag('latest');
            } else {
                // 提取标签
                const tagMatch = value.match(/:([^/]+)$/);
                if (tagMatch) {
                    setTargetTag(tagMatch[1]);
                }
            }
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="新增标签">
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Docker Hub 镜像地址
                                </label>
                                <a
                                    href="https://hub.docker.com/search"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    前往 Docker Hub 搜索镜像
                                </a>
                            </div>
                            <input
                                type="text"
                                value={sourceImage}
                                onChange={handleSourceImageChange}
                                onBlur={handleBlur}
                                placeholder="例如：nginx:alpine 或 docker pull nginx:alpine"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                                disabled={creating}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                                支持直接粘贴 docker pull 命令，将自动解析，不带标签默认latest
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                                目标标签
                            </label>
                            <input
                                type="text"
                                value={targetTag}
                                onChange={(e) => setTargetTag(e.target.value)}
                                placeholder="输入新标签名称"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                                disabled={creating}
                            />
                        </div>

                        {(sourceImage || targetTag) && (
                            <div className="text-sm text-gray-500 dark:text-gray-300">
                                <p>最终地址将为：</p>
                                <p className="font-mono mt-1 dark:text-white">
                                    ccr.ccs.tencentyun.com/{namespace}/{repoName}:{targetTag || '[标签名]'}
                                </p>
                            </div>
                        )}

                        {status !== 'initial' && (
                            <div
                                className={`text-sm ${status === 'error' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                注：可以直接关闭，然后在《构建日志》里看日志
                            </div>
                        )}

                        {error && (
                            <div className="text-sm text-red-600 dark:text-red-400">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-600 dark:text-white"
                                disabled={creating}
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-blue-400 dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-blue-300 dark:text-white"
                                disabled={creating || !sourceImage.trim() || !targetTag.trim() || status !== 'initial'}
                            >
                                {status !== 'initial' ? getStatusText() : (creating ? '处理中...' : '确认创建')}
                            </button>
                        </div>
                    </div>
                </form>

                {/* 确认模态框 */}
                <ConfirmModal
                    isOpen={showConfirm}
                    onClose={handleCancle}
                    onConfirm={handleConfirm}
                    title="确认风险"
                    message="您正在 pull 非 Docker 官方镜像，继续操作可能存在风险。您确定要继续吗？"
                    confirmText="继续"
                    cancelText="取消"
                />
            </Modal>
        </>
    );
} 