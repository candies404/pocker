import {configureAutoUpdate} from '@/utils/github';
import {withAuth} from '@/utils/withAuth';

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({message: '方法不允许'});
    }

    const {repoName} = req.body;

    if (!repoName) {
        return res.status(400).json({
            success: false,
            message: '仓库名不能为空'
        });
    }

    try {
        const result = await configureAutoUpdate(repoName);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export default withAuth(handler); 