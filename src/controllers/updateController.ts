import { Request, Response } from 'express'
// import { Pool, MysqlError } from 'mysql';
import mysql from 'mysql2/promise'
// import axios from "axios"
// import * as util from 'util';
// import { pool } from "../pool";

// interface UpdateResult {
//   affectedRows: number;
// }
// type PaymentUpdateValues = [string, string, string, string, string, string, string];

export const updatePayment = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    const { code, method, paid, payed_off, payment_date, total, unpaid, scheduled_payment_date, invoice_num, payment_comment, paided } = req.body

    const paidAmount = parseFloat(paid)
    const paidedAmount = parseFloat(paided)
    const unpaidAmount = parseFloat(unpaid)

    const newPaidTotal = paidedAmount + paidAmount

    const newUnpaidTotal = unpaidAmount - paidAmount

    const query = `
      UPDATE orders SET 
        payment_date = ?,
        payment_paid = ?,
        payment_unpaid = ?,
        payment_total = ?,
        is_payed_off = ?,
        payment_method = ?,
        scheduled_payment_date = ?,
        invoice_num = ?,
        payment_comment = ?
      WHERE code = ?;
    `

    const values = [payment_date, newPaidTotal, newUnpaidTotal, total, payed_off, method, scheduled_payment_date, invoice_num, payment_comment, code]

    const connection = await pool.getConnection()
    const [rows] = await connection.execute(query, values)
    connection.release()

    res.status(200).json({ success: true, message: rows })
  } catch (error) {
    res.status(500).json({ message: '支付更新失敗。', error: error })
  }
}

export const readPayment = async (req: Request, res: Response, pool: mysql.Pool) => {
  const query = `SELECT * FROM order_payments WHERE order_code = ?;`
  const { id } = req.params
  try {
    const connection = await pool.getConnection()
    const [rows] = await connection.execute(query, [id])
    res.status(200).json({ success: true, result: rows })
  } catch (error) {
    res.status(500).json({ message: '支付更新失敗。', error: error })
  }
}

export const updateInvoice = async (req: Request, res: Response, pool: mysql.Pool) => {
  // 擴展 SQL 語句以包括 invoice_date 欄位
  const query = `
    UPDATE orders SET 
    invoice_num = ?,
    invoice_date = ? 
    WHERE code = ?;
  `
  // 從 req.body 中解構 date，以及其他現有參數
  const { code, invoice_num, date } = req.body

  try {
    const connection = await pool.getConnection()
    // 將 date 也作為參數傳入 execute 函數
    const [rows] = await connection.execute(query, [invoice_num, date, code])
    res.status(200).json({ success: true, result: rows })
  } catch (error) {
    res.status(500).json({ message: '支付更新失敗。', error: error })
  }
}

export const updateProductTime = async (req: Request, res: Response, pool: mysql.Pool) => {
  const query = `UPDATE orders SET production_start_time = ?, production_ready_time = ?,  production_sort_order_of_the_day = ?,shipping_status = ? , godelivery_time = ? WHERE code = ?;`
  const { code, production_start_time, production_ready_time, production_sort_order_of_the_day, shipping_status, godelivery_time } = req.body
  try {
    const connection = await pool.getConnection()
    const [rows] = await connection.execute(query, [
      production_start_time,
      production_ready_time,
      production_sort_order_of_the_day,
      shipping_status,
      godelivery_time,
      code
    ])
    res.status(200).json({ success: true, result: rows })
  } catch (error) {
    res.status(500).json({ message: '更新失敗。', error: error })
  }
}
export const updateProductTimeArray = async (req: Request, res: Response, pool: mysql.Pool) => {
  const query = `UPDATE orders SET production_start_time = ?, production_ready_time = ?, production_sort_order_of_the_day = ? WHERE code = ?;`
  try {
    const connection = await pool.getConnection()
    const updateResults = []

    for (const item of req.body) {
      const { code, production_start_time, production_ready_time, production_sort_order_of_the_day } = item
      const [rows] = await connection.execute(query, [production_start_time, production_ready_time, production_sort_order_of_the_day, code])
      updateResults.push(rows)
    }

    connection.release() // 釋放連接
    res.status(200).json({ success: true, result: updateResults })
  } catch (error) {
    res.status(500).json({ message: '更新失敗。', error: error })
  }
}
