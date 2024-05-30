import users from '../models/users' // 確保路徑和檔案擴展名正確
import jwt from 'jsonwebtoken'
import { Request, Response } from 'express'

// 假設您已經在其他地方擴展了 Request 類型來包含 user 和 token
// 如果沒有，您需要在適當的地方添加這些擴展
declare module 'express-serve-static-core' {
  interface Request {
    user?: any // 根據您的用戶模型調整類型
    token?: string
  }
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    await users.create({
      name: req.body.name,
      number: req.body.number,
      password: req.body.password,
      image: req.body?.image || '',
      depart: req.body?.depart || '',
      role: req.body?.role || 0,
      permission: req.body.permission
    })
    res.status(200).json({ success: true, message: '註冊成功' })
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: error.errors[Object.keys(error.errors)[0]].message })
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      res.status(400).json({ success: false, message: '用戶已存在' })
    } else {
      res.status(500).json({ success: false, message: '未知錯誤' })
    }
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = jwt.sign({ _id: req.user!._id }, process.env.JWT_SECRET!, { expiresIn: '7days' })
    req.user!.tokens.push(token)
    await req.user!.save()
    res.status(200).json({
      success: true,
      message: '登入成功',
      result: {
        _id: req.user!._id,
        token,
        name: req.user!.name,
        number: req.user!.number,
        role: req.user!.role,
        depart: req.user!.depart,
        image: req.user!.image,
        permission: req.user!.permission
      }
    })
  } catch (error: any) {
    console.log(error)
    res.status(500).json({ success: false, message: '登入失敗' })
  }
}

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    req.user!.tokens = []
    await req.user!.save()
    res.status(200).json({ success: true, message: '登出成功' })
  } catch (error: any) {
    res.status(500).json({ success: false, message: '登出失敗' })
  }
}

export const extend = async (req: Request, res: Response): Promise<void> => {
  try {
    const idx = req.user!.tokens.findIndex((token: string) => token === req.token)
    const token = jwt.sign({ _id: req.user!._id }, process.env.JWT_SECRET!, { expiresIn: '7 days' })
    req.user!.tokens[idx] = token
    await req.user!.save()
    res.status(200).json({ success: true, message: 'Token 已更新', result: token })
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Token 更新失敗' })
  }
}

export const findAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const usersData = await users.find()

    res.status(200).json(usersData)
  } catch (error) {
    res.status(500).json({ success: false, message: error })
  }
}

interface userEdit {
  number: string
  name: string
  team: string
  role: number
  password?: string
  permission?: string[]
}
export const editUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const data: userEdit = {
      number: req.body.number,
      name: req.body.name,
      team: req.body.team,
      role: req.body.role,
      permission: req.body.permission
    }
    if (req.body.password) {
      data.password = req.body.password
    }
    const id = req.body._id
    const result = await users.findByIdAndUpdate(id, data, { new: true })
    res.status(200).send({ success: true, message: result })
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(400).send({ success: false, message })
    } else {
      res.status(500).send({ success: false, message: error.message })
    }
  }
}

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id
    console.log(id)
    const result = await users.findByIdAndDelete(id)
    res.status(200).send({ success: true, message: result })
  } catch (error: any) {
    res.status(500).send({ success: false, message: error.message })
  }
}
