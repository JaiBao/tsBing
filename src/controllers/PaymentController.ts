import { Request, Response, NextFunction } from 'express'
import mysql from 'mysql2/promise'
// import SHA256 from "crypto-js/sha256";
import { DateTime } from 'luxon'
import apiPay from '../tools/axios'
import { pool } from '../pool'
import axios from 'axios'

const today = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')

// 控制器函数来处理打印请求
export const getInvoiceUrl = async (req: Request, res: Response): Promise<void> => {
  const invoiceNum = req.params.invoiceNum
  const url = `https://www.giveme.com.tw/invoice.do?action=invoicePrint&code=${invoiceNum}&uncode=53418005`

  try {
    // 直接返回用於列印的URL
    res.send({ url })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}
// ---------------------------------------------------
// 中間件函數，用於將請求轉發到指定的 URL
const forwardRequest = async (req: Request, res: Response, next: NextFunction, apiUrl: string) => {
  try {
    // 將前端的請求數據發送到指定的 API URL
    const response = await axios.post(apiUrl, req.body)
    // 將 API 的響應返回給前端
    res.json(response.data)
    // 執行額外的邏輯（例如，保存發票數據到數據庫）
  } catch (error) {
    // 如果發生錯誤，返回 500 錯誤給前端
    res.status(500).json({ message: 'Internal server error' })
  }
}

// B2B 發票處理程序
export const createB2BInvoice = async (req: Request, res: Response, next: NextFunction) => {
  // 使用轉發中間件將請求轉發到 B2B 發票 API
  await forwardRequest(req, res, next, 'https://www.giveme.com.tw/invoice.do?action=addB2B')
}

// B2C 發票處理程序
export const createB2CInvoice = async (req: Request, res: Response, next: NextFunction) => {
  // 使用轉發中間件將請求轉發到 B2C 發票 API
  await forwardRequest(req, res, next, 'https://www.giveme.com.tw/invoice.do?action=addB2C')
}
// 發票作廢處理程序
export const cancleInvoice = async (req: Request, res: Response, next: NextFunction) => {
  // 使用轉發中間件將請求轉發到 B2C 發票 API
  await forwardRequest(req, res, next, 'https://www.giveme.com.tw/invoice.do?action=cancelInvoice ')
}
// 列印處理程序
export const printInvoicePicture = async (req: Request, res: Response, next: NextFunction) => {
  // 使用轉發中間件將請求轉發到 B2C 發票 API
  await forwardRequest(req, res, next, 'https://www.giveme.com.tw/invoice.do?action=picture ')
}
export const createPayment = async (req: Request, res: Response, pool: mysql.Pool) => {
  const query = `INSERT INTO order_payments (order_code,payment_type_code,amount,payment_date,scheduled_payment_date,status_code,created_at,updated_at) 
  VALUES (?,?,?,?,?,?,?,?) `
  try {
    // 解构请求体中的内容
    const { order_id, payment_type_code, amount, payment_date, scheduled_payment_date, status_code } = req.body
    const values = [order_id, payment_type_code, amount, payment_date, scheduled_payment_date, status_code, today, today]
    // console.log(values)
    const connection = await pool.getConnection()
    const [rows] = await connection.execute(query, values)
    connection.release()
    // 准备要执行的SQL更新查询
    res.status(200).json({ success: true, message: rows })
  } catch (error) {
    // 如果在尝试过程中捕获到错误，返回500状态码和错误消息
    res.status(500).json({ message: '支付更新失敗。', error: error })
  }
}

export const updatePaymentStatus = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    console.log('geted information', req.body)
    const { RtnCode, PaymentDate, MerchantTradeNo, TradeAmt } = req.body
    const query = `INSERT INTO order_payments (order_code,payment_type_code,amount,payment_date,scheduled_payment_date,status_code)
  VALUES (?,?,?,?,?,?) `
    const format = 'yyyy/MM/dd HH:mm:ss'
    const dateTime = DateTime.fromFormat(PaymentDate, format)
    const output = dateTime.toISODate()
    const values = [MerchantTradeNo, 'credit', TradeAmt, output, '', 'C']
    if (RtnCode === '1') {
      const connection = await pool.getConnection()
      const [rows] = await connection.execute(query, values)
      console.log(rows)
    }
    res.status(200).send('1|OK')
  } catch (error) {
    console.log(error)
  }
}

