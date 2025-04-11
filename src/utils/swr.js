import core from '@huaweicloud/huaweicloud-sdk-core';
import swr from '@huaweicloud/huaweicloud-sdk-swr/v2/public-api';

// 初始化 SWR 客户端
const initSwrClient = () => {
    const ak = process.env.HUAWEICLOUD_AK;
    const sk = process.env.HUAWEICLOUD_SK;
    const projectId = process.env.HUAWEICLOUD_PROJECT_ID || '';
    const endpoint = process.env.HUAWEICLOUD_SWR_ENDPOINT || 'https://swr-api.cn-north-4.myhuaweicloud.com';

    if (!ak || !sk) {
        throw new Error('华为云认证信息未配置，请检查环境变量');
    }

    const credentials = new core.BasicCredentials()
        .withAk(ak)
        .withSk(sk)
        .withProjectId(projectId);

    return swr.SwrClient.newBuilder()
        .withCredential(credentials)
        .withEndpoint(endpoint)
        .build();
};

// 获取命名空间列表
export const listNamespaces = async () => {
    try {
        const client = initSwrClient();
        const request = new swr.ListNamespacesRequest();
        const result = await client.listNamespaces(request);
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('获取命名空间列表失败:', error);
        throw error;
    }
};

// 创建命名空间
export const createNamespace = async (namespace) => {
    try {
        const client = initSwrClient();
        const request = new swr.CreateNamespaceRequest();
        request.withBody({
            namespace: namespace
        });
        const result = await client.createNamespace(request);
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('创建命名空间失败:', error);
        throw error;
    }
};

// 删除命名空间
export const deleteNamespace = async (namespace) => {
    try {
        const client = initSwrClient();
        const request = new swr.DeleteNamespacesRequest();
        request.withNamespace(namespace);
        const result = await client.deleteNamespaces(request);
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('删除命名空间失败:', error);
        throw error;
    }
};


