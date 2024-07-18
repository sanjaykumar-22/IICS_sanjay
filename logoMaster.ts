// Import necessary modules and dependencies
// Import necessary modules and dependencies
import {
  functionInsert,
  functionUpdate,
  functionSelect,
} from "../../utils/commonFunction";
import ip from "ip";
import os from "os";

// Interface for LogoMaster data
export interface LogoMaster {
  IICSAAD_LOGO_CODE?: string;
  IICSAAD_ORGN_CODE: string;
  IICSAAD_LOGO_NAME: string;
  IICSAAD_LOGO: Buffer; // Assuming you'll handle BLOB as Buffer
  IICSAAD_FROM_DATE?: string | Date | null;
  IICSAAD_TO_DATE?: string | Date | null;
  IICSAAD_ENTRY_USER: string;
  IICSAAD_MODIFY_USER: string;
  IICSAAD_ENTRY_DATE?: string | Date;
  IICSAAD_MODIFY_DATE?: string | Date;
  IICSAAD_HOST_NAME: string;
  IICSAAD_IP_ADDRESS: string;
}

// Function to insert a new LogoMaster record
export const insertLogoMaster = async (data: LogoMaster): Promise<any> => {
  try {
    // Check for mandatory fields
    if (!data.IICSAAD_ORGN_CODE || !data.IICSAAD_LOGO_NAME) {
      throw new Error(
        "Missing mandatory fields: IICSAAD_ORGN_CODE, IICSAAD_LOGO_NAME, IICSAAD_LOGO"
      );
    }
    if (
      data.IICSAAD_FROM_DATE === undefined ||
      data.IICSAAD_FROM_DATE === null
    ) {
      if (data.IICSAAD_TO_DATE !== undefined && data.IICSAAD_TO_DATE !== null) {
        throw new Error("Without from date, the to date cannot be entered.");
      }
    }

    // Generate or validate IICSAAD_LOGO_CODE within 5 characters if not provided
    data.IICSAAD_LOGO_CODE = data.IICSAAD_LOGO_CODE || generateLogoCode();

    const formattedData = formatDataForDatabase(data);

    // Prepare SQL query for insertion
    const sql = `INSERT INTO IICSAAD_ORGN_LOGO_MASTER (${formattedData.columns}) VALUES (${formattedData.values})`;

    // Execute insertion query
    const result = await functionInsert(sql, formattedData.valueArray);
    return result;
  } catch (error) {
    // Handle the error
    handleError(error);
    return undefined; // Ensure we always return a value
  }
};

// Function to update an existing LogoMaster record
export const updateLogoMaster = async (data: LogoMaster): Promise<any> => {
  try {
    // Check for mandatory fields
    if (!data.IICSAAD_LOGO_CODE) {
      throw new Error(
        "Missing mandatory field: IICSAAD_LOGO_CODE is required for update."
      );
    }

    // Format dates to Oracle's expected format and get current system details
    const formattedData = formatDataForUpdate(data);

    // Prepare SQL query for update
    const sql = `UPDATE IICSAAD_ORGN_LOGO_MASTER SET ${formattedData.setClause} WHERE IICSAAD_LOGO_CODE = :IICSAAD_LOGO_CODE`;

    // Execute update query
    const result = await functionUpdate(sql, formattedData.valueArray);
    return result;
  } catch (error) {
    // Handle the error
    handleError(error);
    return undefined; // Ensure we always return a value
  }
};

