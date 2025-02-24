import {withAuth} from '@/utils/withAuth';
import {tcrClient} from '@/utils/tcr';
import { runMiddleware, cors } from '@/middleware/cors';

const handler = async (req, res) => {
    // 运行 CORS 中间件
    await runMiddleware(req, res, cors);

    if (req.method === 'GET') {
        try {
            const result = await tcrClient.DescribeUserQuotaPersonal();
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                message: '获取配额信息失败',
                code: error.code,
                error: error.message
            });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

export default withAuth(handler); 