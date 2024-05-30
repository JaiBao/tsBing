import express, { Request, Response, Router } from 'express'
// import mysql from "mysql2/promise";
import {
  createPayment,
  updatePaymentStatus,
  createFunpoint,
  createInvoiceEcpay,
  PrintInvoiceEcpay,
  findInvoice,
  InvalidInvoice,
  findInvoiceDate,
  createB2CInvoice,
  createB2BInvoice,
  saveInvoiceRoute,
  cancleInvoice,
  deactivateInvoice,
  printInvoicePicture,
  getInvoiceUrl
} from '../controllers/PaymentController'
import { readPayment, updateInvoice, updateProductTime, updateProductTimeArray } from '../controllers/updateController'
import { pool } from '../pool'
// import update from "../middleware/upload";

const router: Router = express.Router()

router.post('/create', async (req: Request, res: Response) => {
  await createPayment(req, res, pool)
})
router.post('/update', async (req: Request, res: Response) => {
  await updateInvoice(req, res, pool)
})
router.get('/get/:id', async (req: Request, res: Response) => {
  await readPayment(req, res, pool)
})

router.post('/updatetime', async (req: Request, res: Response) => {
  await updateProductTime(req, res, pool)
})

router.post('/updatetime/all', async (req: Request, res: Response) => {
  await updateProductTimeArray(req, res, pool)
})

router.post('/updatepayment', async (req: Request, res: Response) => {
  await updatePaymentStatus(req, res, pool)
})

router.post('/createfunpoint', async (req: Request, res: Response) => {
  await createFunpoint(req, res)
})

router.post('/b2c-invoice', createB2CInvoice)
router.post('/b2b-invoice', createB2BInvoice)
router.post('/cancleInvoice', cancleInvoice)
router.post('/printInvoicePicture', printInvoicePicture)
router.get('/print/:invoiceNum', getInvoiceUrl)
router.post('/saveInvoice', async (req: Request, res: Response) => {
  await saveInvoiceRoute(req, res, pool)
})

router.post('/deactivateInvoice', async (req, res) => {
  const { invoice_num } = req.body
  try {
    await deactivateInvoice(invoice_num, pool) // 呼叫函數更新資料庫
    res.status(200).json({ message: 'Invoice deactivated successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to deactivate invoice' })
  }
})

// 開立發票
router.post('/createecpay', async (req: Request, res: Response) => {
  await createInvoiceEcpay(req, res)
})
// 列印發票
router.post('/printecpay', async (req: Request, res: Response) => {
  await PrintInvoiceEcpay(req, res)
})
// 作廢發票
router.post('/invalidecpay', async (req: Request, res: Response) => {
  await InvalidInvoice(req, res)
})

//內部自己找發票(訂單編號)
router.get('/findinvoice/:code', async (req: Request, res: Response) => {
  await findInvoice(req, res, pool)
})
//內部自己找發票(日期)
router.post('/findinvoice/date', async (req: Request, res: Response) => {
  await findInvoiceDate(req, res, pool)
})
export default router
