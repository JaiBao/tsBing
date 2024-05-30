import express, { Request, Response, Router } from "express";
import {sentOrder,sentMember} from '../controllers/OrderController'
import multer from 'multer';
const upload = multer();
const router: Router = express.Router();


router.post("/create", upload.any(),async (req: Request, res: Response) => {
  await sentOrder(req, res);
});
router.post("/member",async (req: Request, res: Response) => {
  await sentMember(req, res);
});


export default router;
