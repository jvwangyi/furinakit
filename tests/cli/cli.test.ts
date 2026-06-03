import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

const CLI_PATH = path.join(__dirname, '../../cli/index.ts');
const TIMEOUT = 30000;

describe('CLI Commands', () => {
  describe('General', () => {
    it('should show help', async () => {
      const { stdout } = await execAsync(`npx tsx ${CLI_PATH} --help`, { timeout: TIMEOUT });
      expect(stdout).toContain('FurinaKit');
      expect(stdout).toContain('text');
      expect(stdout).toContain('pdf');
      expect(stdout).toContain('image');
      expect(stdout).toContain('list');
    }, TIMEOUT);

    it('should show version', async () => {
      const { stdout } = await execAsync(`npx tsx ${CLI_PATH} --version`, { timeout: TIMEOUT });
      expect(stdout).toContain('0.1.0');
    }, TIMEOUT);

    it('should list all tools', async () => {
      const { stdout } = await execAsync(`npx tsx ${CLI_PATH} list`, { timeout: TIMEOUT });
      expect(stdout).toContain('json-format');
      expect(stdout).toContain('hash');
      expect(stdout).toContain('pdf-merge');
      expect(stdout).toContain('image-compress');
    }, TIMEOUT);
  });

  describe('Text Commands', () => {
    it('should show text help', async () => {
      const { stdout } = await execAsync(`npx tsx ${CLI_PATH} text --help`, { timeout: TIMEOUT });
      expect(stdout).toContain('json-format');
      expect(stdout).toContain('hash');
      expect(stdout).toContain('base64');
      expect(stdout).toContain('url-encode');
      expect(stdout).toContain('diff');
    }, TIMEOUT);

    it('should format JSON from text argument', async () => {
      const { stdout } = await execAsync(
        `npx tsx ${CLI_PATH} text hash -t '{"name":"test","value":123}' -a sha256`,
        { timeout: TIMEOUT }
      );
      expect(stdout).toMatch(/[a-f0-9]{64}/);
    }, TIMEOUT);

    it('should show json-format help', async () => {
      const { stdout } = await execAsync(
        `npx tsx ${CLI_PATH} text json-format --help`,
        { timeout: TIMEOUT }
      );
      expect(stdout).toContain('Format JSON');
      expect(stdout).toContain('indent');
      expect(stdout).toContain('sort-keys');
    }, TIMEOUT);

    it('should generate SHA-256 hash', async () => {
      const { stdout } = await execAsync(
        `npx tsx ${CLI_PATH} text hash -t "Hello World"`,
        { timeout: TIMEOUT }
      );
      expect(stdout).toMatch(/[a-f0-9]{64}/);
    }, TIMEOUT);

    it('should generate MD5 hash', async () => {
      const { stdout } = await execAsync(
        `npx tsx ${CLI_PATH} text hash -t "Hello World" -a md5`,
        { timeout: TIMEOUT }
      );
      expect(stdout).toMatch(/[a-f0-9]{32}/);
    }, TIMEOUT);

    it('should encode base64', async () => {
      const { stdout } = await execAsync(
        `npx tsx ${CLI_PATH} text base64 "Hello World" -e`,
        { timeout: TIMEOUT }
      );
      expect(stdout).toContain('SGVsbG8gV29ybGQ=');
    }, TIMEOUT);

    it('should decode base64', async () => {
      const { stdout } = await execAsync(
        `npx tsx ${CLI_PATH} text base64 "SGVsbG8gV29ybGQ=" -d`,
        { timeout: TIMEOUT }
      );
      expect(stdout).toContain('Hello World');
    }, TIMEOUT);

    it('should URL encode', async () => {
      const { stdout } = await execAsync(
        `npx tsx ${CLI_PATH} text url-encode "Hello World"`,
        { timeout: TIMEOUT }
      );
      expect(stdout).toContain('Hello%20World');
    }, TIMEOUT);

    it('should URL decode', async () => {
      const { stdout } = await execAsync(
        `npx tsx ${CLI_PATH} text url-encode "Hello%20World" -d`,
        { timeout: TIMEOUT }
      );
      expect(stdout).toContain('Hello World');
    }, TIMEOUT);
  });

  describe('Error Handling', () => {
    it('should show error for unknown command', async () => {
      try {
        await execAsync(`npx tsx ${CLI_PATH} unknown`, { timeout: TIMEOUT });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.stderr || error.stdout).toContain('unknown command');
      }
    }, TIMEOUT);

    it('should show error when hash has no input', async () => {
      try {
        await execAsync(`npx tsx ${CLI_PATH} text hash`, { timeout: TIMEOUT });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.stderr || error.stdout).toContain('required');
      }
    }, TIMEOUT);
  });
});
