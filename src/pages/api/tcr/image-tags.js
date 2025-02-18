import {withAuth} from '@/utils/withAuth';
import {tcrClient} from '@/utils/tcr';

const handler = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({message: '方法不允许'});
    }

    const {repoName, page = 1, pageSize = 10} = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    if (!repoName) {
        return res.status(400).json({
            success: false,
            message: '仓库名称不能为空'
        });
    }

    try {
        const result = await tcrClient.DescribeImagePersonal({
            RepoName: repoName,
            Offset: offset,
            Limit: parseInt(pageSize)
        });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取标签列表失败',
            code: error.code,
            error: error.message
        });
    }
};

export default withAuth(handler); 