import { Request, Response } from 'express'
import mysql from 'mysql2/promise'
import { fetchCityInfo, fetchStateInfo } from './stateService'
// import { DateTime } from "luxon";
import NodeCache from 'node-cache'
const myCache = new NodeCache({ stdTTL: 10000, checkperiod: 10000 })
const limit = 10000
const offset = 0

export interface StateInfo {
  id: number
  name: string
}
export interface CityInfo {
  city_id: number
  name: string
}
interface MyRowType {
  length: number
  shipping_state_id: number
  shipping_city_id: number
  name: string
  quantity: number
}
// ----------------------------------------------------------------

// fetch 地點
export const fetchOrderState = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    // Fetch state and city information in advance
    const stateInfo: StateInfo[] = await fetchStateInfo()
    const fetchedCityInfo: CityInfo[] = await fetchCityInfo(pool)
    const stateIdToNameMap: Record<string, string> = {}
    const cityIdToNameMap: Record<string, string> = {}
    // Build state ID to name map
    for (const state of stateInfo) {
      stateIdToNameMap[state.id] = state.name
    }
    for (const city of fetchedCityInfo) {
      cityIdToNameMap[String(city.city_id)] = city.name
    }
    const query = `
    SELECT * FROM orders 
    WHERE status_id != 115
      AND status_code != 'Void'
    LIMIT ${limit} OFFSET ${offset}
    
  `
    const connection = await pool.getConnection()
    const [rows] = await connection.execute(query)
    connection.release()
    // console.log((rows as RowDataPacket[])[0]);
    const cityCount: Record<string, number> = {}
    const stateCount: Record<string, number> = {}

    // Count occurrences of each state and city
    if (Array.isArray(rows)) {
      for (const row of rows as MyRowType[]) {
        if (row.shipping_state_id) {
          const stateId = String(row.shipping_state_id)
          stateCount[stateId] = (stateCount[stateId] || 0) + 1
        }
        if (row.shipping_city_id) {
          const cityId = String(row.shipping_city_id)
          cityCount[cityId] = (cityCount[cityId] || 0) + 1
        }
      }
    }

    // Transform counts to use names instead of IDs
    const transformedStateCount: Record<string, number> = {}
    const transformedCityCount: Record<string, number> = {}

    for (const [id, count] of Object.entries(stateCount)) {
      transformedStateCount[stateIdToNameMap[id] ?? id] = count
    }

    for (const [id, count] of Object.entries(cityCount)) {
      transformedCityCount[cityIdToNameMap[id] ?? id] = count
    }
    // 對 transformedCityCount 進行排序
    const sortedTransformedCityCount = Object.entries(transformedCityCount)
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [key, val]) => {
        acc[key] = val
        return acc
      }, {} as Record<string, number>)

    // 對 transformedStateCount 進行排序
    const sortedTransformedStateCount = Object.entries(transformedStateCount)
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [key, val]) => {
        acc[key] = val
        return acc
      }, {} as Record<string, number>)

    res.status(200).send([sortedTransformedStateCount, sortedTransformedCityCount])
  } catch (error) {
    console.error('Database query failed:', error)
    res.status(500).send('Internal Server Error')
  }
}
// ----------------------------------------------------------------
interface OrderProductRow {
  name: string
  value: string
  quantity: number
}
//fetch order_products from mysql
export const fetchOrderProducts = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    const connection = await pool.getConnection()
    const query = `SELECT * FROM order_products`
    const [rows] = await connection.execute(query)
    connection.release()

    // 檢查 rows 是否是我們預期的陣列類型
    if (Array.isArray(rows)) {
      const typedRows = rows as unknown as OrderProductRow[]
      // 統計每個 'name' 的出現次數（與數量相乘）
      const nameCount: Record<string, number> = typedRows.reduce<Record<string, number>>((acc, row: OrderProductRow) => {
        if (row && row.name && typeof row.quantity === 'number') {
          const name = row.name
          acc[name] = (acc[name] || 0) + row.quantity
        }
        return acc
      }, {})

      // 進行排序
      const sortedNameCountEntries = Object.entries(nameCount).sort((a, b) => b[1] - a[1])

      // 轉換為物件
      const sortedNameCountObject = Object.fromEntries(sortedNameCountEntries)

      res.status(200).send(sortedNameCountObject)
    } else {
      res.status(500).send('Unexpected data structure')
    }
  } catch (error) {
    console.error('Database query failed:', error)
    res.status(500).send(error)
  }
}
export const fetchOrderProductsByMonth = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    const connection = await pool.getConnection()
    const query = `SELECT op.* 
    FROM order_products AS op
    JOIN orders AS o ON op.order_id = o.id
    WHERE o.delivery_date BETWEEN ? AND ?
          AND o.status_id != 115
          AND o.status_code != 'Void'`
    // 將日期設為當天的 00:00:00（開始日期） 和 23:59:59（結束日期）
    const { startDate, endDate } = req.body
    const adjustedStartDate = `${startDate}-01 00:00:00`
    const adjustedEndDate = `${endDate}-31 23:59:59`
    const [rows] = await connection.execute(query, [adjustedStartDate, adjustedEndDate])
    connection.release()

    // 檢查 rows 是否是我們預期的陣列類型
    if (Array.isArray(rows)) {
      const typedRows = rows as unknown as OrderProductRow[]
      // 統計每個 'name' 的出現次數（與數量相乘）
      const nameCount: Record<string, number> = typedRows.reduce<Record<string, number>>((acc, row: OrderProductRow) => {
        if (row && row.name && typeof row.quantity === 'number') {
          const name = row.name
          acc[name] = (acc[name] || 0) + row.quantity
        }
        return acc
      }, {})

      // 進行排序
      const sortedNameCountEntries = Object.entries(nameCount).sort((a, b) => b[1] - a[1])

      // 轉換為物件
      const sortedNameCountObject = Object.fromEntries(sortedNameCountEntries)

      res.status(200).send(sortedNameCountObject)
    } else {
      res.status(500).send('Unexpected data structure')
    }
  } catch (error) {
    console.error('Database query failed:', error)
    res.status(500).send(error)
  }
}
interface RowDataPacket {
  value: number
  quantity: string
}

