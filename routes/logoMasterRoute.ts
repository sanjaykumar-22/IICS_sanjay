// routes/logoMasterRoutes.ts

import { Router } from "express";
import {
  createLogoMaster,
  updateLogoMasterHandler,
  selectLogoMasterHandler,
} from "../controller/logoMasterController";

const router = Router();

router
  .route("/v0/logo")
  .post(createLogoMaster) // Endpoint for creating a new LogoMaster
  .put(updateLogoMasterHandler) // Endpoint for updating an existing LogoMaster
  .get(selectLogoMasterHandler); // Endpoint for fetching a LogoMaster by code

export default router;
