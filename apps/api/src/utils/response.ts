import { Response } from 'express';
import { ErrorCode, ApiResponse } from '../types';

export function success<T>(res: Response, data: T, message = '操作成功') {
  const response: ApiResponse<T> = {
    code: ErrorCode.SUCCESS,
    message,
    data,
    timestamp: Date.now(),
  };
  return res.json(response);
}

export function error(res: Response, message: string, code: ErrorCode = ErrorCode.BAD_REQUEST, statusCode = 200) {
  const response: ApiResponse<null> = {
    code,
    message,
    data: null,
    timestamp: Date.now(),
  };
  return res.status(statusCode).json(response);
}

export function unauthorized(res: Response, message = '未授权，请先登录') {
  return error(res, message, ErrorCode.UNAUTHORIZED, 401);
}

export function forbidden(res: Response, message = '无权访问该资源') {
  return error(res, message, ErrorCode.FORBIDDEN, 403);
}

export function notFound(res: Response, message = '资源不存在') {
  return error(res, message, ErrorCode.NOT_FOUND, 404);
}

export function internalError(res: Response, message = '服务器内部错误') {
  return error(res, message, ErrorCode.INTERNAL_ERROR, 500);
}
