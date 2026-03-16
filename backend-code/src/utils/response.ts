import { Response } from 'express';

export function success<T>(res: Response, data: T, message = 'OK', status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

export function paginated<T>(res: Response, data: T[], meta: { total: number; page: number; limit: number; totalPages: number }) {
  return res.json({
    success: true,
    data,
    meta,
    timestamp: new Date().toISOString(),
  });
}

export function error(res: Response, message: string, status = 500) {
  return res.status(status).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
  });
}
