import {useEffect, useState} from 'react';
import FormModal from '@/components/FormModal';
import {getAccessKey} from '@/utils/auth';

export default function TagListModal({isOpen, onClose, repoName}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tags, setTags] = useState(null);

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

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={`镜像标签列表 - ${repoName}`}
        >
            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    <p className="text-sm">{error}</p>
                </div>
            ) : tags?.TagInfo?.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">标签</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">大小</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">推送时间</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {tags.TagInfo.map((tag) => (
                            <tr key={tag.TagId} className="hover:bg-gray-50">
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-600">
                                    {tag.TagName}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {formatSize(tag.SizeByte || tag.Size)}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {tag.PushTime}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    暂无标签数据
                </div>
            )}
        </FormModal>
    );
} 