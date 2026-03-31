import { Request, Response, NextFunction } from 'express';
import { internalError } from '../utils/response';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  // Prisma错误处理
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      return res.status(400).json({
        code: 400,
        message: '数据已存在，请勿重复创建',
        data: null,
        timestamp: Date.now(),
      });
    }
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        code: 404,
        message: '记录不存在',
        data: null,
        timestamp: Date.now(),
      });
    }
  }

  // 验证错误处理
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: 400,
      message: err.message,
      data: null,
      timestamp: Date.now(),
    });
  }

  return internalError(res);
}

export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null,
    timestamp: Date.now(),
  });
}
