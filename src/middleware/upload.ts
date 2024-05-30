import { Request, Response, NextFunction } from 'express';
import multer from 'multer'
const upload = multer({
  storage: multer.memoryStorage(),
})

export default async (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, async error => {
    if (error instanceof multer.MulterError) {
      const message = error
      console.log(message)
      res.status(400).send({ success: false, message })
    } else if (error) {
      res.status(500).send({ success: false, message: '伺服器錯誤' })
    } else {
      next()
    }
  })
}