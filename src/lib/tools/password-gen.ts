import { z } from 'zod';
import { randomBytes } from 'crypto';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  length: z.number().int().min(4).max(128).default(16),
  uppercase: z.boolean().default(true),
  lowercase: z.boolean().default(true),
  numbers: z.boolean().default(true),
  symbols: z.boolean().default(true),
  count: z.number().int().min(1).max(50).default(1),
});

function generatePassword(options: {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}): string {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charset = '';
  const required: string[] = [];

  if (options.uppercase) {
    charset += uppercaseChars;
    required.push(uppercaseChars[Math.floor(randomBytes(1)[0] / 256 * uppercaseChars.length)]);
  }
  if (options.lowercase) {
    charset += lowercaseChars;
    required.push(lowercaseChars[Math.floor(randomBytes(1)[0] / 256 * lowercaseChars.length)]);
  }
  if (options.numbers) {
    charset += numberChars;
    required.push(numberChars[Math.floor(randomBytes(1)[0] / 256 * numberChars.length)]);
  }
  if (options.symbols) {
    charset += symbolChars;
    required.push(symbolChars[Math.floor(randomBytes(1)[0] / 256 * symbolChars.length)]);
  }

  if (charset.length === 0) {
    // Default to lowercase if nothing selected
    charset = lowercaseChars;
  }

  // Generate random password
  const randomBytesArr = randomBytes(options.length);
  let password = '';
  for (let i = 0; i < options.length; i++) {
    password += charset[randomBytesArr[i] % charset.length];
  }

  // Ensure at least one character from each required set
  const passwordArr = password.split('');
  const positions = randomBytes(required.length);
  for (let i = 0; i < required.length; i++) {
    const pos = positions[i] % options.length;
    passwordArr[pos] = required[i];
  }

  return passwordArr.join('');
}

const tool: Tool = {
  name: 'password-gen',
  description: 'Generate secure random passwords',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const options = inputSchema.parse(input);

    const passwords: string[] = [];
    for (let i = 0; i < options.count; i++) {
      passwords.push(generatePassword(options));
    }

    return {
      text: JSON.stringify({
        count: passwords.length,
        passwords,
        options: {
          length: options.length,
          uppercase: options.uppercase,
          lowercase: options.lowercase,
          numbers: options.numbers,
          symbols: options.symbols,
        },
      }, null, 2),
    };
  },
};

register(tool);
export default tool;
