import { z } from 'zod';
import * as XLSX from 'xlsx';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  sheetIndex: z.number().int().min(0).default(0),
  delimiter: z.string().default(','),
});

const tool: Tool = {
  name: 'excel-to-csv',
  description: 'Convert Excel (.xlsx) file to CSV format',
  category: 'convert',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, sheetIndex, delimiter } = inputSchema.parse(input);

    try {
      const workbook = XLSX.read(file, { type: 'buffer' });

      if (workbook.SheetNames.length === 0) {
        throw new ToolError(ErrorCode.INVALID_INPUT, 'Excel file has no sheets');
      }

      if (sheetIndex >= workbook.SheetNames.length) {
        throw new ToolError(
          ErrorCode.INVALID_INPUT,
          `Sheet index ${sheetIndex} out of range (total: ${workbook.SheetNames.length})`
        );
      }

      const sheetName = workbook.SheetNames[sheetIndex];
      const sheet = workbook.Sheets[sheetName];

      const csv = XLSX.utils.sheet_to_csv(sheet, { FS: delimiter });

      return { text: csv };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to convert Excel to CSV: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
