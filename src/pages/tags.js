import Navigation from '@/components/Navigation';
import {useEffect, useState} from 'react';
import {isAuthenticated} from '@/utils/auth';
import {useRouter} from 'next/router';

export default function TagsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/');
        }
        setLoading(false);
    }, [router]);

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
                    <h2 className="text-xl font-semibold mb-4">镜像标签管理</h2>
                    {/* 这里添加标签管理的内容 */}
                </div>
            </div>
        </div>
    );
} 