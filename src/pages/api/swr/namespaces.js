import {withAuth} from '@/utils/withAuth';
import {listNamespaces} from '@/utils/swr';

const handler = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({message: '方法不允许'});
    }

    try {
        const result = await listNamespaces();
        res.status(200).json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('获取华为云 SWR 命名空间列表失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取命名空间列表失败'
        });
    }
};

export default withAuth(handler);


