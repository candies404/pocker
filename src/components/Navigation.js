import Link from 'next/link';
import {useRouter} from 'next/router';

export default function Navigation() {
    const router = useRouter();

    const menuItems = [
        {path: '/', label: '配额信息'},
        {path: '/repositories', label: '镜像仓库'},
        {path: '/namespaces', label: '命名空间'},
        {path: '/tags', label: '镜像标签'}
    ];

    return (
        <nav className="bg-white shadow-md">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <span className="text-xl font-bold text-gray-800">镜像管理</span>
                    </div>
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
                </div>
            </div>
        </nav>
    );
} 