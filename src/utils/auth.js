// 获取当前域名作为key的前缀
const getDomainPrefix = () => {
    if (typeof window !== 'undefined') {
        return window.location.hostname + '_';
    }
    return '';
};

// 设置访问密钥
export const setAccessKey = (key) => {
    const prefix = getDomainPrefix();
    localStorage.setItem(prefix + 'accessKey', key);
};

// 获取访问密钥
export const getAccessKey = () => {
    const prefix = getDomainPrefix();
    return localStorage.getItem(prefix + 'accessKey');
};

// 清除访问密钥
export const clearAuth = () => {
    const prefix = getDomainPrefix();
    localStorage.removeItem(prefix + 'accessKey');
};

// 检查是否已认证
export const isAuthenticated = () => {
    const prefix = getDomainPrefix();
    return !!localStorage.getItem(prefix + 'accessKey');
};