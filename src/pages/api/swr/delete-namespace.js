import {withAuth} from '@/utils/withAuth';
import {deleteNamespace} from '@/utils/swr';

const handler = async (req, res) => {
    if (req.method !== 'DELETE') {
        return res.status(405).json({message: '方法不允许'});
    }

    const {namespace} = req.query;

    if (!namespace) {
        return res.status(400).json({
            success: false,
            message: '命名空间名称不能为空'
        });
    }

    try {
        const result = await deleteNamespace(namespace);
        res.status(200).json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('删除命名空间失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '删除命名空间失败'
        });
    }
};

export default withAuth(handler); 