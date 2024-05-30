import axios from 'axios'
import dotenv from 'dotenv'
import cryptoJs from 'crypto-js'
const envFile = `.env.${process.env.NODE_ENV}`
dotenv.config({ path: envFile })

const apiPay = axios.create({ baseURL: process.env.pay_api })
const giveMe = axios.create({
  baseURL: 'https://www.giveme.com.tw/', // 示例 baseURL
  headers: {
    'Content-Type': 'application/json'
  }
})

apiPay.interceptors.request.use(config => {
  // 確保請求數據是一個對象
  // 只加密 Data 部分
  if (config.data.Data) {
    // 將 Data 部分轉換為 JSON 字符串（如果它還不是字符串）
    const dataString = JSON.stringify(config.data.Data)
    // URL 編碼
    // console.log('datastring', dataString)
    const body = encodeURIComponent(dataString)
    // 定義密鑰和 IV
    const key = cryptoJs.enc.Utf8.parse('ejCk326UnaZWKisg')
    const iv = cryptoJs.enc.Utf8.parse('q9jcZX8Ib9LM8wYk')
    // 進行加密
    const encrypted = cryptoJs.AES.encrypt(body, key, {
      iv,
      mode: cryptoJs.mode.CBC,
      padding: cryptoJs.pad.Pkcs7
    })
    // 將加密後的數據設置為 Data 字段
    config.data.Data = encrypted.toString()
    // console.log(config.data)
  }
  // 將修改後的數據轉換回 JSON 字符串
  config.data = JSON.stringify(config.data)
  return config
})
apiPay.interceptors.response.use(
  response => {
    // 確保響應數據是一個對象
    if (typeof response.data === 'string') {
      try {
        response.data = JSON.parse(response.data)
      } catch (e) {
        // 如果解析失敗，保持原樣
      }
    }

    // 只解密 Data 部分
    if (response.data && response.data.Data) {
      // 定義密鑰和 IV
      const key = cryptoJs.enc.Utf8.parse('ejCk326UnaZWKisg')
      const iv = cryptoJs.enc.Utf8.parse('q9jcZX8Ib9LM8wYk')

      // 進行解密
      const decrypted = cryptoJs.AES.decrypt(response.data.Data, key, {
        iv,
        mode: cryptoJs.mode.CBC,
        padding: cryptoJs.pad.Pkcs7
      })

      // 將解密後的數據轉換為 UTF8 字符串

      const decryptedString = decrypted.toString(cryptoJs.enc.Utf8)

      response.data.Data = JSON.parse(decodeURIComponent(decryptedString))
    }

    return response
  },
  error => {
    // 處理響應錯誤
    return Promise.reject(error)
  }
)
export default apiPay
giveMe
