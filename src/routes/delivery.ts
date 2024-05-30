import express, { Request, Response, Router } from "express";
import { createDelivery,updateDelivery ,createDeliveryman,updateDeliveryman,deleteDeliveryman,
fetchDelivery,fetchDeliveryman,
fetchDeliveryDate} from "../controllers/deliveryControllers";
import { pool } from "../pool";
const router: Router = express.Router();
//訂單外送

router.post("/create", async (req: Request, res: Response) => {
  await createDelivery(req, res, pool);
});

router.patch("/update", async (req: Request, res: Response) => {
  await updateDelivery(req, res, pool);
})
//外送員
router.post('/addman' , async (req: Request, res: Response) => {
  await createDeliveryman(req, res, pool);
})

router.patch('/updateman' , async (req: Request, res: Response) => {
  await updateDeliveryman(req, res, pool);
})

router.post('/deleteman' , async (req: Request, res: Response) => {
  await deleteDeliveryman(req, res, pool);
})
// fetch
router.get("/id/:id",async (req: Request, res: Response) => {
  await fetchDelivery(req, res, pool);
})
router.post("/date",async (req: Request, res: Response) => {
  await fetchDeliveryDate(req, res, pool);
})
router.get("/man",async (req: Request, res: Response) => {
  await fetchDeliveryman(req, res, pool);
})

export default router;
