// import { Request, Response, NextFunction } from "express";
// import asyncHandler from "express-async-handler";
// import {
//   insertInstitutionMaster,
//   updateInstitutionMaster,
//   selectInstitutionMaster,
// } from "../../../models/IICSAA/institutionMaster"; // Adjust the import path as needed

// // Handler for inserting a new institution master record
// export const createInstitutionMaster = asyncHandler(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const institutionData = req.body; // Assuming institution data is passed in the request body

//       // Call insertInstitutionMaster function to insert the institution master record
//       const result = await insertInstitutionMaster(institutionData);

//       // Respond with success message and inserted data
//       res.status(201).json({ success: true, data: result });
//     } catch (error: any) {
//       console.error("Error creating institution master:", error);
//       next({ status: 400, message: error.message }); // Pass error to Express error handler
//     }
//   }
// );

// // Handler for updating an existing institution master record
// export const updateInstitutionMasterHandler = asyncHandler(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const institutionData = req.body; // Assuming institution data is passed in the request body

//       // Call updateInstitutionMaster function to update the institution master record
//       const result = await updateInstitutionMaster(institutionData);

//       // Respond with success message and updated data
//       res.status(200).json({ success: true, data: result });
//     } catch (error: any) {
//       console.error("Error updating institution master:", error);
//       next({ status: 400, message: error.message }); // Pass error to Express error handler
//     }
//   }
// );

// // Handler for selecting an institution master record by institution code
// export const selectInstitutionMasterHandler = asyncHandler(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const instCode = req.params.instCode; // Assuming instCode is passed as a route parameter

//     try {
//       const institution = await selectInstitutionMaster(instCode);

//       if (institution) {
//         res.status(200).json({ success: true, data: institution });
//       } else {
//         res.status(404).json({
//           success: false,
//           message: `Institution with code ${instCode} not found`,
//         });
//       }
//     } catch (error: any) {
//       console.error("Error in selectInstitutionMasterHandler:", error);
//       next({ status: 500, message: "Internal server error" });
//     }
//   }
// );
