import { Request, Response } from 'express'
import mysql from 'mysql2/promise'
import { sumPaymentsByMonth, sortMonthlySums, OrderData, StateInfo, CityInfo } from './cityControllers'
import { fetchCityInfo, fetchStateInfo } from './stateService'
import NodeCache from 'node-cache'
const myCache = new NodeCache({ stdTTL: 10000, checkperiod: 10000 })

// ---------------------------------------------------------------
const OrderData: OrderData[] = []
export const FetchOrderTotals = async (req: Request, res: Response, pool: mysql.Pool) => {
  let connection
  try {
    connection = await pool.getConnection()
    const query = `SELECT * FROM orders WHERE shipping_city_id = ? AND status_id != 115 AND status_code != 'Void' `

    const { shippingCity, startDate, endDate } = req.body
    const [rows] = await connection.query(query, [shippingCity, startDate, endDate])
    connection.release()
    const orderData = rows as OrderData[] // 強制型別轉換

    const monthlySums = sumPaymentsByMonth(orderData)

    const sortedMonthlySums = sortMonthlySums(monthlySums) // 將月度加總排序

    res.status(200).json(sortedMonthlySums)
  } catch (error) {
    console.error('An error occurred:', error) // 輸出錯誤資訊到控制台
    res.status(500).json({ message: 'Internal Server Error' }) // 返回 500 錯誤
  }
}

interface ResultRowMonth {
  shipping_city_id: number
  total_payment: string
}
export const FetchOrderTotalsByMonth = async (req: Request, res: Response, pool: mysql.Pool) => {
  let connection
  try {
    connection = await pool.getConnection()
    const query = `
    SELECT 
        shipping_city_id, 
        SUM(payment_total) AS total_payment 
    FROM 
        orders 
    WHERE DATE(delivery_date) BETWEEN ? AND ?
    AND status_id != 115
     AND status_code != 'Void'
    GROUP BY 
        shipping_city_id 
    ORDER BY 
        SUM(payment_total) DESC;
`

    const { startDate, endDate } = req.body
    const adjustedStartDate = `${startDate}-01 00:00:00`
    const adjustedEndDate = `${endDate}-31 23:59:59`
    const [rows] = await connection.query(query, [adjustedStartDate, adjustedEndDate])
    console.log(rows)
    connection.release()
    const cityIncomeData: Record<string, string> = {}
    // 遍歷查詢結果，並填充陣列
    let fetchedCityInfo = myCache.get('cityInfo') as CityInfo[] | undefined
    let fetchedStateInfo = myCache.get('stateInfo') as StateInfo[] | undefined
    if (!fetchedCityInfo || !fetchedStateInfo) {
      fetchedCityInfo = await fetchCityInfo(pool)
      fetchedStateInfo = await fetchStateInfo()
      myCache.set('cityInfo', fetchedCityInfo, 3600)
      myCache.set('stateInfo', fetchedStateInfo, 3600)
    }

    if (Array.isArray(rows)) {
      rows.forEach(rows => {
        const row = rows as ResultRowMonth
        const cityIdToNameMap: Record<string, string> = {}
        for (const city of fetchedCityInfo!) {
          cityIdToNameMap[String(city.city_id)] = city.name
        }
        const cityName = cityIdToNameMap[String(row.shipping_city_id)] // 使用映射获取城市名
        if (cityName) {
          // 确保 cityName 不是 undefined
          cityIncomeData[cityName] = parseInt(row.total_payment).toString()
        }
      })
    }
    res.status(200).json(cityIncomeData)
  } catch (error) {
    console.error('An error occurred:', error) // 輸出錯誤資訊到控制台
    res.status(500).json({ message: 'Internal Server Error' }) // 返回 500 錯誤
  }
}

export const FetchOrderTotalsByMonth2 = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    let fetchedCityInfo = myCache.get('cityInfo') as CityInfo[] | undefined

    if (!fetchedCityInfo) {
      fetchedCityInfo = await fetchCityInfo(pool)
      myCache.set('cityInfo', fetchedCityInfo, 3600)
    }

    const cityIdToNameMap: Record<string, string> = {}
    fetchedCityInfo.forEach(city => {
      cityIdToNameMap[String(city.city_id)] = city.name
    })

    const { startDate, endDate } = req.body
    const adjustedStartDate = `${startDate}-01 00:00:00`
    const adjustedEndDate = `${endDate}-31 23:59:59`

    const query = `
    SELECT 
        shipping_city_id, 
        SUM(payment_total) AS total_payment 
    FROM 
        orders 
    WHERE DATE(delivery_date) BETWEEN ? AND ?
    AND status_id != 115
    AND status_code != 'Void'
    GROUP BY 
        shipping_city_id 
    ORDER BY 
        SUM(payment_total) DESC;
    `

    const [result] = await pool.query<mysql.RowDataPacket[]>(query, [adjustedStartDate, adjustedEndDate])

    const cityIncomeData: Record<string, number> = {}
    result.forEach(row => {
      const cityName = cityIdToNameMap[String(row.shipping_city_id)]
      if (cityName) {
        cityIncomeData[cityName] = parseInt(row.total_payment, 10)
      }
    })

    // Predefined regional groupings
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

    // Sum payments by region
    const mergedIncomeData: Record<string, string> = {}
    for (const [group, cities] of Object.entries(mergeGroups)) {
      const total = cities.reduce((acc, city) => acc + (cityIncomeData[city] || 0), 0)
      mergedIncomeData[group] = total.toString()
    }

    // Sort regions by total payment in descending order and convert totals to strings
    const sortedMergedIncomeData = Object.entries(mergedIncomeData)
      .sort((a, b) => parseInt(b[1]) - parseInt(a[1]))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

    res.status(200).json(sortedMergedIncomeData)
  } catch (error) {
    console.error('An error occurred:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}
