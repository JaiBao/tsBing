import express, { Request, Response, Router } from "express";
import {createTimeLimit,deleteTimeLimit,getTimeLimit} from '../controllers/OrderController'

const router: Router = express.Router();

router.post("/create", async (req: Request, res: Response) => {
  await createTimeLimit(req, res);
});

router.post("/delete", async (req: Request, res: Response) => {
  await deleteTimeLimit(req, res);
});

router.post("/get", async (req: Request, res: Response) =>{
  await getTimeLimit(req, res);
})

export default router;
