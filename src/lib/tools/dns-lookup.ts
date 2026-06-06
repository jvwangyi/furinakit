import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';
import { resolve4, resolve6, resolveMx, resolveNs, resolveTxt, resolveCname, resolveSoa } from 'dns/promises';

const inputSchema = z.object({
  domain: z.string().min(1),
  recordType: z.enum(['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'ALL']).default('ALL'),
});

const tool: Tool = {
  name: 'dns-lookup',
  description: 'Perform DNS lookups for domain names',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { domain, recordType } = inputSchema.parse(input);

    try {
      const results: Record<string, any> = {};

      if (recordType === 'A' || recordType === 'ALL') {
        try { results.A = await resolve4(domain); } catch { results.A = []; }
      }
      if (recordType === 'AAAA' || recordType === 'ALL') {
        try { results.AAAA = await resolve6(domain); } catch { results.AAAA = []; }
      }
      if (recordType === 'MX' || recordType === 'ALL') {
        try { results.MX = await resolveMx(domain); } catch { results.MX = []; }
      }
      if (recordType === 'NS' || recordType === 'ALL') {
        try { results.NS = await resolveNs(domain); } catch { results.NS = []; }
      }
      if (recordType === 'TXT' || recordType === 'ALL') {
        try { results.TXT = await resolveTxt(domain); } catch { results.TXT = []; }
      }
      if (recordType === 'CNAME' || recordType === 'ALL') {
        try { results.CNAME = await resolveCname(domain); } catch { results.CNAME = []; }
      }
      if (recordType === 'SOA' || recordType === 'ALL') {
        try { results.SOA = await resolveSoa(domain); } catch { results.SOA = null; }
      }

      return { text: JSON.stringify({ domain, recordType, records: results }, null, 2) };
    } catch (err: any) {
      return { text: JSON.stringify({ error: err.message || 'DNS lookup failed' }) };
    }
  },
};

register(tool);
export default tool;
