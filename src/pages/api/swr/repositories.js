import {withAuth} from '@/utils/withAuth';
import {listRepositories, setSwrRegion} from '@/utils/swr';
import {cors, runMiddleware} from '@/middleware/cors';

const handler = async (req, res) => {
    // 运行 CORS 中间件
    await runMiddleware(req, res, cors);

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    } else {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;
        const namespace = req.query.namespace || "";
        const searchKey = req.query.searchKey || "";

        // 从请求头获取region
        const region = req.headers['x-region'] || 'cn-north-4';

        try {
            // 设置SWR客户端的region
            if (region) {
                setSwrRegion(region);
            }

            const result = await listRepositories(namespace, {
                limit: pageSize,
                offset: offset,
                name: searchKey
            });
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '获取仓库列表失败',
                error: error.message
            });
        }
    }
};

export default withAuth(handler); 