import {withAuth} from '@/utils/withAuth';
import {SocksProxyAgent} from 'socks-proxy-agent';
import fetch from 'node-fetch'; // 使用 node-fetch 替代原始fetch，支持socks代理

const handler = async (req, res) => {
    const {image} = req.query;

    // 验证 image 参数
    if (!image || typeof image !== 'string') {
        return res.status(400).json({error: '无效的 image 参数'});
    }

    // 默认命名空间和标签
    let namespace = 'library';
    let repository = '';
    let tag = 'latest';

    // 解析 image
    if (image.includes('/')) {
        const parts = image.split('/');
        namespace = parts[0];
        const repoParts = parts[1].split(':');
        repository = repoParts[0];
        if (repoParts.length > 1) {
            tag = repoParts[1];
        }
    } else {
        const repoParts = image.split(':');
        repository = repoParts[0];
        if (repoParts.length > 1) {
            tag = repoParts[1];
        }
    }

    // 判断是否为官方镜像
    const isOfficial = namespace === 'library';

    // API URL
    const apiUrl = `https://hub.docker.com/v2/namespaces/${namespace}/repositories/${repository}/tags/${tag}`;

    // 检测是否为本地运行
    const isLocal = process.env.NODE_ENV === 'development';
    const proxyUrl = isLocal ? 'socks5://127.0.0.1:7890' : '';

    try {
        const agent = proxyUrl ? new SocksProxyAgent(proxyUrl) : null;
        const response = await fetch(apiUrl, {
            method: 'HEAD',
            ...(agent && {agent}), // 条件性添加 agent
        });

        if (response.status === 200) {
            return res.status(200).json({exists: true, isOfficial});
        } else if (response.status === 404) {
            return res.status(404).json({exists: false, isOfficial});
        } else {
            return res.status(500).json({error: '请求失败'});
        }
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            return res.status(500).json({error: '代理连接失败，请检查代理设置'});
        }
        return res.status(500).json({error: '请求失败', details: error.message});
    }
};

export default withAuth(handler);