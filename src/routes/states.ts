import express, { Request, Response, Router } from 'express'
const router: Router = express.Router()
import { FetchOrderTotals, FetchOrderTotalsByMonth, FetchOrderTotalsByMonth2 } from '../controllers/DistrictController'
import { pool } from '../pool'
// ---------------------------------------------------
router.post('/state', async (req: Request, res: Response) => {
  await FetchOrderTotals(req, res, pool)
})
router.post('/month', async (req: Request, res: Response) => {
  await FetchOrderTotalsByMonth(req, res, pool)
})
router.post('/month2', async (req: Request, res: Response) => {
  await FetchOrderTotalsByMonth2(req, res, pool)
})
export default router
