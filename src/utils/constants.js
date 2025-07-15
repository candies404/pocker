// 版本更新通知相关常量
export const VERSION_CONSTANTS = {
    NOTIFICATION_DISMISS_KEY: 'pocker_update_notification_dismissed_at',
    DISMISS_DURATION: 24 * 60 * 60 * 1000, // 24小时的毫秒数 (86,400,000毫秒)
};

// GitHub相关常量
export const GITHUB_CONSTANTS = {
    VERCEL_REPO_NAME_KEY: 'vercelRepoName', // localStorage中保存Vercel仓库名的key
};

// SWR相关常量
export const SWR_CONSTANTS = {
    CURRENT_REGION_KEY: 'currentRegion', // localStorage中保存当前region的key
}; 