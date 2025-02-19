import {withAuth} from '@/utils/withAuth';
import {getWorkflowList} from '@/utils/github';

const handler = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({message: '方法不允许'});
    }

    const {page = 1, per_page = 10} = req.query;

    try {
        const workflowRuns = await getWorkflowList({
            page: parseInt(page),
            per_page: parseInt(per_page)
        });
        res.status(200).json(workflowRuns);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取构建日志列表失败',
            error: error.message
        });
    }
};

export default withAuth(handler);
