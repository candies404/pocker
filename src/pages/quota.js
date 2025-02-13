import {useEffect, useState} from 'react';
import {getAccessKey, isAuthenticated} from '@/utils/auth';
import Navigation from '@/components/Navigation';

export default function QuotaPage() {
    const [loading, setLoading] = useState(true);
    const [quotaData, setQuotaData] = useState(null);
    const [userName, setUserName] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isAuthenticated()) {
            fetchQuotaData();
        } else {
            router.push('/');
        }
    }, []);

    const fetchQuotaData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/tcr/quota', {
                headers: {
                    'x-access-key': getAccessKey(),
                },
            });
            const data = await response.json();
            setQuotaData(data.Data);
            setUserName(data.Data.LimitInfo[0].Username);
            setLoading(false);
        } catch (error) {
            setError(error.message || '获取配额信息失败');
            setLoading(false);
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
                    <h2 className="text-l font-semibold mb-4">用户名：{userName} </h2>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                    {quotaData && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-auto">
                                <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">配额值</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {quotaData.LimitInfo.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{item.Type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">{item.Value}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 