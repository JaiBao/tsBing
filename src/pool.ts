import mysql from 'mysql2/promise';
import dotenv from "dotenv";
import mongoose from 'mongoose';

console.log(process.env.NODE_ENV)
const envFile = `.env.${process.env.NODE_ENV}`;
dotenv.config({ path: envFile });
export const pool = mysql.createPool({
  host: process.env.HOST,
  user: process.env.ID,
  database: process.env.DB,
  password: process.env.PW,
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 100,
});

mongoose.connect(process.env.mongo_uri!)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));