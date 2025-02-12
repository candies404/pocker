// 在客户端存储密钥
export const setAccessKey = (key) => {
    localStorage.setItem('access_key', key);
};

// 获取存储的密钥
export const getAccessKey = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('access_key');
    }
    return null;
};

// 检查是否已认证
export const isAuthenticated = () => {
    return !!getAccessKey();
};

// 清除认证
export const clearAuth = () => {
    localStorage.removeItem('access_key');
}; 