import {withAuth} from '@/utils/withAuth';
import {listImageTags, setSwrRegion} from '@/utils/swr';

const handler = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({message: '方法不允许'});
    }

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    const namespace = req.query.namespace || "";
    const repository = req.query.repository || "";
    const searchKey = req.query.searchKey || "";

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
        const result = await listImageTags(namespace, repository, {
            limit: pageSize,
            offset: offset,
            tag: searchKey.trim()
        });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取镜像标签列表失败',
            error: error.message
        });
    }
};

export default withAuth(handler); 