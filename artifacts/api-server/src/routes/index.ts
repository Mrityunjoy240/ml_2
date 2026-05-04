import { Router } from "express";
import healthRouter from "./health.js";
import tutorRouter from "./tutor/index.js";

const router = Router();

router.use(healthRouter);
router.use("/tutor", tutorRouter);

export default router;