// function encodeFormData(data: Record<string, any>): string {
//   return Object.keys(data)
//     .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
//     .join('&');
// }
export const createFunpoint = async (req: Request, res: Response) => {
  const {
    MerchantID,
    MerchantTradeNo,
    MerchantTradeDate,
    PaymentType,
    TotalAmount,
    TradeDesc,
    ItemName,
    ReturnURL,
    ChoosePayment,
    EncryptType,
    ClientBackURL,
    CheckMacValue
  } = req.body
  try {
    // const formdata = {
    //   MerchantID,
    //   MerchantTradeNo,
    //   MerchantTradeDate,
    //   PaymentType,
    //   TotalAmount,
    //   TradeDesc,
    //   ItemName,
    //   ReturnURL,
    //   ChoosePayment,
    //   EncryptType,
    //   PaymentInfoURL,
    //   OrderResultURL,
    //   ClientBackURL
    // }
    // const CheckMacValue = generateCheckValue(formdata)
    const sentForm: any = {
      MerchantID,
      MerchantTradeNo,
      MerchantTradeDate,
      PaymentType,
      TotalAmount,
      TradeDesc,
      ItemName,
      ReturnURL,
      ChoosePayment,
      EncryptType,
      ClientBackURL,
      CheckMacValue
    }
    // console.log(formdata)
    // const encodedFormdata = encodeFormData(sentForm);
    // const result = await apiPay.post('/Cashier/AioCheckOut/V5',encodedFormdata)
    const form = `<form action="https://payment-stage.funpoint.com.tw/Cashier/AioCheckOut/V5" method="POST" name="payment">
      <input name="MerchantID" value="${sentForm.MerchantID}"/>
      <input name="MerchantTradeNo" value="${sentForm.MerchantTradeNo}" />
      <input name="MerchantTradeDate" value="${sentForm.MerchantTradeDate}" />
      <input name="PaymentType" value="${sentForm.PaymentType}" />
      <input name="TotalAmount" value="${sentForm.TotalAmount}" />
      <input name="TradeDesc" value="${sentForm.TradeDesc}" />
      <input name="ItemName" value="${sentForm.ItemName}" />
      <input name="ReturnURL" value="${sentForm.ReturnURL}" />
      <input name="ChoosePayment" value="${sentForm.ChoosePayment}" />
      <input name="EncryptType" value="${sentForm.EncryptType}" />
      <input name="ClientBackURL" value="${sentForm.ClientBackURL}" />
      <input name="CheckMacValue" value="${sentForm.CheckMacValue}" />
      <button type="submit">Submit</button>
    </form>`
    res.status(200).json({
      status: 'Success',
      data: form
    })
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: error
    })
  }
}
// 開立發票
export const createInvoiceEcpay = async (req: Request, res: Response) => {
  try {
    console.log(req.body)
    const { data } = await apiPay.post('/B2CInvoice/Issue', req.body)
    const form = { invoice_num: data.Data.InvoiceNo, date: data.Data.InvoiceDate.split('+')[0], order_code: req.body.Data.RelateNumber }
    console.log(form)
    const make = await saveInvoice(form, pool)
    console.log(make)
    res.status(200).json(data)
  } catch (error) {
    res.status(500).json(error)
  }
}
// 列印發票
export const PrintInvoiceEcpay = async (req: Request, res: Response) => {
  try {
    const { data } = await apiPay.post('/B2CInvoice/InvoicePrint', req.body)
    console.log(data)
    res.status(200).json(data)
  } catch (error) {
    res.status(500).json(error)
  }
}
interface InvoicePrint {
  invoice_num: string
  order_code: string
  date: string
}
// 新增發票列表
export const saveInvoiceRoute = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    const { invoice_num, order_code, date } = req.body

    const query = `INSERT INTO order_invoice (order_code, invoice_num, date) VALUES (?, ?, ?)`
    const connection = await pool.getConnection()
    const [rows] = await connection.execute(query, [order_code, invoice_num, date])
    connection.release()

    res.json(rows) // 將結果返回給客戶端
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' }) // 如果出現錯誤，返回 500 錯誤
  }
}
// 更改狀態
export const deactivateInvoice = async (invoice_num: string, pool: mysql.Pool) => {
  try {
    const query = `UPDATE order_invoice SET is_active = 0 WHERE invoice_num = ?`
    const connection = await pool.getConnection()
    const [rows] = await connection.execute(query, [invoice_num])
    connection.release()
    return rows // 返回更新的行數，可以用來確認是否成功更新
  } catch (error) {
    console.error(error)
    throw error // 如果出現錯誤，將錯誤拋出以便處理
  }
}

