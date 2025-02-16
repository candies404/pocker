const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_NAME = 'myDockerHub';

// 获取当前用户信息
const getUsername = async () => {
    try {
        if (!GITHUB_TOKEN) {
            throw new Error('GitHub Token未设置,请在环境变量中配置GITHUB_TOKEN');
        }
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error('获取用户信息失败');
        }

        const data = await response.json();
        return data.login;
    } catch (error) {
        throw error;
    }
};

export const checkGithubRepo = async () => {
    try {
        // 先获取用户名
        const username = await getUsername();

        const response = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}`, {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.status === 404) {
            return {exists: false};
        }

        if (response.ok) {
            const data = await response.json();
            return {exists: true, data};
        }

        throw new Error('获取仓库信息失败');
    } catch (error) {
        throw error;
    }
};

export const createGithubRepo = async () => {
    try {
        const response = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: REPO_NAME,
                private: true,
                auto_init: true,
                description: 'Docker Hub 配置仓库'
            })
        });

        if (!response.ok) {
            throw new Error('创建仓库失败');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}; 