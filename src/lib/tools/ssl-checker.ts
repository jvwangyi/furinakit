import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';
import { connect } from 'tls';

const inputSchema = z.object({
  hostname: z.string().min(1),
  port: z.number().int().min(1).max(65535).default(443),
});

const tool: Tool = {
  name: 'ssl-checker',
  description: 'Check SSL/TLS certificate details for a domain',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { hostname, port } = inputSchema.parse(input);

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ text: JSON.stringify({ error: `Connection to ${hostname}:${port} timed out` }) });
      }, 10000);

      try {
        const socket = connect(port, hostname, { rejectUnauthorized: false, servername: hostname }, () => {
          const cert = socket.getPeerCertificate();
          if (!cert || Object.keys(cert).length === 0) {
            clearTimeout(timeout);
            socket.destroy();
            resolve({ text: JSON.stringify({ error: 'No certificate received' }) });
            return;
          }

          const now = new Date();
          const validFrom = cert.valid_from ? new Date(cert.valid_from) : null;
          const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
          const daysRemaining = validTo ? Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

          const result = {
            hostname,
            port,
            subject: cert.subject ? {
              CN: cert.subject.CN,
              O: cert.subject.O,
              C: cert.subject.C,
            } : null,
            issuer: cert.issuer ? {
              CN: cert.issuer.CN,
              O: cert.issuer.O,
            } : null,
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            daysRemaining,
            serialNumber: cert.serialNumber,
            fingerprint: cert.fingerprint,
            protocol: socket.getProtocol(),
            authorized: socket.authorized,
            authorizationError: socket.authorizationError,
            status: daysRemaining !== null
              ? daysRemaining < 0 ? 'expired' : daysRemaining < 30 ? 'expiring-soon' : 'valid'
              : 'unknown',
          };

          clearTimeout(timeout);
          socket.destroy();
          resolve({ text: JSON.stringify(result, null, 2) });
        });

        socket.on('error', (err: Error) => {
          clearTimeout(timeout);
          resolve({ text: JSON.stringify({ error: err.message || 'SSL connection failed' }) });
        });
      } catch (err: any) {
        clearTimeout(timeout);
        resolve({ text: JSON.stringify({ error: err.message || 'SSL check failed' }) });
      }
    });
  },
};

register(tool);
export default tool;
