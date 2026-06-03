import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync } from 'fs';
import { getTool } from '../../src/lib/registry';

export function registerTextCommands(program: Command) {
  const text = program.command('text').description('Text tools');
  
  text
    .command('json-format')
    .description('Format JSON')
    .argument('[file]', 'JSON file (or stdin)')
    .option('-i, --indent <indent>', 'Indentation', '2')
    .option('-s, --sort-keys', 'Sort keys')
    .action(async (file: string | undefined, options: { indent: string; sortKeys?: boolean }) => {
      const spinner = ora('Formatting JSON...').start();
      
      try {
        const tool = getTool('json-format');
        if (!tool) throw new Error('Tool not found');
        
        let inputText: string;
        if (file) {
          inputText = readFileSync(file, 'utf-8');
        } else {
          // Read from stdin
          inputText = '';
          process.stdin.setEncoding('utf-8');
          for await (const chunk of process.stdin) {
            inputText += chunk;
          }
        }
        
        const result = await tool.execute({
          text: inputText,
          indent: parseInt(options.indent),
          sortKeys: options.sortKeys,
        });
        
        if (result.text) {
          spinner.stop();
          console.log(result.text);
        }
      } catch (error) {
        spinner.fail(chalk.red((error as Error).message));
        process.exit(1);
      }
    });
  
  text
    .command('hash')
    .description('Generate hash')
    .argument('[file]', 'File to hash')
    .option('-a, --algorithm <algo>', 'Algorithm (md5, sha1, sha256, sha384, sha512)', 'sha256')
    .option('-t, --text <text>', 'Text to hash')
    .action(async (file: string | undefined, options: { algorithm: string; text?: string }) => {
      const spinner = ora('Generating hash...').start();
      
      try {
        const tool = getTool('hash');
        if (!tool) throw new Error('Tool not found');
        
        const input: any = { algorithm: options.algorithm };
        
        if (file) {
          input.file = readFileSync(file);
        } else if (options.text) {
          input.text = options.text;
        } else {
          throw new Error('Either file or --text is required');
        }
        
        const result = await tool.execute(input);
        
        spinner.stop();
        if (result.text) {
          console.log(result.text);
        }
      } catch (error) {
        spinner.fail(chalk.red((error as Error).message));
        process.exit(1);
      }
    });
  
  text
    .command('base64')
    .description('Base64 encode/decode')
    .argument('[input]', 'Input text or file')
    .option('-e, --encode', 'Encode')
    .option('-d, --decode', 'Decode')
    .option('-f, --file', 'Treat input as file path')
    .action(async (input: string | undefined, options: { encode?: boolean; decode?: boolean; file?: boolean }) => {
      const spinner = ora('Processing...').start();
      
      try {
        const tool = getTool('base64');
        if (!tool) throw new Error('Tool not found');
        
        const action = options.decode ? 'decode' : 'encode';
        
        const toolInput: any = { action };
        
        if (input) {
          if (options.file) {
            toolInput.file = readFileSync(input);
          } else {
            toolInput.text = input;
          }
        } else {
          // Read from stdin
          let stdinText = '';
          process.stdin.setEncoding('utf-8');
          for await (const chunk of process.stdin) {
            stdinText += chunk;
          }
          toolInput.text = stdinText.trim();
        }
        
        const result = await tool.execute(toolInput);
        
        spinner.stop();
        if (result.text) {
          console.log(result.text);
        }
      } catch (error) {
        spinner.fail(chalk.red((error as Error).message));
        process.exit(1);
      }
    });
  
  text
    .command('url-encode')
    .description('URL encode/decode')
    .argument('<text>', 'Text to process')
    .option('-e, --encode', 'Encode')
    .option('-d, --decode', 'Decode')
    .option('--full', 'Full URL mode')
    .action(async (text: string, options: { encode?: boolean; decode?: boolean; full?: boolean }) => {
      const spinner = ora('Processing...').start();
      
      try {
        const tool = getTool('url-encode');
        if (!tool) throw new Error('Tool not found');
        
        const result = await tool.execute({
          text,
          action: options.decode ? 'decode' : 'encode',
          component: options.full ? 'full' : 'component',
        });
        
        spinner.stop();
        if (result.text) {
          console.log(result.text);
        }
      } catch (error) {
        spinner.fail(chalk.red((error as Error).message));
        process.exit(1);
      }
    });
  
  text
    .command('diff')
    .description('Compare two texts')
    .argument('<file1>', 'First file')
    .argument('<file2>', 'Second file')
    .option('-m, --mode <mode>', 'Diff mode (lines, words, chars)', 'lines')
    .action(async (file1: string, file2: string, options: { mode: string }) => {
      const spinner = ora('Comparing texts...').start();
      
      try {
        const tool = getTool('text-diff');
        if (!tool) throw new Error('Tool not found');
        
        const oldText = readFileSync(file1, 'utf-8');
        const newText = readFileSync(file2, 'utf-8');
        
        const result = await tool.execute({
          oldText,
          newText,
          mode: options.mode,
        });
        
        spinner.stop();
        if (result.text) {
          console.log(result.text);
        }
      } catch (error) {
        spinner.fail(chalk.red((error as Error).message));
        process.exit(1);
      }
    });
}
