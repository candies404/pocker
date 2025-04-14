import {getAccessKey} from './auth';
import {SWR_CONSTANTS} from '@/utils/constants';

/**
 * 创建统一的API请求方法
 * @param {string} url - 请求URL
 * @param {Object} options - fetch选项
 * @returns {Promise<Response>}
 */
export const apiRequest = async (url, options = {}) => {
    // 获取当前region
    const currentRegion = localStorage.getItem(SWR_CONSTANTS.CURRENT_REGION_KEY) || '';

    // 合并headers
    const headers = {
        'x-access-key': getAccessKey(),
        'x-region': currentRegion,
        ...options.headers,
    };

    // 返回fetch请求
    return fetch(url, {
        ...options,
        headers,
    });
}; 