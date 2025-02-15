import {withAuth} from '@/utils/withAuth';
import {tcrClient} from '@/utils/tcr';

const handler = async (req, res) => {
    if (req.method !== 'DELETE') {
        return res.status(405).json({message: '方法不允许'});
    }

    const {repoName, tag} = req.query;

    if (!repoName || !tag) {
        return res.status(400).json({
            success: false,
            message: '仓库名称和标签名称不能为空'
        });
    }

    try {
        const result = await tcrClient.DeleteImagePersonal({
            RepoName: repoName,
            Tag: tag
        });
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '删除标签失败',
            code: error.code,
            error: error.message
        });
    }
};

export default withAuth(handler); 