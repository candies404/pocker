import Link from 'next/link';
import {useRouter} from 'next/router';
import {clearAuth} from '@/utils/auth';

export default function Navigation() {
    const router = useRouter();

    const menuItems = [
        {path: '/', label: '镜像仓库'},
        {path: '/namespaces', label: '命名空间'},
        {path: '/quota', label: '配额信息'},
        // {path: '/tags', label: '镜像标签'},
        {path: '/github-config', label: 'GitHub配置'},
    ];

    const handleLogout = () => {
        clearAuth();
        router.push('/');
    };

    return (
        <nav className="bg-white shadow-md">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <span className="text-xl font-bold text-gray-800">镜像管理私服</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex space-x-4">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                                        router.pathname === item.path
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                            退出登录
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
} 