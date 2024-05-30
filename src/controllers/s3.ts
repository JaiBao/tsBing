
import  { S3Client, PutObjectCommand } from '@aws-sdk/client-s3' // 引入 AWS SDK S3 的客戶端和命令
import { Request, Response } from 'express';
import dotenv from 'dotenv' //  引入 dotenv 用於讀取 .env 檔案
dotenv.config(); // 載入環境變數

// 從環境變數中取得 AWS 設定
const S3_BUCKET_REGION = process.env.S3_BUCKET_REGION;
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.BUCKET_NAME;
// 確保這些值存在
if (!S3_BUCKET_REGION || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
  throw new Error("S3 配置信息不完整");
}
// 建立新的 S3 用戶端實例，設定區域和認證資訊
const s3Client = new S3Client({
  region: S3_BUCKET_REGION,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

// 使用 multer 設定上傳儲存和檔案過濾規則


// 建立 POST 路由用於上傳檔案到 AWS S3
export const uploadS3 = async (req: Request, res: Response) => {
  console.log(req.file)
  if (req.file) {
    const key = Date.now().toString() + '-' + req.file.originalname; // 生成檔案名稱

    try {
      // PutObjectCommand 用於將檔案上傳到 Amazon Simple Storage Service (Amazon S3) 的儲存桶（bucket）。
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      });
      await s3Client.send(command); // 發送命令

      // 創建 S3 的 URL
      const imageUrl = `https://${BUCKET_NAME}.s3.${S3_BUCKET_REGION}.amazonaws.com/${key}`;

      // 回傳成功訊息和圖片 URL
      res.status(200).json({
        message: '檔案上傳成功！',
        imageUrl: imageUrl,
      });
    } catch (error) {
      console.log(error); // 錯誤訊息
      res.status(500).send('檔案上傳失敗'); // 回傳上傳失敗訊息
    }
  }
};

// 導出路由器模組