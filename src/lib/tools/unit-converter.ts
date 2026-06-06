import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const UNITS = {
  length: {
    mm: { name: 'Millimeter', factor: 0.001 },
    cm: { name: 'Centimeter', factor: 0.01 },
    m: { name: 'Meter', factor: 1 },
    km: { name: 'Kilometer', factor: 1000 },
    in: { name: 'Inch', factor: 0.0254 },
    ft: { name: 'Foot', factor: 0.3048 },
    yd: { name: 'Yard', factor: 0.9144 },
    mi: { name: 'Mile', factor: 1609.344 },
  },
  weight: {
    mg: { name: 'Milligram', factor: 0.000001 },
    g: { name: 'Gram', factor: 0.001 },
    kg: { name: 'Kilogram', factor: 1 },
    t: { name: 'Metric Ton', factor: 1000 },
    oz: { name: 'Ounce', factor: 0.0283495 },
    lb: { name: 'Pound', factor: 0.453592 },
  },
  temperature: {
    celsius: 'Celsius',
    fahrenheit: 'Fahrenheit',
    kelvin: 'Kelvin',
  },
  area: {
    mm2: { name: 'Square Millimeter', factor: 0.000001 },
    cm2: { name: 'Square Centimeter', factor: 0.0001 },
    m2: { name: 'Square Meter', factor: 1 },
    km2: { name: 'Square Kilometer', factor: 1000000 },
    ha: { name: 'Hectare', factor: 10000 },
    acre: { name: 'Acre', factor: 4046.86 },
    ft2: { name: 'Square Foot', factor: 0.092903 },
  },
  volume: {
    ml: { name: 'Milliliter', factor: 0.001 },
    l: { name: 'Liter', factor: 1 },
    m3: { name: 'Cubic Meter', factor: 1000 },
    gal: { name: 'Gallon (US)', factor: 3.78541 },
    qt: { name: 'Quart (US)', factor: 0.946353 },
    pt: { name: 'Pint (US)', factor: 0.473176 },
    cup: { name: 'Cup (US)', factor: 0.236588 },
  },
  speed: {
    'm/s': { name: 'Meters per Second', factor: 1 },
    'km/h': { name: 'Kilometers per Hour', factor: 0.277778 },
    'mph': { name: 'Miles per Hour', factor: 0.44704 },
    'knot': { name: 'Knots', factor: 0.514444 },
    'ft/s': { name: 'Feet per Second', factor: 0.3048 },
  },
};

const inputSchema = z.object({
  value: z.number(),
  fromUnit: z.string(),
  toUnit: z.string(),
  category: z.enum(['length', 'weight', 'temperature', 'area', 'volume', 'speed']),
});

// Temperature needs special handling
function convertTemperature(value: number, from: string, to: string): number {
  // Convert to Celsius first
  let celsius: number;
  switch (from) {
    case 'celsius': celsius = value; break;
    case 'fahrenheit': celsius = (value - 32) * 5/9; break;
    case 'kelvin': celsius = value - 273.15; break;
    default: throw new Error(`Unknown temperature unit: ${from}`);
  }
  // Convert from Celsius to target
  switch (to) {
    case 'celsius': return celsius;
    case 'fahrenheit': return celsius * 9/5 + 32;
    case 'kelvin': return celsius + 273.15;
    default: throw new Error(`Unknown temperature unit: ${to}`);
  }
}

const tool: Tool = {
  name: 'unit-converter',
  description: 'Convert between different units of measurement',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { value, fromUnit, toUnit, category } = inputSchema.parse(input);

    let result: number;

    if (category === 'temperature') {
      result = convertTemperature(value, fromUnit, toUnit);
    } else {
      const units = UNITS[category];
      const from = units[fromUnit as keyof typeof units];
      const to = units[toUnit as keyof typeof units];
      if (!from || !to) {
        return { text: JSON.stringify({ error: 'Invalid unit for this category' }) };
      }
      // Convert via base unit
      const baseValue = value * (from as { factor: number }).factor;
      result = baseValue / (to as { factor: number }).factor;
    }

    return {
      text: JSON.stringify({
        value,
        fromUnit,
        toUnit,
        category,
        result: Math.round(result * 1000000) / 1000000, // 6 decimal places
      }, null, 2),
    };
  },
};

register(tool);
export default tool;
