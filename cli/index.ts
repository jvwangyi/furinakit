#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { registerPdfCommands } from './commands/pdf';
import { registerImageCommands } from './commands/image';
import { registerTextCommands } from './commands/text';

// Import tools to register them
import '../src/lib/tools';

const program = new Command();

program
  .name('furinakit')
  .description('FurinaKit - 108 实用工具')
  .version('0.1.0');

// Register command groups
registerPdfCommands(program);
registerImageCommands(program);
registerTextCommands(program);

// List all tools
program
  .command('list')
  .description('List all available tools')
  .action(() => {
    const { getAllTools } = require('../src/lib/registry');
    const tools = getAllTools();
    
    console.log(chalk.bold('\n📦 FurinaKit Tools\n'));
    
    const categories = new Map<string, typeof tools>();
    tools.forEach((tool: any) => {
      if (!categories.has(tool.category)) {
        categories.set(tool.category, []);
      }
      categories.get(tool.category)!.push(tool);
    });
    
    for (const [category, categoryTools] of categories) {
      console.log(chalk.yellow(`\n${category.toUpperCase()}`));
      categoryTools.forEach((tool: any) => {
        console.log(`  ${chalk.green(tool.name)} - ${tool.description}`);
      });
    }
    
    console.log('');
  });

program.parse();
