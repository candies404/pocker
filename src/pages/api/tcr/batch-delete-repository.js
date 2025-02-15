import {withAuth} from '@/utils/withAuth';
import {tcrClient} from '@/utils/tcr';

const handler = async (req, res) => {
    if (req.method !== 'DELETE') {
        return res.status(405).json({message: '方法不允许'});
    }

    const {repoNames} = req.body;

    if (!repoNames || !Array.isArray(repoNames) || repoNames.length === 0) {
        return res.status(400).json({
            success: false,
            message: '仓库名称列表不能为空'
        });
    }

    try {
        const result = await tcrClient.BatchDeleteRepositoryPersonal({
            RepoNames: repoNames
        });
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '批量删除仓库失败',
            code: error.code,
            error: error.message
        });
    }
};

export default withAuth(handler); 