//fetch order_product_options fro mysql
export const fetchOrderProductOptions = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    const query = `SELECT opo.* 
    FROM order_product_options AS opo
    JOIN orders AS o ON opo.order_id = o.id
    WHERE o.status_id != 115
          AND o.status_code != 'Void';
    `
    // const query= `SELECT * FROM order_product_options WHERE created_at BETWEEN ? AND ?`
    const connection = await pool.getConnection()
    const [result] = await connection.execute(query)
    connection.release()

    const rows = result as RowDataPacket[]
    // console.log(rows);

    const summary: { [key: string]: number } = {}
    rows.forEach(row => {
      const quantity = parseInt(row.quantity)
      if (Object.prototype.hasOwnProperty.call(summary, row.value)) {
        summary[row.value] += quantity
      } else {
        summary[row.value] = quantity
      }
    })
    // 將 summary 物件轉為陣列並排序
    const sortedSummary = Object.entries(summary)
      .sort((a, b) => b[1] - a[1])
      .reduce<Record<string, number>>((obj, [key, value]) => {
        obj[key] = value
        return obj
      }, {})

    res.status(200).send(sortedSummary)
  } catch (error) {
    console.error('Database query failed:', error)
    res.status(500).send(error)
  }
}
export const fetchOrderProductOptionsByMonth = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    // const query= `SELECT * FROM order_product_options`
    const query = `SELECT opo.* 
    FROM order_product_options AS opo
    JOIN orders AS o ON opo.order_id = o.id
    WHERE o.delivery_date BETWEEN ? AND ?
      AND o.status_id != 115
      AND o.status_code != 'Void';
    `
    const connection = await pool.getConnection()
    const { startDate, endDate } = req.body
    const adjustedStartDate = `${startDate}-01 00:00:00`
    const adjustedEndDate = `${endDate}-31 23:59:59`
    const [result] = await connection.execute(query, [adjustedStartDate, adjustedEndDate])
    connection.release()

    const rows = result as RowDataPacket[]
    // console.log(rows);

    const summary: { [key: string]: number } = {}
    rows.forEach(row => {
      const quantity = parseInt(row.quantity)
      if (Object.prototype.hasOwnProperty.call(summary, row.value)) {
        summary[row.value] += quantity
      } else {
        summary[row.value] = quantity
      }
    })
    // 將 summary 物件轉為陣列並排序
    const sortedSummary = Object.entries(summary)
      .sort((a, b) => b[1] - a[1])
      .reduce<Record<string, number>>((obj, [key, value]) => {
        obj[key] = value
        return obj
      }, {})

    res.status(200).send(sortedSummary)
  } catch (error) {
    console.error('Database query failed:', error)
    res.status(500).send(error)
  }
}
// ----------------------------------------------------------------
export interface OrderData {
  code: string
  delivery_date: Date
  payment_total: string
  payment_unpaid: string
  payment_paid: string
}

