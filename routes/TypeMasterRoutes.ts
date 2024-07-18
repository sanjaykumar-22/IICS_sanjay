import { Router } from "express";
import {
  createTypeMaster,
  updateTypeMasterHandler,
  selectMaster,
} from "../controller/typeMasterController";

const router = Router();

router
  .route("/v0/type")
  .post(createTypeMaster)
  .put(updateTypeMasterHandler)
  .get(selectMaster);

export default router;
