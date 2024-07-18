// controllers/typeMaster.controller.ts

import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import {
  insertTypeMaster,
  updateTypeMaster,
  TypeMaster,
  selectTypeMaster,
} from "../../../models/IICSAA/typeMaster";

// Handler for inserting a new type master
export const createTypeMaster = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const typeMasterData: TypeMaster = req.body; // Assuming type master data is passed in the request body

      // Call insertTypeMaster function to insert the type master
      const result = await insertTypeMaster(typeMasterData);

      // Respond with success message and inserted data
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      console.error("Error creating type master:", error);
      next({ status: 400, message: error.message }); // Pass error to Express error handler
    }
  }
);

export const updateTypeMasterHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const typeMasterData: TypeMaster = req.body; // Assuming type master data is passed in the request body

      // Call updateTypeMaster function to update the type master
      const result = await updateTypeMaster(typeMasterData);

      // Respond with success message and update    d data
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error("Error updating type master:", error);
      next({ status: 400, message: error.message }); // Pass error to Express error handler
    }
  }
);

// Handler for selecting a type master by code
export const selectMaster = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { typeCode } = req.query as { typeCode: string };

    try {
      if (!typeCode) {
        res
          .status(400)
          .json({ success: false, message: "Missing user parameter" });
        return;
      }

      const typeMaster = await selectTypeMaster(typeCode);

      if (typeMaster) {
        res.status(200).json({ success: true, data: typeMaster });
      } else {
        res.status(404).json({
          success: false,
          message: `user ${typeCode} not found`,
        });
      }
    } catch (error: any) {
      console.error("Error in selectMaster:", error);
      next({ status: 500, message: "Internal server error" });
    }
  }
);
