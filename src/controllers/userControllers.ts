// import axios from "axios";
import { Request, Response } from 'express'
import mysql from 'mysql2/promise'
import NodeCache from 'node-cache'
import { fetchCityInfo, fetchStateInfo } from './stateService'
import { pool } from '../pool'
const limit = 10000
const offset = 0
const myCache = new NodeCache({ stdTTL: 10000, checkperiod: 10000 })
// ----------------------------------------------------------------
interface CityInfo {
  city_id: number
  name: string
}
interface StateInfo {
  id: number
  name: string
}
interface MyRowType {
  length: number
  shipping_state_id: number
  shipping_city_id: number
  name: string
  quantity: number
}

//first time async fetch state and city
;(async () => {
  let fetchedCityInfo = myCache.get('cityInfo') as CityInfo[] | undefined
  let fetchedStateInfo = myCache.get('stateInfo') as StateInfo[] | undefined

  if (!fetchedCityInfo || !fetchedStateInfo) {
    fetchedCityInfo = await fetchCityInfo(pool)
    fetchedStateInfo = await fetchStateInfo()
    myCache.set('cityInfo', fetchedCityInfo, 3600)
    myCache.set('stateInfo', fetchedStateInfo, 3600)
  }
})()

// fetch 地點
export const fetchUserState = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    // Fetch state and city information in advance
    let fetchedCityInfo = myCache.get('cityInfo') as CityInfo[] | undefined
    let fetchedStateInfo = myCache.get('stateInfo') as StateInfo[] | undefined

    if (!fetchedCityInfo || !fetchedStateInfo) {
      fetchedCityInfo = await fetchCityInfo(pool)
      fetchedStateInfo = await fetchStateInfo()
      myCache.set('cityInfo', fetchedCityInfo, 3600)
      myCache.set('stateInfo', fetchedStateInfo, 3600)
    }
    // ----------------------------------------------------------------
    const stateIdToNameMap: Record<string, string> = {}
    const cityIdToNameMap: Record<string, string> = {}
    // Build state ID to name map
    for (const state of fetchedStateInfo) {
      stateIdToNameMap[state.id] = state.name
    }
    for (const city of fetchedCityInfo) {
      cityIdToNameMap[String(city.city_id)] = city.name
    }
    const connection = await pool.getConnection()
    const [rows] = await connection.execute(`SELECT * FROM users LIMIT ${limit} OFFSET ${offset}`)
    connection.release()
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

export const fetchUserState2 = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    let fetchedCityInfo = myCache.get('cityInfo') as CityInfo[] | undefined
    let fetchedStateInfo = myCache.get('stateInfo') as StateInfo[] | undefined

    if (!fetchedCityInfo || !fetchedStateInfo) {
      // Assume these functions are defined and correctly fetch the city and state info
      fetchedCityInfo = await fetchCityInfo(pool)
      fetchedStateInfo = await fetchStateInfo()
      myCache.set('cityInfo', fetchedCityInfo, 3600)
      myCache.set('stateInfo', fetchedStateInfo, 3600)
    }

    const stateIdToNameMap: Record<string, string> = {}
    const cityIdToNameMap: Record<string, string> = {}
    fetchedStateInfo.forEach(state => {
      stateIdToNameMap[state.id] = state.name
    })
    fetchedCityInfo.forEach(city => {
      cityIdToNameMap[city.city_id] = city.name
    })

    const connection = await pool.getConnection()
    const [rows]: [any[], any] = (await connection.execute(`SELECT * FROM users LIMIT ? OFFSET ?`, [limit, offset])) as [any[], any]
    connection.release()

    const cityCount: Record<string, number> = {}
    const stateCount: Record<string, number> = {}

    rows.forEach(row => {
      if (row.shipping_state_id) {
        const stateId = String(row.shipping_state_id)
        stateCount[stateId] = (stateCount[stateId] || 0) + 1
      }
      if (row.shipping_city_id) {
        const cityId = String(row.shipping_city_id)
        cityCount[cityId] = (cityCount[cityId] || 0) + 1
      }
    })

    const transformedStateCount: Record<string, number> = {}
    const transformedCityCount: Record<string, number> = {}

    Object.entries(stateCount).forEach(([id, count]) => {
      transformedStateCount[stateIdToNameMap[id] ?? id] = count
    })

    Object.entries(cityCount).forEach(([id, count]) => {
      transformedCityCount[cityIdToNameMap[id] ?? id] = count
    })

    // Define your merging groups for cities
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

    // Merge and sum the counts for the defined groups
    const mergedCityCounts: Record<string, number> = {}

    Object.entries(mergeGroups).forEach(([newName, groupCities]) => {
      let groupTotal = 0
      groupCities.forEach(cityName => {
        if (transformedCityCount[cityName]) {
          groupTotal += transformedCityCount[cityName]
          delete transformedCityCount[cityName] // Remove the city from original counts to avoid double counting
        }
      })
      mergedCityCounts[newName] = groupTotal
    })

    // Combine the remaining ungrouped cities with the merged groups
    const finalCityCounts = { ...transformedCityCount, ...mergedCityCounts }

    // Sort both state and city counts
    const sortedStateCounts = Object.entries(transformedStateCount)
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {})

    const sortedCityCounts = Object.entries(finalCityCounts)
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {})

    res.status(200).json([sortedStateCounts, sortedCityCounts])
  } catch (error) {
    console.error('Database query failed:', error)
    res.status(500).send('Internal Server Error')
  }
}
// ----------------------------------------------------------------
export const fetchUserStateByMonth = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    // Fetch state and city information in advance
    let fetchedCityInfo = myCache.get('cityInfo') as CityInfo[] | undefined
    let fetchedStateInfo = myCache.get('stateInfo') as StateInfo[] | undefined

    if (!fetchedCityInfo || !fetchedStateInfo) {
      fetchedCityInfo = await fetchCityInfo(pool)
      fetchedStateInfo = await fetchStateInfo()
      myCache.set('cityInfo', fetchedCityInfo, 3600)
      myCache.set('stateInfo', fetchedStateInfo, 3600)
    }
    // ----------------------------------------------------------------
    const stateIdToNameMap: Record<string, string> = {}
    const cityIdToNameMap: Record<string, string> = {}
    // Build state ID to name map
    for (const state of fetchedStateInfo) {
      stateIdToNameMap[state.id] = state.name
    }
    for (const city of fetchedCityInfo) {
      cityIdToNameMap[String(city.city_id)] = city.name
    }
    const connection = await pool.getConnection()
    // 將日期設為當天的 00:00:00（開始日期） 和 23:59:59（結束日期）
    const { startDate, endDate } = req.body
    const adjustedStartDate = `${startDate}-01 00:00:00`
    const adjustedEndDate = `${endDate}-31 23:59:59`

    const query = `SELECT * FROM users WHERE created_at BETWEEN ? AND ? LIMIT ? OFFSET ?`

    const [rows] = await connection.execute(query, [adjustedStartDate, adjustedEndDate, limit, offset])

    connection.release()
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

