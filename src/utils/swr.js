const core = require('@huaweicloud/huaweicloud-sdk-core');
const swr = require('@huaweicloud/huaweicloud-sdk-swr/v2/public-api');

// 使用闭包管理 region
let currentRegion = 'cn-north-4';

export const setSwrRegion = (region) => {
    currentRegion = region;
};

// 初始化 SWR 客户端
const initSwrClient = () => {
    const ak = process.env.HUAWEICLOUD_AK;
    const sk = process.env.HUAWEICLOUD_SK;
    const projectId = process.env.HUAWEICLOUD_PROJECT_ID || '';
    const endpoint = `https://swr-api.${currentRegion}.myhuaweicloud.com`;

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

// 获取仓库列表
export const listRepositories = async (namespace, params = {}) => {
    try {
        const client = initSwrClient();
        const request = new swr.ListReposDetailsRequest();
        if (namespace) request.withNamespace(namespace);

        // 添加可选参数
        if (params.limit) request.withLimit(params.limit);
        if (params.offset) request.withOffset(params.offset);
        if (params.name) request.withName(params.name);
        request.withOrderColumn("updated_time")
        request.withOrderType("desc")

        const result = await client.listReposDetails(request);
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('获取仓库列表失败:', error);
        throw error;
    }
};

// 创建仓库
export const createRepository = async (namespace, repository, description = '', category = 'other', isPublic = false) => {
    try {
        const client = initSwrClient();
        const request = new swr.CreateRepoRequest();
        request.withNamespace(namespace);
        const body = new swr.CreateRepoRequestBody();
        body.withRepository(repository);
        body.withDescription(description);
        body.withCategory(category);
        body.withIsPublic(isPublic);
        request.withBody(body);

        const result = await client.createRepo(request);
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('创建仓库失败:', error);
        throw error;
    }
};

// 删除仓库
export const deleteRepository = async (namespace, repository) => {
    try {
        const client = initSwrClient();
        const request = new swr.DeleteRepoRequest();
        request.withNamespace(namespace);
        request.withRepository(repository);

        const result = await client.deleteRepo(request);
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('删除仓库失败:', error);
        throw error;
    }
};

// 更新仓库信息
export const updateRepository = async (namespace, repository, updateInfo) => {
    try {
        const client = initSwrClient();
        const request = new swr.UpdateRepoRequest();
        request.withNamespace(namespace);
        request.withRepository(repository);
        const body = new swr.UpdateRepoRequestBody();
        body.withDescription(updateInfo.description);
        body.withIsPublic(updateInfo.is_public);
        request.withBody(body);

        const result = await client.updateRepo(request);
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('更新仓库信息失败:', error);
        throw error;
    }
};

// 获取镜像标签列表
export const listImageTags = async (namespace, repository, params = {}) => {
    try {
        const client = initSwrClient();
        const request = new swr.ListRepositoryTagsRequest();
        request.withNamespace(namespace);
        request.withRepository(repository);

        // 添加可选参数
        if (params.limit) request.withLimit(params.limit);
        request.withOffset(params.offset);
        if (params.tag) request.withTag(params.tag);
        // 默认按更新时间倒序
        request.withOrderColumn("updated_at")
        request.withOrderType("desc")

        const result = await client.listRepositoryTags(request);
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('获取镜像标签列表失败:', error);
        throw error;
    }
};

// 删除镜像标签
export const deleteImageTag = async (namespace, repository, tag) => {
    try {
        const client = initSwrClient();
        const request = new swr.DeleteRepoTagRequest();
        request.withNamespace(namespace);
        request.withRepository(repository);
        request.withTag(tag);

        const result = await client.deleteRepoTag(request);
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('删除镜像标签失败:', error);
        throw error;
    }
};

// 获取配额信息
export const getQuota = async () => {
    try {
        const client = initSwrClient();
        const request = new swr.ShowDomainOverviewRequest();
        const result = await client.showDomainOverview(request);
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('获取配额信息失败:', error);
        throw error;
    }
};

// 获取 API 版本信息
export const listApiVersions = async () => {
    try {
        const client = initSwrClient();
        const request = new swr.ListApiVersionsRequest();
        const result = await client.listApiVersions(request);
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('获取 API 版本信息失败:', error);
        throw error;
    }
};


