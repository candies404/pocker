import {withAuth} from '@/utils/withAuth';
import fetch from 'node-fetch';

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({error: 'Method not allowed'});
    }
    console.log("Backend:", process.env);


    try {
        const response = await fetch('https://api.github.com/repos/scoful/pocker/commits/master');
        const data = await response.json();
        console.log(data)
        return res.status(200).json({
            currentVersion: process.env.VERCEL_GIT_COMMIT_SHA || null,
            latestVersion: data.sha || null
        });
    } catch (error) {
        console.error('Failed to fetch version:', error);
        return res.status(500).json({error: 'Failed to fetch version information'});
    }
}

export default withAuth(handler); 