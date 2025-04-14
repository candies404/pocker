import {withAuth} from '@/utils/withAuth';
import {listApiVersions, setSwrRegion} from '@/utils/swr';
import {cors, runMiddleware} from '@/middleware/cors';

const handler = async (req, res) => {
    // 运行 CORS 中间件
    await runMiddleware(req, res, cors);

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    } else {
        // 从请求头获取region
        const region = req.headers['x-region'] || 'cn-north-4';

        try {
            // 设置SWR客户端的region
            if (region) {
                setSwrRegion(region);
            }

            const result = await listApiVersions();
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取 API 版本信息失败',
                error: error.message
            });
        }
    }
};

export default withAuth(handler); 