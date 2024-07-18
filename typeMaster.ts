// Import necessary modules and dependencies
import {
  functionInsert,
  functionUpdate,
  functionSelect,
} from "../../../src/utils/commonFunction";
import ip from "ip";
import os from "os";

// Interface for TypeMaster data
export interface TypeMaster {
  IICSAAC_TYPE_CODE?: string;
  IICSAAC_TYPE_NAME: string;
  IICSAAC_TYPE_CATG: string;
  IICSAAC_TYPE_ORDER: number;
  IICSAAC_FROM_DATE?: string | Date | null;
  IICSAAC_TO_DATE?: string | Date | null;
  IICSAAC_ENTRY_USER: string;
  IICSAAC_MODIFY_USER: string;
  IICSAAC_ENTRY_DATE?: string | Date;
  IICSAAC_MODIFY_DATE?: string | Date;
  IICSAAC_HOST_NAME: string;
  IICSAAC_IP_ADDRESS: string;
}

// Function to insert a new TypeMaster record
export const insertTypeMaster = async (data: TypeMaster): Promise<any> => {
  try {
    // Check for mandatory fields
    if (!data.IICSAAC_TYPE_NAME || !data.IICSAAC_TYPE_CATG) {
      throw new Error(
        "Missing mandatory fields: IICSAAC_TYPE_NAME, IICSAAC_TYPE_CATG"
      );
    }

    // CHECK  THE TYPE IICSAAC_TYPE_NAME

    if (!isValidType(data.IICSAAC_TYPE_NAME)) {
      throw new Error(
        "Invalid value for IICSAAC_TYPE_NAME. Allowed values are 'School', 'College', or 'Industry'."
      );
    }

    // CHECK  THE TYPE CATEGORY
    if (!isValidTypeCatg(data.IICSAAC_TYPE_CATG)) {
      throw new Error(
        "Invalid value for IICSAAC_TYPE_CATG. Allowed values are 'Dept', 'Insit', or 'Org'."
      );
    }

    if (
      data.IICSAAC_FROM_DATE === undefined ||
      data.IICSAAC_FROM_DATE === null
    ) {
      if (data.IICSAAC_TO_DATE !== undefined && data.IICSAAC_TO_DATE !== null) {
        throw new Error("Without from date, the to date cannot be entered.");
      }
    }

    // Generate or validate IICSAAC_TYPE_CODE within 5 characters if not provided
    data.IICSAAC_TYPE_CODE = data.IICSAAC_TYPE_CODE || generateTypeCode();

    const formattedData = formatDataForDatabase(data);

    // Prepare SQL query for insertion
    const sql = `INSERT INTO IICSAAC_TYPE_MASTER (${formattedData.columns}) VALUES (${formattedData.values})`;

    // Execute insertion query
    const result = await functionInsert(sql, formattedData.valueArray);
    return result;
  } catch (error) {
    // Handle the error
    handleError(error);
    return undefined; // Ensure we always return a value
  }
};

// Function to update an existing TypeMaster record
export const updateTypeMaster = async (data: TypeMaster): Promise<any> => {
  try {
    // Check for mandatory fields directly
    // if (!data.IICSAAC_TYPE_CODE || !data.IICSAAC_TYPE_CATG) {
    //   throw new Error(
    //     "Missing mandatory fields: IICSAAC_TYPE_CODE and IICSAAC_TYPE_CATG are required."
    //   );

    if (!data.IICSAAC_FROM_DATE) {
      data.IICSAAC_FROM_DATE = null; // or any default value appropriate for your application
    }
    if (!data.IICSAAC_TO_DATE) {
      data.IICSAAC_TO_DATE = null; // or any default value appropriate for your application
    }

    // Format dates to Oracle's expected format and get current system details
    const formattedData = formatDataForUpdate(data);

    // Prepare SQL query for update
    const sql = `UPDATE IICSAAC_TYPE_MASTER SET ${formattedData.setClause} WHERE IICSAAC_TYPE_CODE = :IICSAAC_TYPE_CODE`;

    // Execute update query
    const result = await functionUpdate(sql, formattedData.valueArray);
    return result;
  } catch (error) {
    // Handle the error
    handleError(error);
    return undefined; // Ensure we always return a value
  }
};

