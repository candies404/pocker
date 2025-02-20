import {useEffect, useState} from 'react';
import {getAccessKey, isAuthenticated} from '@/utils/auth';
import {useRouter} from 'next/router';
import Navigation from '@/components/Navigation';
import FormModal from '@/components/FormModal';

export default function LifecyclePolicyPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [policy, setPolicy] = useState(null);
    const [showSettingModal, setShowSettingModal] = useState(false);
    const [settingType, setSettingType] = useState('global_keep_last_nums');
    const [settingValue, setSettingValue] = useState('');
    const [updating, setUpdating] = useState(false);
    const [toggleLoading, setToggleLoading] = useState(false);
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
        setIsAuth(isAuthenticated());
        setLoading(false);
    }, []);

    useEffect(() => {
        if (isAuth) {
            fetchPolicy();
        }
    }, [isAuth]);


    const fetchPolicy = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/tcr/lifecycle-policy', {
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const data = await response.json();

            if (data?.Data) {
                setPolicy(data.Data);
            } else {
                setError('获取清理策略失败');
            }
        } catch (error) {
            setError('获取清理策略失败');
        } finally {
            setLoading(false);
        }
    };

    const formatPolicyType = (type) => {
        const typeMap = {
            'global_keep_last_nums': '保留最新标签数',
            'global_keep_last_days': '保留最近天数'
        };
        return typeMap[type] || type;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (settingType === 'global_keep_last_nums' && parseInt(settingValue) > 99) {
            setError('保留标签数量不能超过99个');
            return;
        }

        setUpdating(true);
        try {
            const response = await fetch('/api/tcr/update-lifecycle-policy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-key': getAccessKey(),
                },
                body: JSON.stringify({
                    type: settingType,
                    value: settingValue
                }),
            });

            const data = await response.json();
            if (data) {
                await fetchPolicy();
                setShowSettingModal(false);
                setSettingValue('');
            } else {
                setError(data.message || '设置策略失败');
            }
        } catch (error) {
            setError('设置策略失败');
        } finally {
            setUpdating(false);
        }
    };

    const handleToggleStatus = async () => {
        setToggleLoading(true);
        try {
            const response = await fetch('/api/tcr/toggle-lifecycle-policy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-key': getAccessKey(),
                },
            });

            const data = await response.json();
            if (data) {
                await fetchPolicy();
            } else {
                setError(data.message || '修改策略状态失败');
            }
        } catch (error) {
            setError('修改策略状态失败');
        } finally {
            setToggleLoading(false);
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
                                <p className="text-gray-500 dark:text-gray-400">正在加载自动清理策略...</p>
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
                    <div className="flex justify-between items-center mb-6">
                        <button
                            onClick={() => setShowSettingModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            设置策略
                        </button>
                    </div>

                    <div
                        className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded-md">
                        <p className="text-sm">
                            注：2种策略配置是互斥的。只能1次生效一种或者全不生效。
                        </p>
                    </div>

                    {error && (
                        <div
                            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md mb-4">
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {policy?.StrategyInfo?.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                        策略类型
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                        策略值
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                        状态
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                        创建时间
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                                        操作
                                    </th>
                                </tr>
                                </thead>
                                <tbody
                                    className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {policy.StrategyInfo.map((strategy, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                            {formatPolicyType(strategy.Type)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                            {strategy.Value}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    strategy.Valid
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                                }`}
                                            >
                                                {strategy.Valid ? '生效中' : '已禁用'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {strategy.CreationTime}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={handleToggleStatus}
                                                disabled={toggleLoading}
                                                className={`group relative p-1 hover:bg-gray-100 rounded dark:hover:bg-gray-500 ${
                                                    !strategy.Valid ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                                title={strategy.Valid ? '禁用策略' : '策略已禁用'}
                                            >
                                                <svg
                                                    className={`w-5 h-5 ${
                                                        strategy.Valid
                                                            ? 'text-red-500 dark:text-red-400'
                                                            : 'text-gray-400 dark:text-gray-500'
                                                    }`}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                                    />
                                                </svg>
                                                <span className="sr-only">
                                                    {strategy.Valid ? '禁用策略' : '策略已禁用'}
                                                </span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            暂无清理策略
                        </div>
                    )}
                </div>
            </div>

            <FormModal
                isOpen={showSettingModal}
                onClose={() => {
                    setShowSettingModal(false);
                    setError(null);
                    setSettingValue('');
                }}
                title="设置清理策略"
                isLoading={updating}
            >
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                策略类型
                            </label>
                            <select
                                value={settingType}
                                onChange={(e) => setSettingType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="global_keep_last_nums">保留最新标签数</option>
                                <option value="global_keep_last_days">保留最近天数</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {settingType === 'global_keep_last_nums' ? '保留数量' : '保留天数'}
                            </label>
                            <input
                                type="number"
                                value={settingValue}
                                onChange={(e) => setSettingValue(e.target.value)}
                                min="1"
                                max={settingType === 'global_keep_last_nums' ? "99" : undefined}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                placeholder={settingType === 'global_keep_last_nums' ? '请输入保留的标签数量（1-99）' : '请输入保留的天数'}
                                required
                            />
                            {settingType === 'global_keep_last_nums' && (
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    最多可保留99个最新标签
                                </p>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 text-sm text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => {
                                setShowSettingModal(false);
                                setError(null);
                                setSettingValue('');
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            disabled={updating}
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
                            disabled={updating || !settingValue}
                        >
                            {updating ? '保存中...' : '保存'}
                        </button>
                    </div>
                </form>
            </FormModal>
        </div>
    );
} 