import axios from "axios";
import { Request, Response } from "express";
import dotenv from "dotenv";
// import multer from 'multer'
import timestamp from "../models/timestamp";
import timelimit from "../models/timelimit";

console.log(process.env.NODE_ENV);
const envFile = `.env.${process.env.NODE_ENV}`;
dotenv.config({ path: envFile });

export const sentOrder = async (req: Request, res: Response) => {
  console.log(req.body);
  const order = req.body;
  try {
    const { data } = await axios.post(`${process.env.apiOrder}sale/order/save`, order);
    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

export const sentMember = async (req: Request, res: Response) => {
  console.log(req.body);
  const { tel } = req.body;
  try {
    const { data } = await axios.get(`${process.env.apiOrder}member/member?filter_phone=${tel}`);
    res.status(200).json(data.data);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

export const createTime = async (req: Request, res: Response) => {
  try {
    const result = await timestamp.create({
      date: req.body.date,
      time: req.body.time,
      amount: req.body.amount,
      order_id: req.body.order_id,
      road: req.body.road,
      remark: req.body.remark,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(200).json({ success: true, data: error });
  }
};

export const readTime = async (req: Request, res: Response) => {
  try {
    const result = await timestamp.find({
      date: req.body.date,
      time: req.body.time,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, data: error });
  }
};
export const readTimeAllday = async (req: Request, res: Response) => {
  try {
    const result = await timestamp.find({
      date: req.body.date,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, data: error });
  }
};

export const editTime = async (req: Request, res: Response) => {
  try {
    const result = await timestamp.findByIdAndUpdate(req.params.id, { date: req.body.date, time: req.body.time, amount: req.body.amount, order_id: req.body.order_id, road: req.body.road, remark: req.body.remark }, { new: true });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: true, data: error });
  }
};
export const deleteTime = async (req: Request, res: Response) => {
  try {
    const result = await timestamp.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: true, data: error });
  }
};

export const createTimeLimit = async (req: Request, res: Response) => {
  const find = await timelimit.findOne({
    date: req.body.date,
    time: req.body.time,
  });
  console.log(find)
  if (find) {
    res.status(401).json({ success: false, data: "已存在" });
  } else {
    try {
      const result = await timelimit.create({
        date: req.body.date,
        time: req.body.time,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: true, data: error });
    }
  }
};

export const deleteTimeLimit = async (req: Request, res: Response) => {
  try {
    const result = await timelimit.findOneAndDelete({date: req.body.date, time: req.body.time});
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: true, data: error });
  }
}

export const getTimeLimit = async (req: Request, res: Response) => {
  try {
    const result = await timelimit.find({date: req.body.date});
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: true, data: error });
  }
}