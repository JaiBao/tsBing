import express, { Request, Response, Router } from "express";
import {createTime,readTime,editTime, readTimeAllday,deleteTime} from '../controllers/OrderController'
const router: Router = express.Router();

router.post("/create", async (req: Request, res: Response) => {
  await createTime(req, res);
});

router.post("/find", async (req: Request, res: Response) => {
  await readTime(req, res);
});
router.post("/findday", async (req: Request, res: Response) => {
  await readTimeAllday(req, res);
});
router.post("/edit/:id", async (req: Request, res: Response) => {
  await editTime(req, res);
});
router.delete("/delete/:id", async (req: Request, res: Response) => {
  await deleteTime(req, res);
});


export default router;
