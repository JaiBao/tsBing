import express, { Request, Response } from 'express'
import mysql from 'mysql2/promise'
import cors from 'cors'
import './passport/passport'
import { pool } from './pool'
import * as cityController from './controllers/cityControllers'
import * as userController from './controllers/userControllers'
import * as CusController from './controllers/CusControllers'
import * as MaterialController from './controllers/MaterialControllers'
import * as UpdateController from './controllers/updateController'
// import * as PrintController from "./controllers/printController";
import loginRoute from './routes/login'
import uploadRoute from './routes/upload'
import payRoute from './routes/pay'
import OrderRoute from './routes/order'
import timeRoute from './routes/timestamp'
import timeLimitRoute from './routes/timelimit'
import stateRoute from './routes/states'
import deliveryRoute from './routes/delivery'
const app = express()
app.use(express.json())
app.use(
  cors({
    origin: '*'
  })
)

app.use(express.urlencoded({ extended: true }))
const checkMySQLConnection = async (pool: mysql.Pool) => {
  try {
    const connection = await pool.getConnection()
    await connection.ping() // 檢測是否能夠正常ping通
    connection.release() // 釋放連接回連接池
    console.log('MySQL connected successfully.')
  } catch (error) {
    console.error('MySQL connection failed:', error)
  }
}

app.get('/', (req: Request, res: Response) => {
  res.status(200).send('OK')
})
// ----------------------------------------------------------------
app.use('/login', loginRoute)
app.use('/pay', payRoute)
app.use('/order', OrderRoute)
app.use('/time', timeRoute)
app.use('/timelimit', timeLimitRoute)
app.use('/s3test', uploadRoute)
app.use('/state', stateRoute)
app.use('/delivery', deliveryRoute)
app.get('/read', async (req, res) => {
  await cityController.fetchOrderState(req, res, pool)
})
app.get('/read2', async (req, res) => {
  await cityController.fetchOrderProducts(req, res, pool)
})
app.post('/read2', async (req, res) => {
  await cityController.fetchOrderProductsByMonth(req, res, pool)
})
app.get('/read3', async (req, res) => {
  await cityController.fetchOrderProductOptions(req, res, pool)
})
app.post('/read3', async (req, res) => {
  await cityController.fetchOrderProductOptionsByMonth(req, res, pool)
})
app.get('/read4', async (req, res) => {
  await cityController.FetchOrderTotals(req, res, pool)
})

app.get('/read5', async (req, res) => {
  await userController.fetchUserState(req, res, pool)
})
app.get('/read98', async (req, res) => {
  await userController.fetchUserState2(req, res, pool)
})
app.post('/usermonth', async (req, res) => {
  await userController.fetchUserStateByMonth(req, res, pool)
})
app.post('/usermonth2', async (req, res) => {
  await userController.fetchUserStateByMonth2(req, res, pool)
})

app.get('/often', async (req, res) => {
  await cityController.fetchOftenUser(req, res, pool)
})
app.post('/often', async (req, res) => {
  await cityController.fetchOftenUserByMonth(req, res, pool)
})
app.get('/price', async (req, res) => {
  await cityController.fetchOrderPrice(req, res, pool)
})

app.get('/income', async (req, res) => {
  await cityController.fetchCityIncome(req, res, pool)
})
app.get('/income2', async (req, res) => {
  await cityController.fetchCityIncome2(req, res, pool)
})
app.post('/income', async (req, res) => {
  await cityController.fetchCityIncomeAverage(req, res, pool)
})
app.post('/income2', async (req, res) => {
  await cityController.fetchCityIncomeAverage2(req, res, pool)
})
app.post('/newcus', async (req, res) => {
  await CusController.getNewCustomer(req, res, pool)
})
app.post('/fetch', async (req, res) => {
  await MaterialController.Fetch(req, res, pool)
})
app.post('/productsoneday', async (req, res) => {
  await cityController.fetchOrderProductsOneDay(req, res, pool)
})

app.post('/productsonedaylength', async (req, res) => {
  await cityController.fetchOrderLengthByDate(req, res, pool)
})

app.post('/payment', async (req, res) => {
  await UpdateController.updatePayment(req, res, pool)
})

app.use('/public', express.static('public'))

app.use((req, res) => {
  res.status(404).json('404 Not Found')
})

app.listen(process.env.PORT, () => {
  console.log(`Server running at ${process.env.PORT || 3000},,${process.env.DB}`)
  checkMySQLConnection(pool)
})