// Function to fetch a TypeMaster record by IICSAAC_TYPE_CODE
export const selectTypeMaster = async (
  typeCode: string
): Promise<TypeMaster | null> => {
  try {
    const sql = `
        SELECT *
        FROM IICSAAC_TYPE_MASTER
        WHERE IICSAAC_TYPE_CODE = :typeCode
          AND (IICSAAC_TO_DATE IS NULL OR TO_DATE(IICSAAC_TO_DATE, 'YYYY-MM-DD') >= TRUNC(SYSDATE))
      `;
    const binds = [typeCode];
    const result = await functionSelect(sql, binds);

    if (result.length > 0) {
      const row = result[0];

      // Return the row directly as TypeMaster
      return {
        IICSAAC_TYPE_CODE: row.IICSAAC_TYPE_CODE,
        IICSAAC_TYPE_NAME: row.IICSAAC_TYPE_NAME,
        IICSAAC_TYPE_CATG: row.IICSAAC_TYPE_CATG,
        IICSAAC_TYPE_ORDER: row.IICSAAC_TYPE_ORDER,
        IICSAAC_FROM_DATE: row.IICSAAC_FROM_DATE,
        IICSAAC_TO_DATE: row.IICSAAC_TO_DATE,
        IICSAAC_ENTRY_USER: row.IICSAAC_ENTRY_USER,
        IICSAAC_MODIFY_USER: row.IICSAAC_MODIFY_USER,
        IICSAAC_ENTRY_DATE: row.IICSAAC_ENTRY_DATE,
        IICSAAC_MODIFY_DATE: row.IICSAAC_MODIFY_DATE,
        IICSAAC_HOST_NAME: row.IICSAAC_HOST_NAME,
        IICSAAC_IP_ADDRESS: row.IICSAAC_IP_ADDRESS,
      };
    } else {
      console.warn(`User ${typeCode} not found or is no longer valid.`);
      return null; // Return null if no TypeMaster found or is not valid
    }
  } catch (error) {
    // Handle the error
    handleError(error);
    return null; // Ensure we always return a value
  }
};

// Helper function to handle errors
const handleError = (error: unknown): void => {
  if (error instanceof Error) {
    console.error("Error:", error.message);

    // Check for ORA-00001 unique constraint violation
    if (error.message.includes("ORA-00001")) {
      throw new Error(
        "Unique constraint violation: The type code already exists."
      );
    }

    throw new Error(error.message);
  } else {
    console.error("An unknown error occurred.");
    throw new Error("An unknown error occurred.");
  }
};

// Function to validate IICSAAC_TYPE_NAME

const isValidType = (type: string): boolean => {
  const allowedTypes = ["School", "College", "Industry"];
  return allowedTypes.includes(type);
};
// Function to validate IICSAAC_TYPE_CATG

const isValidTypeCatg = (catg: string): boolean => {
  const allowedCatgs = ["Dept", "Insit", "Org"];
  return allowedCatgs.includes(catg);
};

// Function to generate unique IICSAAC_TYPE_CODE
let lastGeneratedTypeCodeNumber = 1;
const generateTypeCode = (): string => {
  const typeCode = `T${padNumber(lastGeneratedTypeCodeNumber++, 3)}`;
  return typeCode;
};

// Helper function to pad number with leading zeros
const padNumber = (num: number, size: number): string => {
  let numStr = num.toString();
  while (numStr.length < size) numStr = "0" + numStr;
  return numStr;
};

// Function to format dates to Oracle's expected format
const formatDate = (date: Date | string | undefined): string | undefined => {
  if (!date) return undefined;
  const parsedDate = new Date(date);
  return parsedDate.toISOString().slice(0, 10);
};

// Function to format data for database insertion
const formatDataForDatabase = (data: TypeMaster) => {
  const formattedData: any = {
    ...data,
    // IICSAAC_FROM_DATE: formatDate(data.IICSAAC_FROM_DATE),
    // IICSAAC_TO_DATE: formatDate(data.IICSAAC_TO_DATE),
    IICSAAC_ENTRY_DATE: formatDate(data.IICSAAC_ENTRY_DATE || new Date()),
    IICSAAC_HOST_NAME: getCurrentHostName(),
    IICSAAC_IP_ADDRESS: ip.address(),
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

// Function to format data for update
const formatDataForUpdate = (data: TypeMaster) => {
  const formattedData: any = {
    ...data,
    // IICSAAC_FROM_DATE: formatDate(data.IICSAAC_FROM_DATE),
    // IICSAAC_TO_DATE: formatDate(data.IICSAAC_TO_DATE),
    IICSAAC_MODIFY_DATE: formatDate(new Date()),
    IICSAAC_HOST_NAME: getCurrentHostName(),
    IICSAAC_IP_ADDRESS: ip.address(),
  };

  const setClause = Object.keys(formattedData)
    .filter((key) => key !== "IICSAAC_ENTRY_DATE")
    .map((key) => {
      return key.endsWith("_DATE")
        ? `${key} = TO_DATE(:${key}, 'YYYY-MM-DD')`
        : `${key} = :${key}`;
    })
    .join(", ");

  const valueArray = Object.values(formattedData);

  return { setClause, valueArray };
};

// Function to get current system hostname
const getCurrentHostName = (): string => {
  return os.hostname();
};
