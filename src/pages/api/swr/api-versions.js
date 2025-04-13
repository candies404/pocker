import {withAuth} from '@/utils/withAuth';
import {listApiVersions} from '@/utils/swr';
import {cors, runMiddleware} from '@/middleware/cors';

const handler = async (req, res) => {
    // 运行 CORS 中间件
    await runMiddleware(req, res, cors);

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    } else {
        try {
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