import { z } from 'zod';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  delimiter: z.string().default(','),
  header: z.boolean().default(true),
  sheetName: z.string().default('Sheet1'),
});

const tool: Tool = {
  name: 'csv-to-excel',
  description: 'Convert CSV file to Excel (.xlsx) format',
  category: 'convert',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, delimiter, header, sheetName } = inputSchema.parse(input);

    try {
      const csvText = file.toString('utf-8');

      const parsed = Papa.parse(csvText, {
        delimiter,
        header,
        skipEmptyLines: true,
        dynamicTyping: true,
      });

      if (parsed.errors.length > 0) {
        const errorMsg = parsed.errors.map(e => e.message).join(', ');
        throw new ToolError(ErrorCode.INVALID_INPUT, `CSV parse errors: ${errorMsg}`);
      }

      const wb = XLSX.utils.book_new();
      let ws: XLSX.WorkSheet;

      if (header) {
        ws = XLSX.utils.json_to_sheet(parsed.data as Record<string, any>[]);
      } else {
        ws = XLSX.utils.aoa_to_sheet(parsed.data as any[][]);
      }

      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return {
        data: Buffer.from(xlsxBuffer),
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: 'converted.xlsx',
      };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to convert CSV to Excel: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
