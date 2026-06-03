import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync, writeFileSync } from 'fs';
import { getTool } from '../../src/lib/registry';

export function registerImageCommands(program: Command) {
  const image = program.command('image').description('Image tools');
  
  image
    .command('resize')
    .description('Resize an image')
    .argument('<input>', 'Input image file')
    .argument('<output>', 'Output image file')
    .option('-w, --width <width>', 'Target width')
    .option('-h, --height <height>', 'Target height')
    .option('-f, --fit <fit>', 'Fit mode (cover, contain, fill, inside, outside)', 'cover')
    .action(async (input: string, output: string, options: { width?: string; height?: string; fit?: string }) => {
      const spinner = ora('Resizing image...').start();
      
      try {
        const tool = getTool('image-resize');
        if (!tool) throw new Error('Tool not found');
        
        const file = readFileSync(input);
        const result = await tool.execute({
          file,
          width: options.width ? parseInt(options.width) : undefined,
          height: options.height ? parseInt(options.height) : undefined,
          fit: options.fit,
        });
        
        if (result.data) {
          writeFileSync(output, result.data as Buffer);
          spinner.succeed(chalk.green(`Resized image → ${output}`));
        }
      } catch (error) {
        spinner.fail(chalk.red((error as Error).message));
        process.exit(1);
      }
    });
  
  image
    .command('convert')
    .description('Convert image format')
    .argument('<input>', 'Input image file')
    .argument('<output>', 'Output image file')
    .requiredOption('-f, --format <format>', 'Output format (jpeg, png, webp, avif)')
    .option('-q, --quality <quality>', 'Quality (1-100)')
    .action(async (input: string, output: string, options: { format: string; quality?: string }) => {
      const spinner = ora('Converting image...').start();
      
      try {
        const tool = getTool('image-convert');
        if (!tool) throw new Error('Tool not found');
        
        const file = readFileSync(input);
        const result = await tool.execute({
          file,
          format: options.format,
          quality: options.quality ? parseInt(options.quality) : undefined,
        });
        
        if (result.data) {
          writeFileSync(output, result.data as Buffer);
          spinner.succeed(chalk.green(`Converted image → ${output}`));
        }
      } catch (error) {
        spinner.fail(chalk.red((error as Error).message));
        process.exit(1);
      }
    });
  
  image
    .command('crop')
    .description('Crop an image')
    .argument('<input>', 'Input image file')
    .argument('<output>', 'Output image file')
    .requiredOption('--left <left>', 'Left position')
    .requiredOption('--top <top>', 'Top position')
    .requiredOption('--width <width>', 'Crop width')
    .requiredOption('--height <height>', 'Crop height')
    .action(async (input: string, output: string, options: { left: string; top: string; width: string; height: string }) => {
      const spinner = ora('Cropping image...').start();
      
      try {
        const tool = getTool('image-crop');
        if (!tool) throw new Error('Tool not found');
        
        const file = readFileSync(input);
        const result = await tool.execute({
          file,
          left: parseInt(options.left),
          top: parseInt(options.top),
          width: parseInt(options.width),
          height: parseInt(options.height),
        });
        
        if (result.data) {
          writeFileSync(output, result.data as Buffer);
          spinner.succeed(chalk.green(`Cropped image → ${output}`));
        }
      } catch (error) {
        spinner.fail(chalk.red((error as Error).message));
        process.exit(1);
      }
    });
}
