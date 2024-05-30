import { Request, Response } from "express";
import mysql from "mysql2/promise";

type newCustomer = {
  mobile: number;
  personal_name: string;
  cnt: number;
};

export const getNewCustomer = async (req: Request, res: Response, pool: mysql.Pool) => {
  const { startDate,endDate } = req.body;
  const selectdate = `${startDate}-01 00:00:00`;
  const selectdate2 = `${endDate}-31 23:59:59`;
  const query = `
  SELECT u.mobile, o.personal_name, COUNT(*) as cnt
  FROM orders o
  JOIN users u ON o.personal_name = u.name
  WHERE MONTH(o.order_date) = MONTH(?)
    AND YEAR(o.order_date) = YEAR(?)
    AND u.created_at > ? 
    AND u.created_at < ?
  GROUP BY u.id;
`;
  try {
    const connection = await pool.getConnection();
    const [results] = await connection.query(query, [selectdate,selectdate,selectdate,selectdate2]);
    connection.release();

    if (Array.isArray(results)) {
      const rows = results as newCustomer[];
      const result = rows.reduce((acc: { [key: string]: number }, row: newCustomer) => {
        acc[row.personal_name] = row.mobile;
        return acc;
      }, {});
      res.status(200).send(result);
    } else {
      res.status(500).send('Unexpected query result');
    }
  } catch (error) {
    res.status(500).send(error);
  }
};