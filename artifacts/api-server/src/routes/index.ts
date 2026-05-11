import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sendOtpRouter from "./send-otp";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sendOtpRouter);

export default router;
