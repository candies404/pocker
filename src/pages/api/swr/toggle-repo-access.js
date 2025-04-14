import {withAuth} from '@/utils/withAuth';
import {setSwrRegion, updateRepository} from '@/utils/swr';

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({message: '方法不允许'});
    }

    const {namespace, repository, isPublic} = req.body;

    if (!namespace || !repository) {
        return res.status(400).json({
            success: false,
            message: '命名空间和仓库名称不能为空'
        });
    }

    // 从请求头获取region
    const region = req.headers['x-region'] || 'cn-north-4';

    try {
        // 设置SWR客户端的region
        if (region) {
            setSwrRegion(region);
        }
        const result = await updateRepository(namespace, repository, {
            is_public: isPublic
        });
        res.status(200).json({
            success: true,
            data: result.data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '修改仓库访问权限失败',
            error: error.message
        });
    }
};

export default withAuth(handler); 