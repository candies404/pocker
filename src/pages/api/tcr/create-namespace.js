import {withAuth} from '@/utils/withAuth';
import {tcrClient} from '@/utils/tcr';

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
        const result = await tcrClient.CreateNamespacePersonal({
            Namespace: namespace
        });
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '创建命名空间失败',
            code: error.code,
            error: error.message
        });
    }
};

export default withAuth(handler); 