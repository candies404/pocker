import Cors from 'cors';

// 初始化 CORS 中间件
const cors = Cors({
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    origin: '*', // 允许所有来源，你可以根据需要限制特定来源
});

// 创建一个中间件函数
export function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}

// 导出 cors 中间件
export {cors};