const saveInvoice = async (val: InvoicePrint, pool: mysql.Pool) => {
  try {
    const { invoice_num, order_code, date } = val
    const query = `INSERT INTO order_invoice (order_code,invoice_num,date) VALUES (?,?,?)`
    const connection = await pool.getConnection()
    const [rows] = await connection.execute(query, [order_code, invoice_num, date])
    connection.release()
    return rows
  } catch (error) {
    return error
  }
}
export const findInvoice = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    const order_code = req.params.code
    const query = `SELECT * FROM order_invoice WHERE order_code LIKE ?`
    const connection = await pool.getConnection()
    const [rows] = await connection.execute(query, [order_code + '%'])
    connection.release()
    res.status(200).json(rows)
  } catch (error) {
    res.status(500).json(error)
  }
}
export const findInvoiceDate = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    const { date } = req.body
    console.log(date)
    const query = `SELECT * FROM order_invoice WHERE date = ?`
    const connection = await pool.getConnection()
    const [rows] = await connection.execute(query, [date])
    connection.release()
    res.status(200).json(rows)
  } catch (error) {
    res.status(500).json(error)
  }
}
// 作廢發票
export const InvalidInvoice = async (req: Request, res: Response) => {
  try {
    const { data } = await apiPay.post('/B2CInvoice/Invalid', req.body)
    if (data.Data.RtnCode === 1) {
      console.log(data)
      const query = `UPDATE order_invoice SET is_active = ? WHERE invoice_num = ?`
      const connection = await pool.getConnection()
      const [rows] = await connection.execute(query, [0, req.body.Data.InvoiceNo])
      connection.release()
      console.log(rows)
      res.status(200).json(data)
    } else {
      res.status(200).json(data)
    }
  } catch (error) {
    res.status(500).json(error)
  }
}
// function generateCheckValue(params:any) {
//   //將 params 從 Object 換成 Array
//   const entries = Object.entries(params);

//   //第一步，將 params 按照 key 值得字母順序排列
//   entries.sort((a, b) => {
//     return a[0].localeCompare(b[0]);
//   });

//   //第二步，用 key1=value1&key2=value2... 這樣的 pattern 將所有 params 串聯成字串
//   //並前後加上 HashKey & HashIV 的 value
//   let result =
//     `HashKey=${process.env.HashKey}&` +
//     entries.map((x) => `${x[0]}=${x[1]}`).join('&') +
//     `&HashIV=${process.env.HashIV}`;

//   //第三步，encode URL 並轉換成小寫
//   result = encodeURIComponent(result).toLowerCase();

//   //第四步，因爲綠姐姐的 URL encode 是 follow RFC 1866
//   //使用 js 的encodeURIComponent() 還需要處理一下
//   //follow guidence from ECPay https://www.ecpay.com.tw/CascadeFAQ/CascadeFAQ_Qa?nID=1197
//   result = result
//     .replace(/%2d/g, '-')
//     .replace(/%5f/g, '_')
//     .replace(/%2e/g, '.')
//     .replace(/%21/g, '!')
//     .replace(/%2a/g, '*')
//     .replace(/%28/g, '(')
//     .replace(/%29/g, ')')
//     .replace(/%20/g, '+');

//   //第五步，轉成 SHA256
//   result = SHA256(result).toString();

//   //最後，轉成大寫
//   return result.toUpperCase();
// }
