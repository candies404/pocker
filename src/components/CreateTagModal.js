import {useEffect, useState} from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import Modal from '@/components/Modal';
import {SWR_CONSTANTS} from '@/utils/constants';
import {apiRequest} from '@/utils/api';
import {validateTag, validateImageAddress, getValidationHint} from '@/utils/validation';

const SOURCE_REGISTRY_CONFIG = {
    dockerHub: {
        label: 'Docker Hub',
        placeholder: '例如：henrygd/beszel:dev 或 docker pull henrygd/beszel:dev',
        linkText: '前往 Docker Hub 搜索镜像',
        href: 'https://hub.docker.com/search',
        expectedRegistry: 'docker.io'
    },
    ghcr: {
        label: 'GHCR',
        placeholder: '例如：ghcr.io/openclaw/openclaw:latest',
        linkText: '',
        href: '',
        expectedRegistry: 'ghcr.io'
    }
};

export default function CreateTagModal({isOpen, onClose, repoName, namespace}) {
    const [sourceRegistry, setSourceRegistry] = useState('dockerHub');
    const [sourceImage, setSourceImage] = useState('');
    const [sourceImageValidation, setSourceImageValidation] = useState({isValid: true, error: null});
    const [verifiedSourceImage, setVerifiedSourceImage] = useState('');
    const [targetTag, setTargetTag] = useState('');
    const [targetTagValidation, setTargetTagValidation] = useState({isValid: true, error: null});
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('initial'); // initial, updating, triggering, checking, completed, error
    const [checkInterval, setCheckInterval] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false); // 控制确认模态框的显示
    const [isOfficial, setIsOfficial] = useState(true); // 默认是官方镜像
    const currentRegion = localStorage.getItem(SWR_CONSTANTS.CURRENT_REGION_KEY) || 'cn-north-4';
    const currentSourceRegistryConfig = SOURCE_REGISTRY_CONFIG[sourceRegistry];

    useEffect(() => {
        return () => {
            if (checkInterval) {
                clearInterval(checkInterval);
            }
        };
    }, [checkInterval]);

    const handleSourceImageChange = (e) => {
        const value = e.target.value;
        setSourceImage(value);
        setVerifiedSourceImage('');
        setShowConfirm(false);
        setIsOfficial(true);

        // 实时验证源镜像地址
        const validation = validateImageAddress(value);
        setSourceImageValidation(validation);

        // 如果有错误，清除全局错误信息
        if (error && validation.isValid) {
            setError(null);
        }
    };

    const handleSourceRegistryChange = (e) => {
        setSourceRegistry(e.target.value);
        setSourceImage('');
        setSourceImageValidation({isValid: true, error: null});
        setVerifiedSourceImage('');
        setShowConfirm(false);
        setIsOfficial(true);
        setStatus('initial');
        setError(null);
    };

    // 处理目标标签输入变化
    const handleTargetTagChange = (e) => {
        const value = e.target.value;
        setTargetTag(value);

        // 实时验证标签
        const validation = validateTag(value);
        setTargetTagValidation(validation);

        // 如果有错误，清除全局错误信息
        if (error && validation.isValid) {
            setError(null);
        }
    };

    // 在焦点丢失时触发的函数
    const handleBlur = (e) => {
        // 这里可以添加触发的逻辑，比如验证或保存数据
        checkSourceImageChange(e);
    };

    const getSourceCheckErrorMessage = (result) => {
        switch (result?.reason) {
            case 'SOURCE_REGISTRY_MISMATCH':
                return result.message || `当前选择的是 ${currentSourceRegistryConfig.label}，请填写匹配的镜像地址`;
            case 'INVALID_IMAGE':
                return result.message || '源镜像地址格式不正确';
            case 'TAG_NOT_FOUND':
                return `${currentSourceRegistryConfig.label} 中未找到该镜像或标签，请检查后重试`;
            case 'AUTH_REQUIRED':
                return `${currentSourceRegistryConfig.label} 镜像当前无法匿名拉取，请检查它是否为公开镜像`;
            case 'UNSUPPORTED_REGISTRY':
                return '当前仅支持 Docker Hub 和 GHCR 作为源仓库';
            default:
                return result?.message || '源镜像校验失败，请稍后重试';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 验证源镜像地址
        const sourceValidation = validateImageAddress(sourceImage);
        if (!sourceValidation.isValid) {
            setError(sourceValidation.error);
            setSourceImageValidation(sourceValidation);
            return;
        }

        const normalizedInputRegistry = ['index.docker.io', 'registry-1.docker.io'].includes(sourceValidation.parsed.registry.toLowerCase())
            ? 'docker.io'
            : sourceValidation.parsed.registry.toLowerCase();

        if (normalizedInputRegistry !== currentSourceRegistryConfig.expectedRegistry) {
            setError(`当前选择的是 ${currentSourceRegistryConfig.label}，请填写匹配的镜像地址`);
            return;
        }

        // 验证目标标签
        const tagValidation = validateTag(targetTag);
        if (!tagValidation.isValid) {
            setError(tagValidation.error);
            setTargetTagValidation(tagValidation);
            return;
        }

        setCreating(true);
        setStatus('examining');
        setError(null);

        const sourceCheckResult = await checkSourceImageExists(sourceImage.trim());
        setIsOfficial(Boolean(sourceCheckResult.isOfficial));
        setVerifiedSourceImage(sourceCheckResult.normalizedImage || '');

        if (sourceCheckResult.verdict !== 'allow') {
            setError(getSourceCheckErrorMessage(sourceCheckResult));
            setVerifiedSourceImage('');
            setCreating(false);
            setStatus('initial');
            return;
        }

        if (sourceRegistry === 'dockerHub' && !sourceCheckResult.isOfficial) {
            setShowConfirm(true);
            setCreating(false);
            setStatus('initial');
            return;
        }

        await handleCreateTag(sourceCheckResult.normalizedImage);
    };

    const handleConfirm = async (e) => {
        e.stopPropagation();
        setShowConfirm(false);

        if (!verifiedSourceImage) {
            setError('源镜像校验结果已失效，请重新提交');
            setStatus('initial');
            return;
        }

        await handleCreateTag(verifiedSourceImage);
    };

    const handleCancel = (e) => {
        if (e) {
            e.stopPropagation();
        }
        setShowConfirm(false);
        setStatus('initial');
    };

    const handleCreateTag = async (checkedSourceImage = verifiedSourceImage || sourceImage.trim()) => {
        setStatus('updating');

        try {
            const targetImage = `swr.${currentRegion}.myhuaweicloud.com/${namespace}/${repoName}:${targetTag}`;

            const updateResponse = await apiRequest('/api/github/update-workflow', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sourceImage: checkedSourceImage,
                    sourceRegistry,
                    targetImage,
                    region: currentRegion
                }),
            });

            if (!updateResponse.ok) {
                const updateData = await updateResponse.json().catch(() => null);
                setError(updateData?.message || '更新工作流文件失败');
                setCreating(false);
                setStatus('initial');
                return;
            }

            setStatus('triggering');
            const triggerResponse = await apiRequest('/api/github/trigger-workflow', {
                method: 'POST',
            });

            if (!triggerResponse.ok) {
                setError('触发工作流失败');
                setCreating(false);
                setStatus('initial');
                return;
            }

            setStatus('checking');
            const interval = setInterval(async () => {
                const checkResponse = await apiRequest('/api/github/check-workflow-run');

                if (!checkResponse.ok) {
                    clearInterval(interval);
                    setError('检查工作流状态失败');
                    setCreating(false);
                    setStatus('initial');
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
                            setCreating(false);
                            setStatus('initial');
                        }
                    }
                }
            }, 5000);

            setCheckInterval(interval);
        } catch (error) {
            setError(error.message);
            setStatus('error');
        } finally {
            setCreating(false);
        }
    };

    const checkSourceImageExists = async (image) => {
        try {
            const response = await apiRequest('/api/registry/check-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image,
                    sourceRegistry
                })
            });
            const data = await response.json();
            return data.data || {
                verdict: 'deny',
                exists: false,
                reason: 'CHECK_UNAVAILABLE'
            };
        } catch (error) {
            console.error('检查源镜像地址失败:', error);
            return {
                verdict: 'deny',
                exists: false,
                reason: 'CHECK_UNAVAILABLE'
            };
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

        // 先验证输入格式
        const validation = validateImageAddress(value);
        if (!validation.isValid) {
            return; // 如果验证失败，不进行自动解析
        }

        // 检查是否是 docker pull 格式
        if (value.startsWith('docker pull ')) {
            const imageAddress = value.replace('docker pull ', '').trim();

            // 如果没有标签，自动添加 latest
            if (!imageAddress.includes(':')) {
                const newSourceImage = `${imageAddress}:latest`;
                setSourceImage(newSourceImage);
                setTargetTag('latest');

                // 重新验证设置后的值
                setSourceImageValidation(validateImageAddress(newSourceImage));
                setTargetTagValidation(validateTag('latest'));
            } else {
                // 设置源镜像地址
                setSourceImage(imageAddress);
                setSourceImageValidation(validateImageAddress(imageAddress));

                // 提取标签
                const tagMatch = imageAddress.match(/:([^/]+)$/);
                if (tagMatch) {
                    const extractedTag = tagMatch[1];
                    setTargetTag(extractedTag);
                    setTargetTagValidation(validateTag(extractedTag));
                }
            }
        } else {
            // 非 docker pull 格式的输入
            setSourceImage(value);
            setSourceImageValidation(validateImageAddress(value));

            // 如果输入的是不带标签的镜像名，自动添加 latest
            if (value && !value.includes(':')) {
                const newSourceImage = `${value}:latest`;
                setSourceImage(newSourceImage);
                setTargetTag('latest');
                setSourceImageValidation(validateImageAddress(newSourceImage));
                setTargetTagValidation(validateTag('latest'));
            } else {
                // 提取标签
                const tagMatch = value.match(/:([^/]+)$/);
                if (tagMatch) {
                    const extractedTag = tagMatch[1];
                    setTargetTag(extractedTag);
                    setTargetTagValidation(validateTag(extractedTag));
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
                            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                                源仓库类型
                            </label>
                            <select
                                value={sourceRegistry}
                                onChange={handleSourceRegistryChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                                disabled={creating}
                            >
                                {Object.entries(SOURCE_REGISTRY_CONFIG).map(([value, config]) => (
                                    <option key={value} value={value}>
                                        {config.label}
                                    </option>
                                ))}
                            </select>

                            <div className="flex justify-between items-center mb-0 mt-4">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {currentSourceRegistryConfig.label} 镜像地址
                                </label>
                                {currentSourceRegistryConfig.linkText && (
                                    <a
                                        href={currentSourceRegistryConfig.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        {currentSourceRegistryConfig.linkText}
                                    </a>
                                )}
                            </div>
                            <input
                                type="text"
                                value={sourceImage}
                                onChange={handleSourceImageChange}
                                onBlur={handleBlur}
                                placeholder={currentSourceRegistryConfig.placeholder}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white ${
                                    !sourceImageValidation.isValid
                                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-600'
                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:focus:ring-blue-400 dark:focus:border-blue-400'
                                }`}
                                disabled={creating}
                            />

                            {!sourceImageValidation.isValid && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {sourceImageValidation.error}
                                </p>
                            )}

                            {sourceImageValidation.isValid && sourceImage && (
                                <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                                    ✓ 镜像地址格式正确
                                </p>
                            )}

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                                支持直接粘贴 docker pull 命令，将自动解析，不带标签默认 latest
                            </p>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                                {getValidationHint('image')}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                                目标标签
                            </label>
                            <input
                                type="text"
                                value={targetTag}
                                onChange={handleTargetTagChange}
                                placeholder="输入新标签名称"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white ${
                                    !targetTagValidation.isValid
                                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-600'
                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:focus:ring-blue-400 dark:focus:border-blue-400'
                                }`}
                                disabled={creating}
                            />

                            {/* 验证错误信息 */}
                            {!targetTagValidation.isValid && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {targetTagValidation.error}
                                </p>
                            )}

                            {/* 验证成功信息 */}
                            {targetTagValidation.isValid && targetTag && (
                                <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                                    ✓ 标签名称格式正确
                                </p>
                            )}

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                                {getValidationHint('tag')}
                            </p>
                        </div>

                        {(sourceImage || targetTag) && (
                            <div className="text-sm text-gray-500 dark:text-gray-300">
                                <p>最终地址将为：</p>
                                <p className="font-mono mt-1 dark:text-white">
                                    swr.{currentRegion}.myhuaweicloud.com/{namespace}/{repoName}:{targetTag || '[标签名]'}
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

                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                                disabled={creating || !sourceImage.trim() || !targetTag.trim() || !sourceImageValidation.isValid || !targetTagValidation.isValid || status !== 'initial'}
                            >
                                {status !== 'initial' ? getStatusText() : (creating ? '处理中...' : '确认创建')}
                            </button>
                        </div>
                    </div>
                </form>

                {/* 确认模态框 */}
                <ConfirmModal
                    isOpen={showConfirm}
                    onClose={handleCancel}
                    onConfirm={handleConfirm}
                    title="确认风险"
                    message="您正在 pull 非 Docker Hub 官方镜像，继续操作可能存在风险。您确定要继续吗？"
                    confirmText="继续"
                    cancelText="取消"
                />
            </Modal>
        </>
    );
} 