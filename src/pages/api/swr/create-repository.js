import {withAuth} from '@/utils/withAuth';
import {createRepository} from '@/utils/swr';

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({message: '方法不允许'});
    }

    const {namespace, repository, description} = req.body;

    if (!namespace || !repository) {
        return res.status(400).json({
            success: false,
            message: '命名空间和仓库名称不能为空'
        });
    }

    try {
        const result = await createRepository(namespace, repository, description);
        res.status(200).json({
            success: true,
            data: result.data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '创建仓库失败',
            error: error.message
        });
    }
};

export default withAuth(handler); 