import { Router } from "express";
import {
  createInstitutionMaster,
  updateInstitution,
  selectInstitution,
} from "../../../models/IICSAA/institutionMaster";

const router = Router();

router
  .route("/v0/inst")
  .post(createInstitutionMaster) // Endpoint for creating a new InstitutionMaster
  .put(updateInstitution) // Endpoint for updating an existing InstitutionMaster
  .get(selectInstitution);
export default router;
