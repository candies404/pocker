import {APP_CONFIG} from '@/config/version';

export default function Footer() {
    return (
        <footer className="bg-gray-50 dark:bg-gray-900 py-4 mt-0">
            <div className="container mx-auto text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {APP_CONFIG.name} v{APP_CONFIG.version}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    作者: <a href={APP_CONFIG.blog} target="_blank" rel="noopener noreferrer"
                             className="text-blue-600 hover:text-blue-700 dark:text-blue-400">{APP_CONFIG.author}</a>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    项目地址：<a href={APP_CONFIG.github} target="_blank" rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400">GitHub</a>
                </p>
                <p className="text-sm italic text-gray-500 dark:text-gray-400 mt-1">
                    {APP_CONFIG.description}
                </p>
            </div>
        </footer>
    );
} 