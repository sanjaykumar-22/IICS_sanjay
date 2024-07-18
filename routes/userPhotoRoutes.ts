import { Router } from "express";
import {
  getUser,
  createUser,
  updateUserDetails,
  deleteImageController,
} from "../controller/userPhotoController";
const router = Router();

router
  .route("/v2/user")
  .get(getUser)
  .post(createUser)
  .put(updateUserDetails)
  .delete(deleteImageController);

export default router;
