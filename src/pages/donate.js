import Navigation from '@/components/Navigation';
import withPageAuth from '@/utils/withPageAuth';

function DonatePage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navigation/>
            <div className="container mx-auto p-4 mt-0">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            支持项目
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mb-8">
                            如果这个项目对你有帮助，欢迎请作者喝杯瑞幸，一杯在手，幸运共有 ☕
                        </p>
                        <div className="flex justify-center space-x-8">
                            <div className="text-center">
                                <img
                                    src="http://scoful-picgo.oss-ap-southeast-1.aliyuncs.com/picgo/wx.jpg"
                                    alt="微信"
                                    className="w-64 h-64 rounded-lg shadow-md"
                                />
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">微信支付</p>
                            </div>
                            <div className="text-center">
                                <img
                                    src="http://scoful-picgo.oss-ap-southeast-1.aliyuncs.com/picgo/zfb.jpg"
                                    alt="支付宝"
                                    className="w-64 h-64 rounded-lg shadow-md"
                                />
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">支付宝支付</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withPageAuth(DonatePage); 