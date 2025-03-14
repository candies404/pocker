import {withAuth} from '@/utils/withAuth';
import {APP_CONFIG} from '@/config/version';
import fetch from 'node-fetch';
import {SocksProxyAgent} from "socks-proxy-agent"; // 使用 node-fetch 替代原始fetch，支持socks代理

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({error: 'Method not allowed'});
    }

    try {
        const projectId = process.env.VERCEL_PROJECT_ID;
        const utc = new Date().toISOString();
        const version = APP_CONFIG.version;
        // 检测是否为本地运行
        const isLocal = process.env.NODE_ENV === 'development';
        const proxyUrl = isLocal ? 'socks5://127.0.0.1:7890' : '';
        const agent = proxyUrl ? new SocksProxyAgent(proxyUrl) : null;
        const response = await fetch('https://all-pocker-analysis.vercel.app/api/heartbeat', {
            method: 'POST',
            ...(agent && {agent}), // 条件性添加 agent
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectId,
                utc,
                version,
            }),
        });
        if (!response.ok) {
            throw new Error(`Heartbeat failed with status: ${response.status}`);
        }

        const data = await response.json();

        return res.status(200).json({
            status: 'ok',
            timestamp: Date.now(),
            data
        });
    } catch (error) {
        console.error('Heartbeat check failed:', error);
        return res.status(500).json({error: 'Internal server error'});
    }
}

export default withAuth(handler); 