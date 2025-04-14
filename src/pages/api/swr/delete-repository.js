import {withAuth} from '@/utils/withAuth';
import {deleteRepository, setSwrRegion} from '@/utils/swr';

const handler = async (req, res) => {
    if (req.method !== 'DELETE') {
        return res.status(405).json({message: '方法不允许'});
    }

    const {namespace, repository} = req.query;

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
        const result = await deleteRepository(namespace, repository);
        res.status(200).json({
            success: true,
            data: result.data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '删除仓库失败',
            error: error.message
        });
    }
};

export default withAuth(handler); 