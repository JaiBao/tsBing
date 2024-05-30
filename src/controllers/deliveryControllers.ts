import { Request, Response } from "express";
import mysql from "mysql2/promise";

export const createDelivery = async (req: Request, res: Response, pool: mysql.Pool) => {
  const { name, phone, cartype, fee, delivery_id, order_code, date, plate } = req.body;
  const query = `
  INSERT INTO order_delivery (name, phone, cartype, fee, delivery_id, order_code,date,plate)
  VALUES (?, ?, ?, ?, ?, ?,?,?)`;
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(query, [name, phone, cartype, fee, delivery_id, order_code, date, plate]);
    connection.release();
    res.status(200).json({ success: true, message: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" + error });
  }
};
export const updateDelivery = async (req: Request, res: Response, pool: mysql.Pool) => {
  const { delivery_id, name, phone, cartype, fee, order_code, date, plate } = req.body;
  const query = `
  UPDATE order_delivery
  SET delivery_id = ? , name = ?, phone = ?, cartype = ?, fee = ? ,date = ? ,plate= ?
  WHERE order_code = ?`;
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(query, [delivery_id, name, phone, cartype, fee, date, plate, order_code]);
    connection.release();
    res.status(200).json({ success: true, message: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const createDeliveryman = async (req: Request, res: Response, pool: mysql.Pool) => {
  const { name, phone, cartype, plate } = req.body;
  const query = `INSERT INTO delivery (name, phone, cartype,plate) VALUES (?, ?, ?, ?)`;
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(query, [name, phone, cartype, plate]);
    connection.release();
    res.status(200).json({ success: true, message: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" + error });
  }
};
export const updateDeliveryman = async (req: Request, res: Response, pool: mysql.Pool) => {
  const { name, phone, cartype, id, plate } = req.body;
  const query = `UPDATE  delivery SET name = ? , phone= ?, cartype= ?, plate= ?  WHERE id = ?`;
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(query, [name, phone, cartype, plate, id]);
    res.status(200).json({ success: true, message: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" + error });
  }
};

export const deleteDeliveryman = async (req: Request, res: Response, pool: mysql.Pool) => {
  const { id } = req.body;
  const query = `DELETE FROM delivery WHERE id = ?`;
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(query, [id]);
    connection.release();

    res.status(200).json({ success: true, message: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const fetchDelivery = async (req: Request, res: Response, pool: mysql.Pool) => {
  const { id } = req.params;
  const query = `SELECT * FROM order_delivery WHERE order_code = ?`;
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(query, [id]);
    connection.release();

    res.status(200).json({ success: true, message: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const fetchDeliveryDate = async (req: Request, res: Response, pool: mysql.Pool) => {
  const { date } = req.body;
  const query = `SELECT * FROM order_delivery WHERE date = ?`;
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(query, [date]);
    connection.release();

    res.status(200).json({ success: true, message: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const fetchDeliveryman = async (req: Request, res: Response, pool: mysql.Pool) => {
  const query = `SELECT * FROM delivery`;
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(query);
    connection.release();

    res.status(200).json({ success: true, message: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
