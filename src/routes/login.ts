import express, { Request, Response, Router } from "express";
import * as auth from "../middleware/auth";
import { register,login,logout,extend ,findAll,editUser,deleteUser} from "../controllers/LoginControllers";
const router: Router = express.Router();

router.post("/register", async (req: Request, res: Response) => {
  await register(req, res);
});
router.post("/login",auth.login,login)
router.delete("/logout",auth.jwt,logout)
router.post("/extend", auth.jwt,extend)
router.get('/find',auth.jwt,async (req: Request, res: Response) => {
  await findAll(req, res);
})
router.post('/edit',auth.jwt,async (req: Request, res: Response) => {
  await editUser(req, res);
})

router.delete("/delete/:id",auth.jwt,async (req: Request, res: Response) => {
  await deleteUser(req, res);
})
export default router;