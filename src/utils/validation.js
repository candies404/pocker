/**
 * Docker镜像和标签验证工具函数
 * 基于Docker官方规范和华为云SWR要求
 */

// Docker仓库名称验证规则
const REPOSITORY_NAME_REGEX = /^[a-z0-9]+([._-][a-z0-9]+)*$/;
const REPOSITORY_NAME_MAX_LENGTH = 255;

// Docker标签验证规则
const TAG_REGEX = /^[\w][\w.-]{0,127}$/;
const TAG_MAX_LENGTH = 128;

/**
 * 验证Docker仓库名称
 * @param {string} name - 仓库名称
 * @returns {Object} - {isValid: boolean, error: string}
 */
export const validateRepositoryName = (name) => {
    if (!name || typeof name !== 'string') {
        return {
            isValid: false,
            error: '仓库名称不能为空'
        };
    }

    const trimmedName = name.trim();

    // 检查是否为空
    if (!trimmedName) {
        return {
            isValid: false,
            error: '仓库名称不能为空'
        };
    }

    // 检查长度
    if (trimmedName.length > REPOSITORY_NAME_MAX_LENGTH) {
        return {
            isValid: false,
            error: `仓库名称不能超过${REPOSITORY_NAME_MAX_LENGTH}个字符`
        };
    }

    // 检查是否包含大写字母
    if (/[A-Z]/.test(trimmedName)) {
        return {
            isValid: false,
            error: '仓库名称必须为小写字母'
        };
    }

    // 检查格式是否符合规范
    if (!REPOSITORY_NAME_REGEX.test(trimmedName)) {
        return {
            isValid: false,
            error: '仓库名称只能包含小写字母、数字、连字符(-)、下划线(_)和点(.)'
        };
    }

    // 检查是否以特殊字符开头或结尾
    if (/^[._-]|[._-]$/.test(trimmedName)) {
        return {
            isValid: false,
            error: '仓库名称不能以连字符、下划线或点开头或结尾'
        };
    }

    // 检查是否包含连续的特殊字符
    if (/[._-]{2,}/.test(trimmedName)) {
        return {
            isValid: false,
            error: '仓库名称不能包含连续的特殊字符'
        };
    }

    return {
        isValid: true,
        error: null
    };
};

/**
 * 验证Docker仓库路径（支持 namespace/repository 多段路径）
 * @param {string} repositoryPath - 仓库路径
 * @returns {Object} - {isValid: boolean, error: string}
 */
const validateRepositoryPath = (repositoryPath) => {
    if (!repositoryPath || typeof repositoryPath !== 'string') {
        return {
            isValid: false,
            error: '仓库路径不能为空'
        };
    }

    const segments = repositoryPath.split('/');
    if (segments.some((segment) => !segment.trim())) {
        return {
            isValid: false,
            error: '仓库路径格式不正确'
        };
    }

    for (const segment of segments) {
        const segmentValidation = validateRepositoryName(segment);
        if (!segmentValidation.isValid) {
            return {
                isValid: false,
                error: segmentValidation.error
            };
        }
    }

    return {
        isValid: true,
        error: null
    };
};

/**
 * 验证Docker标签名称
 * @param {string} tag - 标签名称
 * @returns {Object} - {isValid: boolean, error: string}
 */
export const validateTag = (tag) => {
    if (!tag || typeof tag !== 'string') {
        return {
            isValid: false,
            error: '标签名称不能为空'
        };
    }

    const trimmedTag = tag.trim();

    // 检查是否为空
    if (!trimmedTag) {
        return {
            isValid: false,
            error: '标签名称不能为空'
        };
    }

    // 检查长度
    if (trimmedTag.length > TAG_MAX_LENGTH) {
        return {
            isValid: false,
            error: `标签名称不能超过${TAG_MAX_LENGTH}个字符`
        };
    }

    // 检查格式是否符合规范
    if (!TAG_REGEX.test(trimmedTag)) {
        return {
            isValid: false,
            error: '标签名称只能包含字母、数字、下划线、点和连字符，且必须以字母、数字或下划线开头'
        };
    }

    return {
        isValid: true,
        error: null
    };
};

