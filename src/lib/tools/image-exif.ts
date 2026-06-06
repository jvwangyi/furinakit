import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';
import exifr from 'exifr';

const inputSchema = z.object({
  file: z.string(), // base64 encoded image data
  mimeType: z.string().default('image/jpeg'),
  section: z.enum(['all', 'basic', 'camera', 'gps', 'thumbnail']).default('all'),
});

const tool: Tool = {
  name: 'image-exif',
  description: 'View and extract EXIF metadata from images',
  category: 'image',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, mimeType, section } = inputSchema.parse(input);

    try {
      const buffer = Buffer.from(file, 'base64');

      // Parse EXIF with specific options based on section
      const options: any = {};

      if (section === 'basic') {
        options.pick = ['ImageWidth', 'ImageHeight', 'FileSize', 'FileType', 'DateTimeOriginal', 'ModifyDate'];
      } else if (section === 'camera') {
        options.pick = ['Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', 'ExposureTime', 'ISO', 'Flash', 'WhiteBalance', 'ExposureProgram', 'MeteringMode'];
      } else if (section === 'gps') {
        options.pick = ['GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSLatitudeRef', 'GPSLongitudeRef'];
      } else if (section === 'thumbnail') {
        options.pick = ['ThumbnailWidth', 'ThumbnailHeight', 'ThumbnailOffset', 'ThumbnailLength'];
      }

      options.mergeOutput = false;

      const exifData = await exifr.parse(buffer, options);

      if (!exifData) {
        return { text: JSON.stringify({ error: 'No EXIF data found in image' }) };
      }

      // Organize output
      const result: Record<string, any> = {};

      // Basic info
      if (section === 'all' || section === 'basic') {
        result.basic = {
          width: exifData.ImageWidth,
          height: exifData.ImageHeight,
          fileSize: exifData.FileSize ? `${(exifData.FileSize / 1024).toFixed(1)} KB` : undefined,
          fileType: exifData.FileType,
          dateTimeOriginal: exifData.DateTimeOriginal,
          modifyDate: exifData.ModifyDate,
        };
      }

      // Camera info
      if (section === 'all' || section === 'camera') {
        result.camera = {
          make: exifData.Make,
          model: exifData.Model,
          lens: exifData.LensModel,
          focalLength: exifData.FocalLength ? `${exifData.FocalLength}mm` : undefined,
          aperture: exifData.FNumber ? `f/${exifData.FNumber}` : undefined,
          shutterSpeed: exifData.ExposureTime ? `1/${Math.round(1/exifData.ExposureTime)}s` : undefined,
          iso: exifData.ISO,
          flash: exifData.Flash,
          whiteBalance: exifData.WhiteBalance,
          exposureProgram: exifData.ExposureProgram,
          meteringMode: exifData.MeteringMode,
        };
      }

      // GPS info
      if (section === 'all' || section === 'gps') {
        if (exifData.GPSLatitude && exifData.GPSLongitude) {
          result.gps = {
            latitude: exifData.GPSLatitude,
            longitude: exifData.GPSLongitude,
            altitude: exifData.GPSAltitude ? `${exifData.GPSAltitude}m` : undefined,
            mapsUrl: `https://www.google.com/maps?q=${exifData.GPSLatitude},${exifData.GPSLongitude}`,
          };
        }
      }

      // Thumbnail info
      if (section === 'all' || section === 'thumbnail') {
        result.thumbnail = {
          width: exifData.ThumbnailWidth,
          height: exifData.ThumbnailHeight,
          hasData: exifData.ThumbnailOffset && exifData.ThumbnailLength ? true : false,
        };
      }

      return { text: JSON.stringify(result, null, 2) };
    } catch (err: any) {
      return { text: JSON.stringify({ error: err.message || 'EXIF extraction failed' }) };
    }
  },
};

register(tool);
export default tool;
