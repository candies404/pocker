import {withAuth} from '@/utils/withAuth';
import {tcrClient} from '@/utils/tcr';

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({message: '方法不允许'});
    }

    try {
        const result = await tcrClient.DeleteImageLifecycleGlobalPersonal();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '修改策略状态失败',
            code: error.code,
            error: error.message
        });
    }
};

export default withAuth(handler); 