/**
 * 验证Docker镜像地址格式
 * @param {string} imageAddress - 镜像地址
 * @returns {Object} - {isValid: boolean, error: string, parsed: Object}
 */
export const validateImageAddress = (imageAddress) => {
    if (!imageAddress || typeof imageAddress !== 'string') {
        return {
            isValid: false,
            error: '镜像地址不能为空',
            parsed: null
        };
    }

    const trimmedAddress = imageAddress.trim();

    if (!trimmedAddress) {
        return {
            isValid: false,
            error: '镜像地址不能为空',
            parsed: null
        };
    }

    const cleanAddress = trimmedAddress.replace(/^docker\s+pull\s+/, '');
    const [addressWithoutDigest, digest] = cleanAddress.split('@');
    const pathSegments = addressWithoutDigest.split('/').filter(Boolean);

    if (pathSegments.length === 0) {
        return {
            isValid: false,
            error: '镜像地址格式不正确，请使用格式：[registry/]namespace/repository[:tag]',
            parsed: null
        };
    }

    const firstSegment = pathSegments[0];
    const hasExplicitRegistry = pathSegments.length > 1 && (
        firstSegment.includes('.') ||
        firstSegment.includes(':') ||
        firstSegment === 'localhost'
    );

    const registry = hasExplicitRegistry ? firstSegment : 'docker.io';
    const repositorySegments = hasExplicitRegistry ? pathSegments.slice(1) : [...pathSegments];

    if (repositorySegments.length === 0) {
        return {
            isValid: false,
            error: '镜像地址格式不正确，请使用格式：[registry/]namespace/repository[:tag]',
            parsed: null
        };
    }

    const lastSegment = repositorySegments[repositorySegments.length - 1];
    const tagSeparatorIndex = lastSegment.lastIndexOf(':');
    let tag = null;

    if (tagSeparatorIndex > -1) {
        tag = lastSegment.slice(tagSeparatorIndex + 1);
        repositorySegments[repositorySegments.length - 1] = lastSegment.slice(0, tagSeparatorIndex);
    }

    const repository = repositorySegments.join('/');

    const repoValidation = validateRepositoryPath(repository);
    if (!repoValidation.isValid) {
        return {
            isValid: false,
            error: `仓库路径验证失败：${repoValidation.error}`,
            parsed: null
        };
    }

    if (tag) {
        const tagValidation = validateTag(tag);
        if (!tagValidation.isValid) {
            return {
                isValid: false,
                error: `标签验证失败：${tagValidation.error}`,
                parsed: null
            };
        }
    }

    return {
        isValid: true,
        error: null,
        parsed: {
            registry,
            repository,
            tag: tag || 'latest',
            digest: digest || null,
            fullAddress: cleanAddress
        }
    };
};

/**
 * 实时验证输入框内容
 * @param {string} value - 输入值
 * @param {string} type - 验证类型：'repository' | 'tag' | 'image'
 * @returns {Object} - {isValid: boolean, error: string, warning: string}
 */
export const validateInput = (value, type) => {
    switch (type) {
        case 'repository':
            return validateRepositoryName(value);
        case 'tag':
            return validateTag(value);
        case 'image':
            return validateImageAddress(value);
        default:
            return {
                isValid: false,
                error: '未知的验证类型'
            };
    }
};

/**
 * 获取验证提示信息
 * @param {string} type - 验证类型
 * @returns {string} - 提示信息
 */
export const getValidationHint = (type) => {
    switch (type) {
        case 'repository':
            return '只能包含小写字母、数字、连字符(-)、下划线(_)和点(.)，不能以特殊字符开头或结尾';
        case 'tag':
            return '只能包含字母、数字、下划线、点和连字符，最大128个字符';
        case 'image':
            return '格式：[registry/]namespace/repository[:tag]，例如：nginx:alpine';
        default:
            return '';
    }
};
