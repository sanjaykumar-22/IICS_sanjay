import { Router } from "express";
import {
  createOrganizationMaster,
  updateOrganization,
  selectOrganization,
} from "../../../models/IICSAA/organMaster";

const router = Router();

router
  .route("/v0/user")
  .post(createOrganizationMaster)
  .put(updateOrganization)
  .get(selectOrganization);

export default router;
