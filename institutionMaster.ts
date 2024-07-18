import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import {
  functionInsert,
  functionUpdate,
  functionSelect,
} from "../../utils/commonFunction"; // Adjust the path as per your project structure
import ip from "ip";
import os from "os";

// Interface for InstitutionMaster data
export interface InstitutionMaster {
  IICSAAA_INST_CODE?: string;
  IICSAAA_INST_NAME: string;
  IICSAAA_INST_SNAME: string;
  IICSAAA_INST_STARTED_DATE?: string | Date | null;
  IICSAAA_INST_DESCRIPTION: string;
  IICSAAA_INST_TYPE_CODE: string;
  IICSAAA_GROUP_CODE: string;
  IICSAAA_SUB_GROUP_CODE: string;
  IICSAAA_LOGO_CODE: string;
  IICSAAA_INST_PROFILE: string;
  IICSAAA_INST_ADDRESS: string;
  IICSAAA_INST_PAN: string;
  IICSAAA_INST_TAN: string;
  IICSAAA_INST_GST: string;
  IICSAAA_INST_MOBILE: number;
  IICSAAA_INST_EMAIL: string;
  IICSAAA_INST_GST_EMAIL: string;
  IICSAAA_INST_GST_NAME: string;
  IICSAAA_INST_LICENSE_NUMBER: string;
  IICSAAA_INST_LICENSE_DATE?: string | Date | null;
  IICSAAA_INST_ORDER: number;
  IICSAAA_FROM_DATE?: string | Date | null;
  IICSAAA_TO_DATE?: string | Date | null;
  IICSAAA_ENTRY_USER: string;
  IICSAAA_MODIFY_USER: string;
  IICSAAA_ENTRY_DATE?: string | Date;
  IICSAAA_MODIFY_DATE?: string | Date;
  IICSAAA_HOST_NAME: string;
  IICSAAA_IP_ADDRESS: string;
}

// Function to insert a new InstitutionMaster record
export const createInstitutionMaster = asyncHandler(
  async (req: Request, res: Response) => {
    const institutionData: InstitutionMaster = req.body;
    console.log("Received institution data:", institutionData);

    // Check for mandatory fields
    const mandatoryFields = [
      "IICSAAA_INST_NAME",
      "IICSAAA_INST_SNAME",
      "IICSAAA_INST_DESCRIPTION",
      "IICSAAA_INST_TYPE_CODE",
      "IICSAAA_GROUP_CODE",
      "IICSAAA_SUB_GROUP_CODE",
      "IICSAAA_LOGO_CODE",
      "IICSAAA_INST_PROFILE",
      "IICSAAA_INST_ADDRESS",
      "IICSAAA_INST_PAN",
      "IICSAAA_INST_TAN",
      "IICSAAA_INST_GST",
      "IICSAAA_INST_MOBILE",
      "IICSAAA_INST_EMAIL",
      "IICSAAA_INST_GST_EMAIL",
      "IICSAAA_INST_GST_NAME",
      "IICSAAA_INST_LICENSE_NUMBER",
      "IICSAAA_INST_LICENSE_DATE",
    ];

    for (const field of mandatoryFields) {
      if (!(field in institutionData)) {
        throw new Error(`Missing mandatory field: ${field}`);
      }
    }

    institutionData.IICSAAA_INST_STARTED_DATE =
      institutionData.IICSAAA_INST_STARTED_DATE || new Date();

    if (
      institutionData.IICSAAA_FROM_DATE === undefined ||
      institutionData.IICSAAA_FROM_DATE === null
    ) {
      if (
        institutionData.IICSAAA_TO_DATE !== undefined &&
        institutionData.IICSAAA_TO_DATE !== null
      ) {
        throw new Error("Without from date, the to date cannot be entered.");
      }
    }

    // Generate or validate IICSAAA_INST_CODE if not provided
    institutionData.IICSAAA_INST_CODE =
      institutionData.IICSAAA_INST_CODE || (await generateInstCode());

    const formattedData = formatDataForDatabase(institutionData);
    console.log("Formatted data:", formattedData);

    // Prepare SQL query for insertion
    const sql = `INSERT INTO IICSAAA_INSTITUTION_MASTER (${formattedData.columns}) VALUES (${formattedData.values})`;
    // console.log("Insert SQL:", sql);
    // console.log("Insert values:", formattedData.valueArray);

    // Execute insertion query
    const result = await functionInsert(sql, formattedData.valueArray);
    console.log("Insert result:", result);
    res.status(201).json(result);
  }
);

// Function to update an existing InstitutionMaster record
export const updateInstitution = asyncHandler(
  async (req: Request, res: Response) => {
    const institutionData: InstitutionMaster = req.body;

    // Check for mandatory fields
    if (!institutionData.IICSAAA_INST_CODE) {
      throw new Error(
        "Missing mandatory field: IICSAAA_INST_CODE is required for update."
      );
    }

    // Format dates to Oracle's expected format and get current system details
    const formattedData = formatDataForUpdate(institutionData);

    // Prepare SQL query for update
    const sql = `UPDATE IICSAAA_INSTITUTION_MASTER SET ${formattedData.setClause} WHERE IICSAAA_INST_CODE = :IICSAAA_INST_CODE`;

    // Execute update query
    const result = await functionUpdate(sql, formattedData.valueArray);
    res.status(200).json(result);
  }
);

