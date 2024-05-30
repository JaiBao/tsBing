// authentication.ts
import passport from 'passport'
import { JsonWebTokenError } from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

// 擴展 Express Request 類型以包含 user 和 token
declare module 'express-serve-static-core' {
  interface Request {
    user?: any // 根據您的用戶模型調整類型
    token?: string
  }
}

// 登入中間件
export const login = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('login', { session: false }, (error: any, user: any, info: any) => {
    if (error || !user) {
      const message = info?.message === 'Missing credentials' ? '欄位錯誤' : info?.message || error?.message
      return res.status(401).json({ success: false, message })
    }
    req.user = user
    next()
  })(req, res, next)
}

// JWT 驗證中間件
export const jwt = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (error: any, data: any, info: any) => {
    if (error || !data) {
      const message = info instanceof JsonWebTokenError ? 'JWT 錯誤' : info?.message || '未知錯誤'
      return res.status(401).json({ success: false, message })
    }
    req.user = data.user
    req.token = data.token
    next()
  })(req, res, next)
}
