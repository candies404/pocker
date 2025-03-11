import {withAuth} from '@/utils/withAuth';
import {getLatestCommit} from '@/utils/github';

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({error: 'Method not allowed'});
    }

    try {
        const versionInfo = await getLatestCommit();
        return res.status(200).json(versionInfo);
    } catch (error) {
        console.error('Failed to fetch version:', error);
        return res.status(500).json({error: 'Failed to fetch version information'});
    }
}

export default withAuth(handler); 