export function sumPaymentsByMonth(orders: OrderData[]): { [key: string]: number } {
  const monthlySums: { [key: string]: number } = {}

  for (const order of orders) {
    if (order.delivery_date) {
      const date = new Date(order.delivery_date)
      if (!isNaN(date.getTime())) {
        // 檢查日期是否有效
        const month = date.getMonth() + 1
        const year = date.getFullYear()
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`

        const paymentTotal = parseFloat(order.payment_total)
        const paymentUnpaid = parseFloat(order.payment_unpaid)
        const paymentPaid = parseFloat(order.payment_paid)

        // 檢查是否是有效的數字
        if (!isNaN(paymentTotal) && !isNaN(paymentUnpaid) && !isNaN(paymentPaid)) {
          const currentSum = monthlySums[monthKey] || 0
          monthlySums[monthKey] = currentSum + paymentTotal
          // + paymentTotal
        }
      }
    }
  }

  return monthlySums
}

export function sortMonthlySums(monthlySums: { [key: string]: number }): { [key: string]: number } {
  const sortedKeys = Object.keys(monthlySums).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime()
  })

  const sortedMonthlySums: { [key: string]: number } = {}

  for (const key of sortedKeys) {
    sortedMonthlySums[key] = monthlySums[key]
  }

  return sortedMonthlySums
}

export const FetchOrderTotals = async (req: Request, res: Response, pool: mysql.Pool) => {
  let connection
  try {
    connection = await pool.getConnection()
    const query = `
    SELECT * FROM orders
    WHERE status_id != 115
      AND status_code != 'Void'
    
  `
    const [rows] = await connection.query(query)

    const orderData = rows as OrderData[] // 強制型別轉換

    const monthlySums = sumPaymentsByMonth(orderData)

    const sortedMonthlySums = sortMonthlySums(monthlySums) // 將月度加總排序

    res.status(200).json(sortedMonthlySums)
  } catch (error) {
    console.error('An error occurred:', error) // 輸出錯誤資訊到控制台
    res.status(500).json({ message: 'Internal Server Error' }) // 返回 500 錯誤
  } finally {
    if (connection) {
      connection.release() // 確保連接總是會被釋放
    }
  }
}
// ----------------------------------------------------------------
interface OftenRow {
  id: number
  personal_name: string
  total_orders: number
}
export const fetchOftenUser = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    const query = `SELECT personal_name, mobile, COUNT(*) as total_orders FROM orders WHERE status_id != 115 GROUP BY personal_name, mobile ORDER BY total_orders DESC LIMIT 50;`

    const connection = await pool.getConnection()
    const [rows] = await connection.execute(query)
    connection.release()

    const typedRows = rows as OftenRow[]
    const summary: { [key: string]: number } = {}
    // console.log(typedRows);
    typedRows.forEach(row => {
      const personalName = row.personal_name
      const totalOrders = row.total_orders

      // 因為是從資料庫查詢出來的，所以這邊不需要做 hasOwnProperty 的檢查
      summary[personalName] = totalOrders
    })
    const sortedSummary = Object.entries(summary)
      .sort((a, b) => b[1] - a[1])
      .reduce<Record<string, number>>((obj, [key, value]) => {
        obj[key] = value
        return obj
      }, {})

    res.status(200).json(sortedSummary)
  } catch (error) {
    console.error('An error occurred:', error) // 輸出錯誤資訊到控制台
    res.status(500).json({ message: 'Internal Server Error' }) // 返回 500 錯誤
  }
}
export const fetchOftenUserByMonth = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    const query = `
    SELECT personal_name, mobile, COUNT(*) as total_orders
    FROM orders
    WHERE status_id != 115
    AND created_at BETWEEN ? AND ? AND status_id != 115 
    AND status_code != 'Void'
    GROUP BY personal_name, mobile
    ORDER BY total_orders DESC
    LIMIT 50;`
    const { startDate, endDate } = req.body
    const adjustedStartDate = `${startDate}-01 00:00:00`
    const adjustedEndDate = `${endDate}-31 23:59:59`
    const connection = await pool.getConnection()
    const [rows] = await connection.execute(query, [adjustedStartDate, adjustedEndDate])
    connection.release()

    const typedRows = rows as OftenRow[]
    const summary: { [key: string]: number } = {}
    // console.log(typedRows);
    typedRows.forEach(row => {
      const personalName = row.personal_name
      const totalOrders = row.total_orders

      // 因為是從資料庫查詢出來的，所以這邊不需要做 hasOwnProperty 的檢查
      summary[personalName] = totalOrders
    })
    const sortedSummary = Object.entries(summary)
      .sort((a, b) => b[1] - a[1])
      .reduce<Record<string, number>>((obj, [key, value]) => {
        obj[key] = value
        return obj
      }, {})

    res.status(200).json(sortedSummary)
  } catch (error) {
    console.error('An error occurred:', error) // 輸出錯誤資訊到控制台
    res.status(500).json({ message: 'Internal Server Error' }) // 返回 500 錯誤
  }
}
// --------------------------------------------------------------------------------------------
export const fetchOrderPrice = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    const query = `SELECT DATE(o.delivery_date) AS delivery_date, SUM(ot.value) AS total_amount
    FROM orders AS o
    JOIN order_totals AS ot ON o.id = ot.order_id
    WHERE ot.sort_order = 4 AND status_id != 115 
    AND status_code != 'Void'
    GROUP BY DATE(o.delivery_date)
    ORDER BY DATE(o.delivery_date) DESC;
    `

    const connection = await pool.getConnection()
    const [result] = await connection.execute(query)
    const resultMap: { [key: string]: string } = {}
    const offset = 8 * 60 * 60 * 1000 // 時區偏移量為 8 小時，轉換成毫秒

    ;(result as Array<{ delivery_date: string | null; total_amount: string }>).forEach(item => {
      if (item.delivery_date !== null) {
        const utcMillis = new Date(item.delivery_date).getTime()
        const taipeiMillis = utcMillis + offset
        const taipeiDate = new Date(taipeiMillis)
        const date = taipeiDate.toISOString().split('T')[0] // 轉換成 YYYY-MM-DD 格式

        resultMap[date] = item.total_amount
      }
    })

    res.status(200).json(resultMap)
    connection.release()
  } catch (error) {
    console.error('An error occurred:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

// ----------------------------------------------------------------

//原本的 未照金額大小
// interface ResultRow {
//   shipping_city_id: number
//   total_payment: string
// }
// export const fetchCityIncome = async (req: Request, res: Response, pool: mysql.Pool) => {
//   try {
//     // Fetch state and city information in advance
//     let fetchedCityInfo = myCache.get('cityInfo') as CityInfo[] | undefined
//     let fetchedStateInfo = myCache.get('stateInfo') as StateInfo[] | undefined

//     if (!fetchedCityInfo || !fetchedStateInfo) {
//       fetchedCityInfo = await fetchCityInfo(pool)
//       fetchedStateInfo = await fetchStateInfo()
//       myCache.set('cityInfo', fetchedCityInfo, 3600)
//       myCache.set('stateInfo', fetchedStateInfo, 3600)
//     }
//     const cityIdToNameMap: Record<string, string> = {}
//     for (const city of fetchedCityInfo) {
//       cityIdToNameMap[String(city.city_id)] = city.name
//     }
//     const query = `SELECT shipping_city_id, SUM(payment_paid + payment_unpaid) AS total_payment FROM orders GROUP BY shipping_city_id ORDER BY
//     SUM(payment_paid  + payment_unpaid) DESC;`

//     const connection = await pool.getConnection()
//     const [result] = await connection.execute(query)
//     // const cityNames: string[] = [];
//     // const totalPayments: string[] = [];
//     const cityIncomeData: Record<string, string> = {}
//     // 遍歷查詢結果，並填充陣列
//     if (Array.isArray(result)) {
//       result.forEach(result => {
//         const row = result as ResultRow
//         const cityName = cityIdToNameMap[String(row.shipping_city_id)] // 使用映射获取城市名
//         if (cityName) {
//           // 确保 cityName 不是 undefined
//           cityIncomeData[cityName] = parseInt(row.total_payment).toString()
//         }
//       })
//     }

//     res.status(200).json(cityIncomeData)
//   } catch (error) {
//     console.error('An error occurred:', error)
//     res.status(500).json({ message: 'Internal Server Error' })
//   }
// }
//排序
export const fetchCityIncome = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    let fetchedCityInfo = myCache.get('cityInfo') as CityInfo[] | undefined
    let fetchedStateInfo = myCache.get('stateInfo') as StateInfo[] | undefined

    if (!fetchedCityInfo || !fetchedStateInfo) {
      fetchedCityInfo = await fetchCityInfo(pool)
      fetchedStateInfo = await fetchStateInfo()
      myCache.set('cityInfo', fetchedCityInfo, 3600)
      myCache.set('stateInfo', fetchedStateInfo, 3600)
    }

    const cityIdToNameMap: Record<string, string> = {}
    fetchedCityInfo.forEach(city => {
      cityIdToNameMap[String(city.city_id)] = city.name
    })

    const query = `SELECT 
    shipping_city_id, 
    SUM(payment_total) AS total_payment 
  FROM orders
  WHERE 
    status_id != 115 
    AND status_code != 'Void'
  GROUP BY shipping_city_id 
  ORDER BY SUM(payment_total) DESC;`

    const [result] = await pool.query<mysql.RowDataPacket[]>(query)

    const cityIncomeData: Record<string, number> = {}
    result.forEach((row: any) => {
      const cityName = cityIdToNameMap[String(row.shipping_city_id)]
      if (cityName) {
        cityIncomeData[cityName] = parseInt(row.total_payment, 10)
      }
    })

    // 根据值排序并返回
    const sortedCityIncomeData = Object.entries(cityIncomeData)
      .sort((a, b) => b[1] - a[1])
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

    res.status(200).json(sortedCityIncomeData)
  } catch (error) {
    console.error('An error occurred:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

export const fetchCityIncome2 = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    let fetchedCityInfo = myCache.get('cityInfo') as CityInfo[] | undefined
    let fetchedStateInfo = myCache.get('stateInfo') as StateInfo[] | undefined

    if (!fetchedCityInfo || !fetchedStateInfo) {
      fetchedCityInfo = await fetchCityInfo(pool)
      fetchedStateInfo = await fetchStateInfo()
      myCache.set('cityInfo', fetchedCityInfo, 3600)
      myCache.set('stateInfo', fetchedStateInfo, 3600)
    }

    const cityIdToNameMap: Record<string, string> = {}
    fetchedCityInfo.forEach(city => {
      cityIdToNameMap[String(city.city_id)] = city.name
    })

    const query = `SELECT 
    shipping_city_id, 
    SUM(payment_total) AS total_payment 
  FROM orders
  WHERE 
    status_id != 115 
    AND status_code != 'Void'
  GROUP BY shipping_city_id 
  ORDER BY SUM(payment_total) DESC;`

    const [result] = await pool.query<mysql.RowDataPacket[]>(query)

    const cityIncomeData: Record<string, number> = {}
    result.forEach(row => {
      const cityName = cityIdToNameMap[String(row.shipping_city_id)]
      if (cityName) {
        cityIncomeData[cityName] = parseInt(row.total_payment, 10)
      }
    })

    // 群組
    const mergeGroups = {
      第一區: ['大同區', '中山區', '松山區'],
      第二區: ['中正區', '大安區', '信義區', '萬華區', '自取區'],
      第三區: ['中和區', '永和區', '文山區', '新店區'],
      第四區: ['板橋區', '土城區', '樹林區', '三峽區', '鶯歌區'],
      第五區: ['三重區', '新莊區', '蘆洲區', '五股區', '泰山區', '林口區'],
      第六區: ['淡水區', '北投區', '士林區'],
      第七區: ['內湖區', '南港區', '汐止區'],
      其他區: ['龜山區', '坪林區', '萬里區', '中壢區', '七堵區', '平鎮區', '八德區', '龍潭區', '蘆竹區', '金山區', '深坑區', '石門區', '楊梅區', '大溪區', '大園區']
    }

    // 加總
    const mergedIncomeData: Record<string, number> = {}
    for (const [group, cities] of Object.entries(mergeGroups)) {
      mergedIncomeData[group] = cities.reduce((acc, city) => acc + (cityIncomeData[city] || 0), 0)
    }

    const sortedMergedIncomeData = Object.entries(mergedIncomeData)
      .sort((a, b) => b[1] - a[1])
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

    res.status(200).json(sortedMergedIncomeData)
  } catch (error) {
    console.error('An error occurred:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

interface ResultRowMonth {
  shipping_city_id: number
  average_unit_price: string
}
export const fetchCityIncomeAverage = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    let fetchedCityInfo = myCache.get('cityInfo') as CityInfo[] | undefined
    let fetchedStateInfo = myCache.get('stateInfo') as StateInfo[] | undefined

    if (!fetchedCityInfo || !fetchedStateInfo) {
      fetchedCityInfo = await fetchCityInfo(pool)
      fetchedStateInfo = await fetchStateInfo()
      myCache.set('cityInfo', fetchedCityInfo, 3600)
      myCache.set('stateInfo', fetchedStateInfo, 3600)
    }
    const cityIdToNameMap: Record<string, string> = {}
    for (const city of fetchedCityInfo) {
      cityIdToNameMap[String(city.city_id)] = city.name
    }
    const query = `SELECT 
    shipping_city_id, 
    SUM(payment_total)/COUNT(*)  AS average_unit_price 
    FROM orders 
    WHERE 
    delivery_date BETWEEN ? AND ? 
    AND status_id != 115 
    AND status_code != 'Void'  
    GROUP BY shipping_city_id 
    ORDER BY average_unit_price DESC`
    const { startDate, endDate } = req.body
    const adjustedStartDate = `${startDate}-01 00:00:00`
    const adjustedEndDate = `${endDate}-31 23:59:59`
    const connection = await pool.getConnection()
    const [rows] = await connection.execute(query, [adjustedStartDate, adjustedEndDate])
    connection.release()
    // console.log(rows)
    const cityIncomeData: Record<string, string> = {}
    // 遍歷查詢結果，並填充陣列
    if (Array.isArray(rows)) {
      rows.forEach(rows => {
        const row = rows as ResultRowMonth
        const cityName = cityIdToNameMap[String(row.shipping_city_id)] // 使用映射获取城市名
        if (cityName) {
          // 确保 cityName 不是 undefined
          cityIncomeData[cityName] = parseInt(row.average_unit_price).toString()
        }
      })
    }

    res.status(200).json(cityIncomeData)
  } catch (error) {
    console.error('An error occurred:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}
interface GroupedIncomeData {
  [key: string]: number
}

export const fetchCityIncomeAverage2 = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    let fetchedCityInfo = myCache.get('cityInfo') as CityInfo[] | undefined
    let fetchedStateInfo = myCache.get('stateInfo') as StateInfo[] | undefined

    if (!fetchedCityInfo || !fetchedStateInfo) {
      fetchedCityInfo = await fetchCityInfo(pool)
      fetchedStateInfo = await fetchStateInfo()
      myCache.set('cityInfo', fetchedCityInfo, 3600)
      myCache.set('stateInfo', fetchedStateInfo, 3600)
    }

    const cityIdToNameMap: Record<string, string> = {}
    fetchedCityInfo.forEach(city => {
      cityIdToNameMap[String(city.city_id)] = city.name
    })

    const query = `SELECT shipping_city_id, SUM(payment_total)/COUNT(*) AS average_unit_price FROM orders WHERE delivery_date BETWEEN ? AND ? AND status_id != 115 AND status_code != 'Void' GROUP BY shipping_city_id ORDER BY average_unit_price DESC`
    const { startDate, endDate } = req.body
    const adjustedStartDate = `${startDate}-01 00:00:00`
    const adjustedEndDate = `${endDate}-31 23:59:59`
    const connection = await pool.getConnection()
    const [rows] = await connection.execute(query, [adjustedStartDate, adjustedEndDate])
    connection.release()

    const mergeGroups: { [key: string]: string[] } = {
      第一區: ['大同區', '中山區', '松山區'],
      第二區: ['中正區', '大安區', '信義區', '萬華區', '自取區'],
      第三區: ['中和區', '永和區', '文山區', '新店區'],
      第四區: ['板橋區', '土城區', '樹林區', '三峽區', '鶯歌區'],
      第五區: ['三重區', '新莊區', '蘆洲區', '五股區', '泰山區', '林口區'],
      第六區: ['淡水區', '北投區', '士林區'],
      第七區: ['內湖區', '南港區', '汐止區'],
      其他區: ['龜山區', '坪林區', '萬里區', '中壢區', '七堵區', '平鎮區', '八德區', '龍潭區', '蘆竹區', '金山區', '深坑區', '石門區', '楊梅區', '大溪區', '大園區']
    }

    const groupIncomeData: GroupedIncomeData = {}

    if (Array.isArray(rows)) {
      rows.forEach(row => {
        const resultRow = row as ResultRowMonth
        const cityName = cityIdToNameMap[String(resultRow.shipping_city_id)]
        if (cityName) {
          Object.keys(mergeGroups).forEach(group => {
            if (mergeGroups[group].includes(cityName)) {
              groupIncomeData[group] = groupIncomeData[group] || 0
              groupIncomeData[group] += parseInt(resultRow.average_unit_price, 10)
            }
          })
        }
      })
    }
    interface GroupedIncomeData {
      [key: string]: number
    }
    const sortedGroupIncomeArray: [string, number][] = Object.entries(groupIncomeData).sort((a, b) => b[1] - a[1]) // 按照金額從高到低排序

    // Convert back to object
    const sortedGroupIncomeData = sortedGroupIncomeArray.reduce((acc: GroupedIncomeData, [key, value]) => {
      acc[key] = value
      return acc
    }, {} as GroupedIncomeData)

    res.status(200).json(sortedGroupIncomeData)
  } catch (error) {
    console.error('An error occurred:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

// -------------------------------------------------
export const fetchOrderProductsOneDay = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    const connection = await pool.getConnection()
    const query = `SELECT op.*, DATE(o.delivery_date) as deliveryDate
    FROM orders AS o
    JOIN order_products AS op ON o.id = op.order_id
    WHERE DATE(o.delivery_date) BETWEEN ? AND ? AND o.status_code!='Void' AND o.status_id != 115 `
    const { startDate, endDate } = req.body
    const [rows] = await connection.execute(query, [startDate, endDate])
    connection.release()

    if (Array.isArray(rows)) {
      const typedRows = rows as unknown as (OrderProductRow & { deliveryDate: string })[]

      // 初始化以日期為鍵的物件
      const dateWiseTotals: Record<string, number> = {}
      const nameCount: Record<string, number> = typedRows.reduce<Record<string, number>>((acc, row) => {
        if (row && row.name && typeof row.quantity === 'number') {
          const name = row.name
          acc[name] = (acc[name] || 0) + row.quantity

          // 更新以日期為鍵的 TOTAL
          const date = row.deliveryDate
          dateWiseTotals[date!] = (dateWiseTotals[date!] || 0) + row.quantity
        }
        return acc
      }, {})

      // 進行排序
      const sortedNameCountEntries = Object.entries(nameCount).sort((a, b) => b[1] - a[1])
      const sortedNameCountObject = Object.fromEntries(sortedNameCountEntries)

      // 回傳物件
      res.status(200).send({
        sortedNameCountObject,
        TOTAL_BY_DATE: dateWiseTotals
      })
    } else {
      res.status(500).send('Unexpected data structure')
    }
  } catch (error) {
    console.error('Database query failed:', error)
    res.status(500).send(error)
  }
}

interface lengthRows {
  deliveryDate: string
  orderCount: number
}
export const fetchOrderLengthByDate = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    const connection = await pool.getConnection()
    const query = `
      SELECT DATE(delivery_date) as deliveryDate, COUNT(*) as orderCount
      FROM orders
      WHERE DATE(delivery_date) BETWEEN ? AND ?
      GROUP BY DATE(delivery_date)
    `
    const { startDate, endDate } = req.body
    const [rows]: lengthRows[] = (await connection.execute(query, [startDate, endDate])) as unknown as lengthRows[]
    connection.release()

    res.status(200).send({ rows })
  } catch (error) {
    res.status(500).send(error)
  }
}
