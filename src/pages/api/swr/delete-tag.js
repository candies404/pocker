import {withAuth} from '@/utils/withAuth';
import {deleteImageTag} from '@/utils/swr';

const handler = async (req, res) => {
    if (req.method !== 'DELETE') {
        return res.status(405).json({message: '方法不允许'});
    }

    const {namespace, repository, tag} = req.query;

    if (!namespace || !repository || !tag) {
        return res.status(400).json({
            success: false,
            message: '命名空间、仓库名称和标签名称不能为空'
        });
    }

    try {
        const result = await deleteImageTag(namespace, repository, tag);
        res.status(200).json({
            success: true,
            data: result.data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '删除镜像标签失败',
            error: error.message
        });
    }
};

export default withAuth(handler); 