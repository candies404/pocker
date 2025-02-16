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

const WORKFLOW_FILE = '.github/workflows/docker-publish.yml';

export const checkWorkflowFile = async () => {
    try {
        const username = await getUsername();
        const response = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/contents/${WORKFLOW_FILE}`, {
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
            // 解码 base64 内容
            const content = Buffer.from(data.content, 'base64').toString('utf-8');
            return {exists: true, content, sha: data.sha};
        }

        throw new Error('获取工作流文件失败');
    } catch (error) {
        throw error;
    }
};

export const createWorkflowFile = async () => {
    try {
        const username = await getUsername();
        const workflowContent = `
name: Docker Image CI

on:
  repository_dispatch:
    types:
      - createTag
  workflow_dispatch:

jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - name: Pull Docker image from Docker Hub
        run: |
          docker pull nginxproxy/nginx-proxy:latest

      - name: Login to Tencent Docker Hub
        uses: docker/login-action@v3
        with:
          registry: ccr.ccs.tencentyun.com
          username: 100023041744
          password: Bnbssd242418

      - name: Tag the image for Tencent
        run: |
          docker tag nginxproxy/nginx-proxy:latest ccr.ccs.tencentyun.com/lufocs/test2:latest2

      - name: Push the image to Tencent Docker Hub
        run: |
          docker push ccr.ccs.tencentyun.com/lufocs/test2:latest2
`;

        const response = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/contents/${WORKFLOW_FILE}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Add Docker publish workflow',
                content: Buffer.from(workflowContent).toString('base64')
            })
        });

        if (!response.ok) {
            throw new Error('创建工作流文件失败');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}; 