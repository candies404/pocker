import {withAuth} from '@/utils/withAuth';
import {createNamespace} from '@/utils/swr';

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({message: '方法不允许'});
    }

    const {namespace} = req.body;

    if (!namespace) {
        return res.status(400).json({
            success: false,
            message: '命名空间名称不能为空'
        });
    }

    try {
        const result = await createNamespace(namespace);
        res.status(200).json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('创建命名空间失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '创建命名空间失败'
        });
    }
};

export default withAuth(handler); 