import {withAuth} from '@/utils/withAuth';
import {tcrClient} from '@/utils/tcr';

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({message: '方法不允许'});
    }

    const {type, value} = req.body;

    if (!type || !value) {
        return res.status(400).json({
            success: false,
            message: '策略类型和值不能为空'
        });
    }

    try {
        const result = await tcrClient.ManageImageLifecycleGlobalPersonal({
            Type: type,
            Val: parseInt(value)
        });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '设置清理策略失败',
            code: error.code,
            error: error.message
        });
    }
};

export default withAuth(handler); 