import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import {
  selectUser,
  updateUser,
  deleteUser,
  insertData,
} from "../../../models/IICSAA/userMaster";

export const getUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId;
      const result = await selectUser(userId);
      res.status(200).json({ status: true, data: result });
    } catch (error: any) {
      console.error("Error fetching user:", error);
      next({ status: 500, message: "Internal server error" });
    }
  }
);

export const createUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        userId,
        name,
        email,
        mobileNumber,
        sex,
        maritalStatus,
        address,
        aadharNo,
      } = req.body;
      const entryUser = userId; // Assuming user ID is used as entry user
      const entryDate = new Date(); // Assuming current date/time as entry date

      const result = await insertData({
        IICSAAK_USER_ID: userId,
        IICSAAK_USER_NAME: name,
        IICSAAK_USER_EMAIL: email,
        IICSAAK_PRIM_MOBILE_NO: mobileNumber,
        IICSAAK_SEX: sex,
        IICSAAK_ENTRY_USER: entryUser,
        IICSAAK_ENTRY_DATE: entryDate,
        IICSAAK_MARITAL_STATUS: maritalStatus,
        IICSAAK_ADDRESS: address,
        IICSAAK_AADHAR_NO: aadharNo,
      });

      res.status(201).json(result);
    } catch (error: any) {
      console.error("Error creating user:", error.message);
      next({ status: 400, message: error.message });
    }
  }
);

export const updateUserDetails = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        userId,
        name,
        email,
        mobileNumber,
        sex,
        maritalStatus,
        address,
        aadharNo,
      } = req.body;
      const entryUser = userId; // Assuming user ID is used as entry user
      const entryDate = new Date();

      const result = await updateUser({
        IICSAAK_USER_ID: userId,
        IICSAAK_USER_NAME: name,
        IICSAAK_USER_EMAIL: email,
        IICSAAK_PRIM_MOBILE_NO: mobileNumber,
        IICSAAK_SEX: sex,
        IICSAAK_ENTRY_USER: entryUser,
        IICSAAK_ENTRY_DATE: entryDate,
        IICSAAK_MARITAL_STATUS: maritalStatus,
        IICSAAK_ADDRESS: address,
        IICSAAK_AADHAR_NO: aadharNo,
      });

      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error updating user:", error.message);
      next({ status: 400, message: error.message });
    }
  }
);

export const deleteUserDetails = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId as string;
      const result = await deleteUser(userId);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error deleting user:", error.message);
      next({ status: 500, message: "Internal server error" });
    }
  }
);
