import { describe, it, expect } from 'vitest';
import tool from '@/lib/tools/svg-optimize';

describe('svg-optimize', () => {
  it('should remove comments', async () => {
    const result = await tool.execute({
      svg: '<svg><!-- comment --><circle r="10"/></svg>',
      options: { removeComments: true },
    });
    const data = JSON.parse(result.text!);
    expect(data.result).not.toContain('<!--');
    expect(data.result).toContain('<circle');
  });

  it('should remove metadata', async () => {
    const result = await tool.execute({
      svg: '<svg><metadata><rdf>RDF</rdf></metadata><rect/></svg>',
      options: { removeMetadata: true },
    });
    const data = JSON.parse(result.text!);
    expect(data.result).not.toContain('metadata');
    expect(data.result).toContain('<rect');
  });

  it('should round decimal numbers', async () => {
    const result = await tool.execute({
      svg: '<svg><circle cx="10.123456" cy="20.987654" r="5.111111"/></svg>',
      options: { decimalPrecision: 2 },
    });
    const data = JSON.parse(result.text!);
    expect(data.result).toContain('10.12');
    expect(data.result).toContain('20.99');
    expect(data.result).toContain('5.11');
  });

  it('should report size savings', async () => {
    const result = await tool.execute({
      svg: '<svg>  <!-- big comment -->  <circle r="10"/>  </svg>',
    });
    const data = JSON.parse(result.text!);
    expect(data.stats.original).toBeGreaterThan(data.stats.optimized);
    expect(data.stats.savings).toBeDefined();
  });
});
