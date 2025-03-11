const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_NAME = 'myDockerHub';

// 获取当前github用户信息
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
                description: '我的Docker Hub镜像私服中转仓库'
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
          docker pull 源Docker Hub镜像地址

      - name: Login to Tencent Docker Hub
        uses: docker/login-action@v3
        with:
          registry: ccr.ccs.tencentyun.com
          username: 腾讯云账号
          password: 腾讯云容器镜像服务初始化的密码

      - name: Tag the image for Tencent
        run: |
          docker tag 源Docker Hub镜像地址 目标容器镜像地址

      - name: Push the image to Tencent Docker Hub
        run: |
          docker push 目标容器镜像地址
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

// 更新工作流文件
export const updateWorkflowFile = async (sourceImage, targetImage, tenCentUserName) => {
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
          docker pull ${sourceImage}

      - name: Login to Tencent Docker Hub
        uses: docker/login-action@v3
        with:
          registry: ccr.ccs.tencentyun.com
          username: ${tenCentUserName}
          password: ${process.env.TENCENTCLOUD_PASSWORD}

      - name: Tag the image for Tencent
        run: |
          docker tag ${sourceImage} ${targetImage}

      - name: Push the image to Tencent Docker Hub
        run: |
          docker push ${targetImage}
`;

        // 先检查文件是否存在
        const checkResult = await checkWorkflowFile();
        const method = checkResult.exists ? 'PUT' : 'POST';
        const body = {
            message: sourceImage,
            content: Buffer.from(workflowContent).toString('base64')
        };

        // 如果文件存在，需要提供 sha
        if (checkResult.exists) {
            body.sha = checkResult.sha;
        }

        const response = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/contents/${WORKFLOW_FILE}`, {
            method,
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('更新工作流文件失败');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};

// 触发工作流
export const triggerWorkflow = async () => {
    try {
        const username = await getUsername();
        const response = await fetch(
            `https://api.github.com/repos/${username}/${REPO_NAME}/dispatches`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_type: 'createTag'
                })
            }
        );

        if (!response.ok) {
            throw new Error('触发工作流失败');
        }

        return true;
    } catch (error) {
        throw error;
    }
};

// 检查工作流运行状态
export const checkWorkflowRun = async () => {
    try {
        const username = await getUsername();
        const response = await fetch(
            `https://api.github.com/repos/${username}/${REPO_NAME}/actions/runs?event=repository_dispatch&page=1&per_page=1&exclude_pull_requests=false`,
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!response.ok) {
            throw new Error('检查工作流状态失败');
        }

        const data = await response.json();
        if (data.workflow_runs.length > 0) {
            const latestRun = data.workflow_runs[0];
            return {
                status: latestRun.status,
                conclusion: latestRun.conclusion,
                id: latestRun.id
            };
        }

        return null;
    } catch (error) {
        throw error;
    }
};

export const getWorkflowList = async ({page = 1, per_page = 10} = {}) => {
    try {
        const username = await getUsername();
        const response = await fetch(
            `https://api.github.com/repos/${username}/${REPO_NAME}/actions/runs?event=repository_dispatch&exclude_pull_requests=false&page=${page}&per_page=${per_page}`,
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!response.ok) {
            throw new Error('获取工作流列表失败：ResourceNotFound');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const getLatestCommit = async () => {
    try {
        const response = await fetch('https://api.github.com/repos/scoful/pocker/commits/master', {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        const data = await response.json();

        return {
            currentVersion: process.env.VERCEL_GIT_COMMIT_SHA || null,
            latestVersion: data.sha || null
        };
    } catch (error) {
        console.error('Failed to fetch version:', error);
        throw error;
    }
}