import { NextResponse } from 'next/server';

export function withAuth(handler) {
  return async (req, res) => {
    const accessKey = req.headers['x-access-key'];
    
    if (accessKey !== process.env.ACCESS_KEY) {
      return res.status(401).json({ message: '未授权访问' });
    }
    
    return handler(req, res);
  };
} 