import { Schema, model } from 'mongoose'
import bcryptjs from 'bcryptjs'
import { Document } from 'mongoose'
// import { NextFunction } from "express";
// 定義用戶接口
interface IUser extends Document {
  name?: string
  number: string
  password: string
  tokens: string[]
  role: number
  image?: string
  depart?: string
  permission?: string[]
}

// 定義 Schema
const schema = new Schema<IUser>(
  {
    name: {
      type: String
    },
    number: {
      type: String,
      required: [true, '缺少工號'],
      minlength: [4, '4 個字元以上'],
      maxlength: [20, '20 個字元以下'],
      unique: true,
      match: [/^[A-Za-z0-9]+$/, '格式錯誤']
    },
    password: {
      type: String
    },
    tokens: {
      type: [String],
      default: []
    },
    permission: {
      type: [String],
      default: []
    },
    role: {
      type: Number,
      default: 0 // 0 = 使用者, 1 = 管理員
    },
    image: {
      type: String,
      default: undefined
    },
    depart: {
      type: String
    }
  },
  { versionKey: false }
)

// 密碼加密處理
schema.pre('save', function (next) {
  const user = this as any
  if (user.isModified('password')) {
    if (user.password.length >= 4 && user.password.length <= 20) {
      user.password = bcryptjs.hashSync(user.password, 10)
    } else {
      const error = new Error('密碼長度錯誤')
      next(error)
    }
  }
  next()
})

schema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any
  if (update.password) {
    if (update.password.length >= 4) {
      update.password = bcryptjs.hashSync(update.password, 10)
    } else {
      const error = new Error('密碼長度錯誤')
      next(error)
    }
  }
  next()
})

export default model<IUser>('User', schema)