// Function to fetch an InstitutionMaster record by IICSAAA_INST_CODE
export const selectInstitution = async (
  req: Request,
  res: Response
): Promise<void> => {
  const instCode = req.query.instCode as string; // Retrieve instCode from query parameters

  // Check if instCode is provided
  if (!instCode) {
    res.status(400).json({ message: "Parameter instCode is required" });
    return;
  }

  try {
    // Prepare SQL query for selection
    const sql = `
      SELECT
        IICSAAA_INST_CODE,
        IICSAAA_INST_NAME AS "Name",  -- Alias IICSAAA_INST_NAME as "Name"
        IICSAAA_INST_SNAME as ShortName,
        IICSAAA_INST_STARTED_DATE as startdate,
        IICSAAA_INST_DESCRIPTION,
        IICSAAA_INST_TYPE_CODE,
        IICSAAA_GROUP_CODE,
        IICSAAA_SUB_GROUP_CODE,
        IICSAAA_LOGO_CODE,
        IICSAAA_INST_PROFILE,
        IICSAAA_INST_ADDRESS,
        IICSAAA_INST_PAN,
        IICSAAA_INST_TAN,
        IICSAAA_INST_GST,
        IICSAAA_INST_MOBILE,
        IICSAAA_INST_EMAIL,
        IICSAAA_INST_GST_EMAIL,
        IICSAAA_INST_GST_NAME,
        IICSAAA_INST_LICENSE_NUMBER,
        IICSAAA_INST_LICENSE_DATE,
        IICSAAA_INST_ORDER,
        IICSAAA_FROM_DATE,
        IICSAAA_TO_DATE,
        IICSAAA_ENTRY_USER,
        IICSAAA_MODIFY_USER,
        IICSAAA_ENTRY_DATE,
        IICSAAA_MODIFY_DATE,
        IICSAAA_HOST_NAME,
        IICSAAA_IP_ADDRESS
      FROM IICSAAA_INSTITUTION_MASTER
      WHERE IICSAAA_INST_CODE = :instCode AND (IICSAAA_TO_DATE IS NULL OR TO_DATE(IICSAAA_TO_DATE, 'YYYY-MM-DD') >= TRUNC(SYSDATE))
    `;
    const binds = [instCode]; // Bind values directly as an array

    // Execute selection query
    const result = await functionSelect(sql, binds);

    if (result && result.length > 0) {
      const row = result[0]; // Assuming only one result is expected based on instCode uniqueness

      // Map database row to InstitutionMaster interface
      const institution: InstitutionMaster = {
        IICSAAA_INST_CODE: row.IICSAAA_INST_CODE,
        IICSAAA_INST_NAME: row.IICSAAA_NAME,
        IICSAAA_INST_SNAME: row.IICSAAA_INST_SNAME,
        IICSAAA_INST_STARTED_DATE: row.IICSAAA_INST_STARTED_DATE,
        IICSAAA_INST_DESCRIPTION: row.IICSAAA_INST_DESCRIPTION,
        IICSAAA_INST_TYPE_CODE: row.IICSAAA_INST_TYPE_CODE,
        IICSAAA_GROUP_CODE: row.IICSAAA_GROUP_CODE,
        IICSAAA_SUB_GROUP_CODE: row.IICSAAA_SUB_GROUP_CODE,
        IICSAAA_LOGO_CODE: row.IICSAAA_LOGO_CODE,
        IICSAAA_INST_PROFILE: row.IICSAAA_INST_PROFILE,
        IICSAAA_INST_ADDRESS: row.IICSAAA_INST_ADDRESS,
        IICSAAA_INST_PAN: row.IICSAAA_INST_PAN,
        IICSAAA_INST_TAN: row.IICSAAA_INST_TAN,
        IICSAAA_INST_GST: row.IICSAAA_INST_GST,
        IICSAAA_INST_MOBILE: row.IICSAAA_INST_MOBILE,
        IICSAAA_INST_EMAIL: row.IICSAAA_INST_EMAIL,
        IICSAAA_INST_GST_EMAIL: row.IICSAAA_INST_GST_EMAIL,
        IICSAAA_INST_GST_NAME: row.IICSAAA_INST_GST_NAME,
        IICSAAA_INST_LICENSE_NUMBER: row.IICSAAA_INST_LICENSE_NUMBER,
        IICSAAA_INST_LICENSE_DATE: row.IICSAAA_INST_LICENSE_DATE,
        IICSAAA_INST_ORDER: row.IICSAAA_INST_ORDER,
        IICSAAA_FROM_DATE: row.IICSAAA_FROM_DATE,
        IICSAAA_TO_DATE: row.IICSAAA_TO_DATE,
        IICSAAA_ENTRY_USER: row.IICSAAA_ENTRY_USER,
        IICSAAA_MODIFY_USER: row.IICSAAA_MODIFY_USER,
        IICSAAA_ENTRY_DATE: row.IICSAAA_ENTRY_DATE,
        IICSAAA_MODIFY_DATE: row.IICSAAA_MODIFY_DATE,
        IICSAAA_HOST_NAME: row.IICSAAA_HOST_NAME,
        IICSAAA_IP_ADDRESS: row.IICSAAA_IP_ADDRESS,
      };

      res.status(200).json(institution); // Send institution data as JSON response
    } else {
      res
        .status(404)
        .json({ message: `Institution with code ${instCode} not found` });
    }
  } catch (error) {
    console.error("Error fetching institution:", error);
    res.status(500).json({ message: "Failed to fetch institution" });
  }
};

