import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tutorRouter from "./tutor/index";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/tutor", tutorRouter);

export default router;
