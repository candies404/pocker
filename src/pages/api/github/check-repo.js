import {checkGithubRepo} from '@/utils/github';
import {withAuth} from '@/utils/withAuth';

const handler = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({message: '方法不允许'});
    }

    try {
        const { repoName } = req.query;
        const result = await checkGithubRepo(repoName);
        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export default withAuth(handler); 