export const fetchUserStateByMonth2 = async (req: Request, res: Response, pool: mysql.Pool) => {
  try {
    let fetchedCityInfo = myCache.get('cityInfo') as CityInfo[] | undefined
    let fetchedStateInfo = myCache.get('stateInfo') as StateInfo[] | undefined

    if (!fetchedCityInfo || !fetchedStateInfo) {
      fetchedCityInfo = await fetchCityInfo(pool)
      fetchedStateInfo = await fetchStateInfo()
      myCache.set('cityInfo', fetchedCityInfo, 3600)
      myCache.set('stateInfo', fetchedStateInfo, 3600)
    }

    const stateIdToNameMap: Record<string, string> = {}
    const cityIdToNameMap: Record<string, string> = {}
    fetchedStateInfo.forEach(state => {
      stateIdToNameMap[state.id] = state.name
    })
    fetchedCityInfo.forEach(city => {
      cityIdToNameMap[city.city_id] = city.name
    })

    const connection = await pool.getConnection()
    const { startDate, endDate } = req.body
    const adjustedStartDate = `${startDate}-01 00:00:00`
    const adjustedEndDate = `${endDate}-31 23:59:59`

    const [rows]: [MyRowType[], any] = (await connection.execute(`SELECT * FROM users WHERE created_at BETWEEN ? AND ?`, [adjustedStartDate, adjustedEndDate])) as [
      MyRowType[],
      any
    ]
    connection.release()

    const cityCount: Record<string, number> = {}
    const stateCount: Record<string, number> = {}

    rows.forEach(row => {
      if (row.shipping_state_id) {
        const stateId = String(row.shipping_state_id)
        stateCount[stateId] = (stateCount[stateId] || 0) + 1
      }
      if (row.shipping_city_id) {
        const cityId = String(row.shipping_city_id)
        cityCount[cityId] = (cityCount[cityId] || 0) + 1
      }
    })

    const transformedStateCount: Record<string, number> = {}
    const transformedCityCount: Record<string, number> = {}

    Object.entries(stateCount).forEach(([id, count]) => {
      transformedStateCount[stateIdToNameMap[id] ?? id] = count
    })

    Object.entries(cityCount).forEach(([id, count]) => {
      transformedCityCount[cityIdToNameMap[id] ?? id] = count
    })

    // Define your merging groups for cities
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

    const mergedCityCounts: Record<string, number> = {}

    Object.entries(mergeGroups).forEach(([newName, groupCities]) => {
      let groupTotal = 0
      groupCities.forEach(cityName => {
        if (transformedCityCount[cityName]) {
          groupTotal += transformedCityCount[cityName]
          delete transformedCityCount[cityName] // Remove the city from original counts to avoid double counting
        }
      })
      mergedCityCounts[newName] = groupTotal
    })

    const finalCityCounts = { ...transformedCityCount, ...mergedCityCounts }

    // Sort both state and city counts
    const sortedStateCounts = Object.entries(transformedStateCount)
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {})

    const sortedCityCounts = Object.entries(finalCityCounts)
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {})

    res.status(200).json([sortedStateCounts, sortedCityCounts])
  } catch (error) {
    console.error('Database query failed:', error)
    res.status(500).send('Internal Server Error')
  }
}