// Function to generate unique IICSAAA_INST_CODE
const generateInstCode = async (): Promise<string> => {
  try {
    console.log("Generating institution code...");
    const sql = "SELECT IICSAAA_AUTOGEN.IICSAAA_INST_CODE FROM DUAL";
    console.log("Executing SQL:", sql);
    const result = await functionSelect(sql, []);
    console.log("SQL result:", result);

    if (result && result.length > 0) {
      let nextVal = result[0].IICSAAA_INST_CODE;
      let instCode: string;

      if (nextVal.startsWith("IN")) {
        // If the returned value already starts with 'IN', use it as is
        instCode = nextVal;
      } else {
        // Otherwise, add the 'IN' prefix and pad to 6 characters
        instCode = `IN${String(nextVal).padStart(4, "0")}`;
      }

      console.log("Generated institution code:", instCode);

      if (instCode.length !== 6) {
        throw new Error(
          `Generated institution code '${instCode}' does not meet the length requirement of 6 characters`
        );
      }

      return instCode;
    } else {
      throw new Error(
        "Failed to generate institution code: No result returned from database"
      );
    }
  } catch (error) {
    console.error("Error generating institution code:", error);
    throw error;
  }
};

// Helper function to format data for database insertion
const formatDataForDatabase = (data: InstitutionMaster) => {
  const formattedData: any = {
    ...data,
    IICSAAA_INST_STARTED_DATE: formatDate(data.IICSAAA_INST_STARTED_DATE),
    IICSAAA_INST_LICENSE_DATE: formatDate(data.IICSAAA_INST_LICENSE_DATE),
    IICSAAA_FROM_DATE: formatDate(data.IICSAAA_FROM_DATE),
    IICSAAA_TO_DATE: formatDate(data.IICSAAA_TO_DATE),
    IICSAAA_ENTRY_DATE: formatDate(data.IICSAAA_ENTRY_DATE || new Date()),
    IICSAAA_HOST_NAME: getCurrentHostName(),
    IICSAAA_IP_ADDRESS: ip.address(),
  };

  const columns = Object.keys(formattedData).join(", ");
  const values = Object.keys(formattedData)
    .map((key) => {
      return key.endsWith("_DATE")
        ? `TO_DATE(:${key}, 'YYYY-MM-DD')`
        : `:${key}`;
    })
    .join(", ");
  const valueArray = Object.values(formattedData);

  return { columns, values, valueArray };
};

// Helper function to format data for update
const formatDataForUpdate = (data: InstitutionMaster) => {
  const formattedData: any = {
    ...data,
    IICSAAA_INST_STARTED_DATE: formatDate(data.IICSAAA_INST_STARTED_DATE),
    IICSAAA_INST_LICENSE_DATE: formatDate(data.IICSAAA_INST_LICENSE_DATE),
    IICSAAA_FROM_DATE: formatDate(data.IICSAAA_FROM_DATE),
    IICSAAA_TO_DATE: formatDate(data.IICSAAA_TO_DATE),
    IICSAAA_MODIFY_DATE: formatDate(new Date()),
    IICSAAA_HOST_NAME: getCurrentHostName(),
    IICSAAA_IP_ADDRESS: ip.address(),
  };

  const setClause = Object.keys(formattedData)
    .filter((key) => key !== "IICSAAA_ENTRY_DATE")
    .map((key) => {
      return key.endsWith("_DATE")
        ? `${key} = TO_DATE(:${key}, 'YYYY-MM-DD')`
        : `${key} = :${key}`;
    })
    .join(", ");
  const valueArray = Object.values(formattedData);

  return { setClause, valueArray };
};

// Helper function to format dates to Oracle's expected format
const formatDate = (date: string | Date | null | undefined): string | null => {
  if (!date) return null;
  const formattedDate = new Date(date).toISOString().split("T")[0];
  return formattedDate;
};

// Helper function to get the current system's hostname
const getCurrentHostName = (): string => {
  return os.hostname();
};
