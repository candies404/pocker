import {withAuth} from '@/utils/withAuth';
import {tcrClient} from '@/utils/tcr';
import {cors, runMiddleware} from '@/middleware/cors';

const handler = async (req, res) => {
    // 运行 CORS 中间件
    await runMiddleware(req, res, cors);

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    } else {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;
        const searchKey = req.query.search || "";

        try {
            const result = await tcrClient.DescribeRepositoryOwnerPersonal({
                Limit: pageSize,
                Offset: offset,
                RepoName: searchKey
            });
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                message: '获取仓库列表失败',
                code: error.code,
                error: error.message
            });
        }
    }
};

export default withAuth(handler); 