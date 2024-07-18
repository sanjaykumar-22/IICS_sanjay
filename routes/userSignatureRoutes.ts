import { Router } from "express";
import {
  createSignature,
  updateSignature,
} from "../controller/userSignatureController";
import { updateUserDetails } from "../controller/userController";
const router = Router();

router.route("/v2/signature").get(updateSignature).post(createSignature);
// .put(updateUserDetails)
// .delete(deleteSignature);

export default router;