// Function to fetch a LogoMaster record by IICSAAD_LOGO_CODE
export const selectLogoMaster = async (
  logoCode: string
): Promise<LogoMaster | null> => {
  try {
    const sql = `
          SELECT *
          FROM IICSAAD_ORGN_LOGO_MASTER
          WHERE IICSAAD_LOGO_CODE = :logoCode
            AND (IICSAAD_TO_DATE IS NULL OR TO_DATE(IICSAAD_TO_DATE, 'YYYY-MM-DD') >= TRUNC(SYSDATE))
        `;
    const binds = [logoCode];
    const result = await functionSelect(sql, binds);

    if (result.length > 0) {
      const row = result[0];

      // Return the row directly as LogoMaster
      return {
        IICSAAD_LOGO_CODE: row.IICSAAD_LOGO_CODE,
        IICSAAD_ORGN_CODE: row.IICSAAD_ORGN_CODE,
        IICSAAD_LOGO_NAME: row.IICSAAD_LOGO_NAME,
        IICSAAD_LOGO: row.IICSAAD_LOGO, // Assuming you handle BLOB retrieval
        IICSAAD_FROM_DATE: row.IICSAAD_FROM_DATE,
        IICSAAD_TO_DATE: row.IICSAAD_TO_DATE,
        IICSAAD_ENTRY_USER: row.IICSAAD_ENTRY_USER,
        IICSAAD_MODIFY_USER: row.IICSAAD_MODIFY_USER,
        IICSAAD_ENTRY_DATE: row.IICSAAD_ENTRY_DATE,
        IICSAAD_MODIFY_DATE: row.IICSAAD_MODIFY_DATE,
        IICSAAD_HOST_NAME: row.IICSAAD_HOST_NAME,
        IICSAAD_IP_ADDRESS: row.IICSAAD_IP_ADDRESS,
      };
    } else {
      console.warn(`Logo ${logoCode} not found or is no longer valid.`);
      return null; // Return null if no LogoMaster found or is not valid
    }
  } catch (error) {
    // Handle the error
    handleError(error);
    return null; // Ensure we always return a value
  }
};

// Function to generate unique IICSAAD_LOGO_CODE
let lastGeneratedLogoCodeNumber = 1;
const generateLogoCode = (): string => {
  const logoCode = `LC${padNumber(lastGeneratedLogoCodeNumber++, 3)}`;
  return logoCode;
};

// Helper function to format data for database insertion
const formatDataForDatabase = (data: LogoMaster) => {
  const formattedData: any = {
    ...data,
    IICSAAD_ENTRY_DATE: formatDate(data.IICSAAD_ENTRY_DATE || new Date()),
    IICSAAD_HOST_NAME: getCurrentHostName(),
    IICSAAD_IP_ADDRESS: ip.address(),
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
const formatDataForUpdate = (data: LogoMaster) => {
  const formattedData: any = {
    ...data,
    IICSAAD_MODIFY_DATE: formatDate(new Date()),
    IICSAAD_HOST_NAME: getCurrentHostName(),
    IICSAAD_IP_ADDRESS: ip.address(),
  };

  const setClause = Object.keys(formattedData)
    .filter((key) => key !== "IICSAAD_ENTRY_DATE")
    .map((key) => {
      return key.endsWith("_DATE")
        ? `${key} = TO_DATE(:${key}, 'YYYY-MM-DD')`
        : `${key} = :${key}`;
    })
    .join(", ");

  const valueArray = Object.values(formattedData);

  return { setClause, valueArray };
};

// Helper function to handle errors
const handleError = (error: unknown): void => {
  if (error instanceof Error) {
    console.error("Error:", error.message);

    // Check for ORA-00001 unique constraint violation
    if (error.message.includes("ORA-00001")) {
      throw new Error(
        "Unique constraint violation: The logo code already exists."
      );
    }

    throw new Error(error.message);
  } else {
    console.error("An unknown error occurred.");
    throw new Error("An unknown error occurred.");
  }
};

// Function to get current system hostname
const getCurrentHostName = (): string => {
  return os.hostname();
};

// Function to format dates to Oracle's expected format
const formatDate = (date: Date | string | undefined): string | undefined => {
  if (!date) return undefined;
  const parsedDate = new Date(date);
  return parsedDate.toISOString().slice(0, 10);
};

// Helper function to pad number with leading zeros
const padNumber = (num: number, size: number): string => {
  let numStr = num.toString();
  while (numStr.length < size) numStr = "0" + numStr;
  return numStr;
};
