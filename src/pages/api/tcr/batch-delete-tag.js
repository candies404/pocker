import {withAuth} from '@/utils/withAuth';
import {tcrClient} from '@/utils/tcr';

const handler = async (req, res) => {
    if (req.method !== 'DELETE') {
        return res.status(405).json({message: '方法不允许'});
    }

    const {repoName, tags} = req.body;

    if (!repoName || !tags || !Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({
            success: false,
            message: '仓库名称和标签列表不能为空'
        });
    }

    try {
        const result = await tcrClient.BatchDeleteImagePersonal({
            RepoName: repoName,
            Tags: tags
        });
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '批量删除标签失败',
            code: error.code,
            error: error.message
        });
    }
};

export default withAuth(handler); 