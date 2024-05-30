import express, { Request, Response, Router } from "express";
import { uploadS3 } from "../controllers/s3";
import update from '../middleware/upload'

const router: Router = express.Router();

router.post("/upload", update, async (req: Request, res: Response) => {
  console.log(req.file);
  try {
    // 確保文件被上傳
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    await uploadS3(req, res);
  } catch (error) {
    if (error instanceof Error) {
      // 現在可以安全地讀取 error.message
      res.status(500).send(error.message);
    } else {
      // 如果錯誤不是一個 Error 對象，發送一個通用錯誤消息
      res.status(500).send("An error occurred");
    }
  }
});

export default router;
