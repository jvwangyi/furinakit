import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync, writeFileSync } from 'fs';
import { getTool } from '../../src/lib/registry';

export function registerPdfCommands(program: Command) {
  const pdf = program.command('pdf').description('PDF tools');
  
  pdf
    .command('merge')
    .description('Merge multiple PDF files')
    .argument('<output>', 'Output file path')
    .argument('<files...>', 'PDF files to merge')
    .action(async (output: string, files: string[]) => {
      const spinner = ora('Merging PDFs...').start();
      
      try {
        const tool = getTool('pdf-merge');
        if (!tool) throw new Error('Tool not found');
        
        const buffers = files.map(f => readFileSync(f));
        const result = await tool.execute({ files: buffers });
        
        if (result.data) {
          writeFileSync(output, result.data as Buffer);
          spinner.succeed(chalk.green(`Merged ${files.length} PDFs → ${output}`));
        }
      } catch (error) {
        spinner.fail(chalk.red((error as Error).message));
        process.exit(1);
      }
    });
  
  pdf
    .command('split')
    .description('Split PDF into pages')
    .argument('<input>', 'Input PDF file')
    .argument('<output>', 'Output PDF file')
    .option('-p, --pages <pages>', 'Pages to extract (comma-separated)')
    .action(async (input: string, output: string, options: { pages?: string }) => {
      const spinner = ora('Splitting PDF...').start();
      
      try {
        const tool = getTool('pdf-split');
        if (!tool) throw new Error('Tool not found');
        
        const file = readFileSync(input);
        const pages = options.pages 
          ? options.pages.split(',').map(s => parseInt(s.trim()))
          : undefined;
        
        const result = await tool.execute({ file, pages });
        
        if (result.data) {
          writeFileSync(output, result.data as Buffer);
          spinner.succeed(chalk.green(`Split PDF → ${output}`));
        }
      } catch (error) {
        spinner.fail(chalk.red((error as Error).message));
        process.exit(1);
      }
    });
}
