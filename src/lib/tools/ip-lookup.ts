import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  ip: z.string().optional(), // Empty = check own IP
});

const tool: Tool = {
  name: 'ip-lookup',
  description: 'Look up IP address geolocation and network info',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { ip } = inputSchema.parse(input);

    try {
      // If no IP provided, get user's own IP
      let targetIp = ip;
      if (!targetIp) {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json() as { ip: string };
        targetIp = ipData.ip;
      }

      // Get IP info from ip-api.com (free, no key needed)
      const res = await fetch(`http://ip-api.com/json/${targetIp}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query`);
      const data = await res.json() as Record<string, any>;

      if (data.status === 'fail') {
        return { text: JSON.stringify({ error: data.message || 'Lookup failed' }) };
      }

      return {
        text: JSON.stringify({
          ip: data.query,
          country: data.country,
          region: data.regionName,
          city: data.city,
          zip: data.zip,
          latitude: data.lat,
          longitude: data.lon,
          timezone: data.timezone,
          isp: data.isp,
          organization: data.org,
          as: data.as,
          mobile: data.mobile,
          proxy: data.proxy,
          hosting: data.hosting,
        }, null, 2),
      };
    } catch (e) {
      return { text: JSON.stringify({ error: `IP lookup failed: ${(e as Error).message}` }) };
    }
  },
};

register(tool);
export default tool;
