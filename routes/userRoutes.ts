import { Router } from "express";
import {
  getUser,
  createUser,
  updateUserDetails,
  deleteUserDetails,
} from "../controller/userController";

const router = Router();

router.route("/v0/user").post(createUser).put(updateUserDetails);

router.route("/v0/user/:userId").get(getUser).delete(deleteUserDetails);

export default router;
