import { Request, Response } from "express";
import mysql, { RowDataPacket, FieldPacket } from "mysql2/promise";

interface OrderOption {
  order_id: number;
  value: string;
  quantity: string;
  delivery_date: Date; 
}
type DateValueQuantityMap = { [date: string]: { [key: string]: number } };
type OverallValueQuantityMap = { [key: string]: number };
export const Fetch = async (req: Request, res: Response, pool: mysql.Pool) => {
  const query = `
  SELECT o.delivery_date, opo.order_id, opo.value, opo.quantity
  FROM order_product_options AS opo
  JOIN orders AS o ON opo.order_id = o.id
  WHERE DATE(o.delivery_date) >= ? AND DATE(o.delivery_date) <= ? AND o.status_id != 115;
`;
  let connection;
  try {
    const { startDate, endDate } = req.body;
    connection = await pool.getConnection();
    const [rawResult]: [RowDataPacket[], FieldPacket[]] = await connection.query(query, [startDate, endDate]);
    const result = rawResult as OrderOption[]; // 斷言為OrderOption[]

    const dateValueQuantityMap: DateValueQuantityMap = {};
    const overallValueQuantityMap: OverallValueQuantityMap = {};
  
    result.forEach((item) => {
      const deliveryDate = item.delivery_date.toISOString().split("T")[0] // 將日期轉為 YYYY-MM-DD 格式
      const quantity = parseFloat(item.quantity);
    
    // 更新 dateValueQuantityMap
    if (!dateValueQuantityMap[deliveryDate]) {
      dateValueQuantityMap[deliveryDate] = {};
    }

    if (dateValueQuantityMap[deliveryDate][item.value] !== undefined) {
      dateValueQuantityMap[deliveryDate][item.value] += quantity;
    } else {
      dateValueQuantityMap[deliveryDate][item.value] = quantity;
    }

    // 更新 overallValueQuantityMap
    if (overallValueQuantityMap[item.value] !== undefined) {
      overallValueQuantityMap[item.value] += quantity;
    } else {
      overallValueQuantityMap[item.value] = quantity;
    }
  });
// 將 overallValueQuantityMap 轉換為陣列
const overallValueQuantityArray = Object.entries(overallValueQuantityMap);

// 進行排序，根據每個選項（key）的字數
const sortedOverallValueQuantityArray = overallValueQuantityArray.sort((a, b) => b[0].length - a[0].length);

// 將排序後的陣列轉換回物件
const sortedOverallValueQuantityMap: OverallValueQuantityMap = Object.fromEntries(sortedOverallValueQuantityArray);

  res.status(200).json({
    byDate: dateValueQuantityMap,
    overall: sortedOverallValueQuantityMap
  });
    
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
};
