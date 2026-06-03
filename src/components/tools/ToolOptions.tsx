'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { ColorPicker } from '@/components/tools/ColorPicker';
import { RegexPreview } from '@/components/tools/RegexPreview';
import { useI18n } from '@/lib/i18n';
import { TermLabel } from '@/components/shared/TermLabel';

interface ToolOptionsProps {
  toolName: string;
  options: Record<string, any>;
  setOptions: (opts: Record<string, any>) => void;
  textInput?: string;
  cropArea?: { left: number; top: number; width: number; height: number } | null;
  setCropArea?: (area: { left: number; top: number; width: number; height: number } | null) => void;
}

export function ToolOptions({ toolName, options, setOptions, textInput }: ToolOptionsProps) {
  const { t } = useI18n();

  switch (toolName) {
    case 'pdf-split':
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <TermLabel label={t('opt.pages_range')} termKey={undefined} t={t} />
            <Input
              placeholder={t('opt.pages_range_hint')}
              onChange={(e) => {
                const val = e.target.value.trim();
                if (!val) { setOptions({ ...options, pages: undefined }); return; }
                const pages = val.split(',').flatMap(s => {
                  const trimmed = s.trim();
                  if (trimmed.includes('-')) {
                    const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
                    if (!isNaN(start) && !isNaN(end) && start <= end) {
                      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
                    }
                    return [];
                  }
                  const num = parseInt(trimmed);
                  return isNaN(num) ? [] : [num];
                }).filter(n => n > 0);
                setOptions({ ...options, pages: pages.length > 0 ? pages : undefined });
              }}
            />
          </div>
        </div>
      );

    case 'pdf-delete-pages':
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <TermLabel label={t('opt.pages_range')} termKey={undefined} t={t} />
            <Input
              placeholder={t('opt.pages_range_hint')}
              onChange={(e) => {
                const val = e.target.value.trim();
                if (!val) { setOptions({ ...options, pages: undefined }); return; }
                const pages = val.split(',').flatMap(s => {
                  const trimmed = s.trim();
                  if (trimmed.includes('-')) {
                    const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
                    if (!isNaN(start) && !isNaN(end) && start <= end) {
                      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
                    }
                    return [];
                  }
                  const num = parseInt(trimmed);
                  return isNaN(num) ? [] : [num];
                }).filter(n => n > 0);
                setOptions({ ...options, pages: pages.length > 0 ? pages : undefined });
              }}
            />
          </div>
        </div>
      );

    case 'image-resize':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t('opt.width')}</Label>
              <Input
                type="number"
                placeholder="100"
                onChange={(e) => setOptions({ ...options, width: parseInt(e.target.value) || 100 })}
              />
            </div>
            <div>
              <Label>{t('opt.height')}</Label>
              <Input
                type="number"
                placeholder="100"
                onChange={(e) => setOptions({ ...options, height: parseInt(e.target.value) || 100 })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t('opt.lockAspectRatio')}</Label>
              <Select onValueChange={(value) => setOptions({ ...options, lockAspectRatio: value === 'true' })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('val.yes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t('val.yes')}</SelectItem>
                  <SelectItem value="false">{t('val.no')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );

    case 'image-convert':
      return (
        <div className="space-y-4">
          <div>
            <Label>{t('opt.format')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, format: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.select_format')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
                <SelectItem value="avif">AVIF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('opt.quality')}</Label>
            <Input
              type="number"
              placeholder="80"
              onChange={(e) => setOptions({ ...options, quality: parseInt(e.target.value) || undefined })}
            />
          </div>
        </div>
      );

    case 'json-format':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <TermLabel label={t('opt.indent')} termKey="term.json" t={t} />
            <Select onValueChange={(value) => setOptions({ ...options, indent: parseInt(value as string) })}>
              <SelectTrigger>
                <SelectValue placeholder="2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="8">8</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('opt.sortKeys')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, sortKeys: value === 'true' })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.no')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">{t('val.no')}</SelectItem>
                <SelectItem value="true">{t('val.yes')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'text-diff':
      return (
        <div className="space-y-4">
          <div>
            <Label>{t('opt.old_text')}</Label>
            <Textarea
              placeholder={t('opt.enter_old_text')}
              onChange={(e) => setOptions({ ...options, oldText: e.target.value })}
            />
          </div>
          <div>
            <Label>{t('opt.mode')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, mode: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.lines')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lines">{t('val.lines')}</SelectItem>
                <SelectItem value="words">{t('val.words')}</SelectItem>
                <SelectItem value="chars">{t('val.chars')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'base64':
      return (
        <div className="space-y-4">
          <div>
            <TermLabel label={t('opt.action')} termKey="term.base64" t={t} />
            <Select onValueChange={(value) => setOptions({ ...options, action: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.encode')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="encode">{t('val.encode')}</SelectItem>
                <SelectItem value="decode">{t('val.decode')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('opt.encoding')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, encoding: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Base64" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="base64">Base64</SelectItem>
                <SelectItem value="base64url">Base64URL</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'hash':
      return (
        <div className="space-y-4">
          <TermLabel label={t('opt.algorithm')} termKey="term.hash" t={t} />
          <Select onValueChange={(value) => setOptions({ ...options, algorithm: value })}>
            <SelectTrigger>
              <SelectValue placeholder="SHA-256" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="md5">MD5</SelectItem>
              <SelectItem value="sha1">SHA-1</SelectItem>
              <SelectItem value="sha256">SHA-256</SelectItem>
              <SelectItem value="sha384">SHA-384</SelectItem>
              <SelectItem value="sha512">SHA-512</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );

    case 'url-encode':
      return (
        <div className="space-y-4">
          <div>
            <Label>{t('opt.action')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, action: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.encode')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="encode">{t('val.encode')}</SelectItem>
                <SelectItem value="decode">{t('val.decode')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('opt.component_type')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, component: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.component')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="component">{t('val.component')}</SelectItem>
                <SelectItem value="full">{t('val.full_url')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'json-to-csv':
    case 'csv-to-json':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <TermLabel label={t('opt.delimiter')} termKey="term.csv" t={t} />
            <Select onValueChange={(value) => setOptions({ ...options, delimiter: value })}>
              <SelectTrigger>
                <SelectValue placeholder="," />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=",">{t('val.comma')}</SelectItem>
                <SelectItem value=";">{t('val.semicolon')}</SelectItem>
                <SelectItem value="&#9;">{t('val.tab')}</SelectItem>
                <SelectItem value="|">{t('val.pipe')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('opt.header')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, header: value === 'true' })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.yes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t('val.yes')}</SelectItem>
                <SelectItem value="false">{t('val.no')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'csv-to-excel':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <TermLabel label={t('opt.delimiter')} termKey="term.csv" t={t} />
            <Select onValueChange={(value) => setOptions({ ...options, delimiter: value })}>
              <SelectTrigger>
                <SelectValue placeholder="," />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=",">{t('val.comma')}</SelectItem>
                <SelectItem value=";">{t('val.semicolon')}</SelectItem>
                <SelectItem value="&#9;">{t('val.tab')}</SelectItem>
                <SelectItem value="|">{t('val.pipe')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('opt.header')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, header: value === 'true' })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.yes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t('val.yes')}</SelectItem>
                <SelectItem value="false">{t('val.no')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('opt.sheetName')}</Label>
            <Input
              placeholder="Sheet1"
              defaultValue="Sheet1"
              onChange={(e) => setOptions({ ...options, sheetName: e.target.value || 'Sheet1' })}
            />
          </div>
        </div>
      );

    case 'json-to-yaml':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <TermLabel label={t('opt.indent')} termKey="term.yaml" t={t} />
            <Select onValueChange={(value) => setOptions({ ...options, indent: parseInt(value as string) })}>
              <SelectTrigger>
                <SelectValue placeholder="2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="8">8</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'yaml-to-json':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <TermLabel label={t('opt.indent')} termKey="term.yaml" t={t} />
            <Select onValueChange={(value) => setOptions({ ...options, indent: parseInt(value as string) })}>
              <SelectTrigger>
                <SelectValue placeholder="2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="8">8</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'json-to-xml':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <TermLabel label={t('opt.root_element')} termKey="term.xml" t={t} />
            <Input
              placeholder={t('opt.root_placeholder')}
              onChange={(e) => setOptions({ ...options, rootName: e.target.value || 'root' })}
            />
          </div>
          <div>
            <Label>{t('opt.arrayItemName')}</Label>
            <Input
              placeholder="item"
              defaultValue="item"
              onChange={(e) => setOptions({ ...options, arrayItemName: e.target.value || 'item' })}
            />
          </div>
          <div>
            <Label>{t('opt.indent')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, indent: parseInt(value as string) })}>
              <SelectTrigger>
                <SelectValue placeholder="2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'markdown-to-html':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <TermLabel label={t('opt.gfm')} termKey="term.gfm" t={t} />
            <Select onValueChange={(value) => setOptions({ ...options, gfm: value === 'true' })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.yes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t('val.yes')}</SelectItem>
                <SelectItem value="false">{t('val.no')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('opt.line_breaks')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, breaks: value === 'true' })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.no')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">{t('val.no')}</SelectItem>
                <SelectItem value="true">{t('val.yes')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'regex-tester':
      return (
        <div className="space-y-4">
          <div>
            <TermLabel label={t('opt.pattern')} termKey="term.regex" t={t} />
            <Input
              placeholder={t('opt.pattern_placeholder')}
              onChange={(e) => setOptions({ ...options, pattern: e.target.value })}
            />
          </div>
          <div>
            <Label>{t('opt.flags')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, flags: value })}>
              <SelectTrigger>
                <SelectValue placeholder={`g (${t('regex.global')})`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="g">g ({t('regex.global')})</SelectItem>
                <SelectItem value="gi">gi ({t('regex.global')} + {t('regex.case_insensitive')})</SelectItem>
                <SelectItem value="gm">gm ({t('regex.global')} + {t('regex.multiline')})</SelectItem>
                <SelectItem value="gim">gim ({t('regex.all')})</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {textInput && options.pattern && (
            <RegexPreview
              text={textInput}
              pattern={options.pattern}
              flags={options.flags || 'g'}
            />
          )}
        </div>
      );

    case 'text-case':
      return (
        <div className="space-y-4">
          <div>
            <Label>{t('opt.target_case')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, case: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.select_case')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upper">{t('val.upper')}</SelectItem>
                <SelectItem value="lower">{t('val.lower')}</SelectItem>
                <SelectItem value="title">{t('val.title')}</SelectItem>
                <SelectItem value="sentence">{t('val.sentence')}</SelectItem>
                <SelectItem value="camel">{t('val.camel')}</SelectItem>
                <SelectItem value="pascal">{t('val.pascal')}</SelectItem>
                <SelectItem value="snake">{t('val.snake')}</SelectItem>
                <SelectItem value="kebab">{t('val.kebab')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    // ==================== PDF 工具选项 ====================

    case 'pdf-add-page-numbers':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('opt.position')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, position: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.bottom_center')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top-left">{t('val.top_left')}</SelectItem>
                <SelectItem value="top-center">{t('val.top_center')}</SelectItem>
                <SelectItem value="top-right">{t('val.top_right')}</SelectItem>
                <SelectItem value="bottom-left">{t('val.bottom_left')}</SelectItem>
                <SelectItem value="bottom-center">{t('val.bottom_center')}</SelectItem>
                <SelectItem value="bottom-right">{t('val.bottom_right')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{t('opt.position.desc')}</p>
          </div>
          <div>
            <Label>{t('opt.fontSize')}</Label>
            <Input
              type="number"
              placeholder="12"
              defaultValue={12}
              min={6}
              max={72}
              onChange={(e) => setOptions({ ...options, fontSize: Math.min(72, Math.max(6, parseInt(e.target.value) || 12)) })}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('opt.fontSize.desc')}</p>
          </div>
        </div>
      );

    case 'pdf-compress':
      return (
        <div className="space-y-4">
          <div>
            <Label>{t('opt.quality_level')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, quality: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.medium')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t('val.low')}</SelectItem>
                <SelectItem value="medium">{t('val.medium')}</SelectItem>
                <SelectItem value="high">{t('val.high')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'pdf-to-image':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label>{t('opt.page')}</Label>
            <Input
              type="number"
              placeholder="1"
              min="1"
              onChange={(e) => setOptions({ ...options, page: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div>
            <Label>{t('opt.format')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, format: value })}>
              <SelectTrigger>
                <SelectValue placeholder="PNG" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('opt.scale')}</Label>
            <Input
              type="number"
              placeholder="1"
              min="0.1"
              max="3"
              step="0.1"
              onChange={(e) => setOptions({ ...options, scale: parseFloat(e.target.value) || 1 })}
            />
          </div>
        </div>
      );

    case 'pdf-rotate':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('opt.rotation')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, rotation: parseInt((value || '90') as string) })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.rotate_90')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="90">{t('val.rotate_90')}</SelectItem>
                <SelectItem value="180">{t('val.rotate_180')}</SelectItem>
                <SelectItem value="270">{t('val.rotate_270')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('opt.pages')}</Label>
            <Input
              placeholder="1,2,3"
              onChange={(e) => {
                const pages = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                setOptions({ ...options, pages: pages.length > 0 ? pages : undefined });
              }}
            />
          </div>
        </div>
      );

    case 'pdf-extract-pages':
      return (
        <div className="space-y-4">
          <div>
            <TermLabel label={t('opt.pages_range')} termKey={undefined} t={t} />
            <Input
              placeholder={t('opt.pages_range_hint')}
              onChange={(e) => {
                const pages = e.target.value.split(',').flatMap(s => {
                  const trimmed = s.trim();
                  if (trimmed.includes('-')) {
                    const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
                    if (!isNaN(start) && !isNaN(end) && start <= end) {
                      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
                    }
                    return [];
                  }
                  const num = parseInt(trimmed);
                  return isNaN(num) ? [] : [num];
                }).filter(n => n > 0);
                setOptions({ ...options, pages });
              }}
            />
          </div>
        </div>
      );

    case 'pdf-encrypt':
      return (
        <div className="space-y-4">
          <div>
            <Label>{t('opt.password')}</Label>
            <Input
              type="password"
              placeholder={t('opt.password_placeholder')}
              onChange={(e) => setOptions({ ...options, password: e.target.value })}
            />
          </div>
          <div>
            <Label>{t('opt.owner_password')}</Label>
            <Input
              type="password"
              placeholder={t('opt.owner_password_placeholder')}
              onChange={(e) => setOptions({ ...options, ownerPassword: e.target.value })}
            />
          </div>
        </div>
      );

    case 'pdf-watermark':
      return (
        <div className="space-y-4">
          <div>
            <Label>{t('opt.text')}</Label>
            <Input
              placeholder={t('opt.watermark_placeholder')}
              onChange={(e) => setOptions({ ...options, text: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t('opt.font_size')}</Label>
              <Input
                type="number"
                placeholder="50"
                min="10"
                max="200"
                onChange={(e) => setOptions({ ...options, fontSize: parseInt(e.target.value) || 50 })}
              />
            </div>
            <div>
              <Label>{t('opt.opacity')}</Label>
              <Input
                type="number"
                placeholder="0.3"
                min="0"
                max="1"
                step="0.1"
                onChange={(e) => setOptions({ ...options, opacity: parseFloat(e.target.value) || 0.3 })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t('opt.color')}</Label>
              <Input
                placeholder="#888888"
                onChange={(e) => setOptions({ ...options, color: e.target.value || '#888888' })}
              />
            </div>
            <div>
              <Label>{t('opt.position')}</Label>
              <Select onValueChange={(value) => setOptions({ ...options, position: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('val.center')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="center">{t('val.center')}</SelectItem>
                  <SelectItem value="top-left">{t('val.top_left')}</SelectItem>
                  <SelectItem value="top-right">{t('val.top_right')}</SelectItem>
                  <SelectItem value="bottom-left">{t('val.bottom_left')}</SelectItem>
                  <SelectItem value="bottom-right">{t('val.bottom_right')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );

    // ==================== 图片工具选项 ====================

    case 'image-compress':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('opt.quality')}</Label>
            <Input
              type="number"
              placeholder="80"
              min="1"
              max="100"
              onChange={(e) => setOptions({ ...options, quality: parseInt(e.target.value) || 80 })}
            />
          </div>
          <div>
            <Label>{t('opt.format')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, format: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.select_format')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'image-rotate':
      return (
        <div className="space-y-4">
          <div>
            <Label>{t('opt.angle')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, angle: parseInt(value as string) })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.rotate_90')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="90">{t('val.rotate_90')}</SelectItem>
                <SelectItem value="180">{t('val.rotate_180')}</SelectItem>
                <SelectItem value="270">{t('val.rotate_270')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('opt.flip')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, flip: value })}>
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="horizontal">{t('val.flip_h')}</SelectItem>
                <SelectItem value="vertical">{t('val.flip_v')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'image-merge':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('opt.direction')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, direction: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.horizontal')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="horizontal">{t('val.horizontal')}</SelectItem>
                <SelectItem value="vertical">{t('val.vertical')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('opt.background')}</Label>
            <Input
              placeholder="#ffffff"
              onChange={(e) => setOptions({ ...options, background: e.target.value || '#ffffff' })}
            />
          </div>
        </div>
      );

    case 'image-add-watermark':
      return (
        <div className="space-y-4">
          <div>
            <Label>{t('opt.text')}</Label>
            <Input
              placeholder="Watermark"
              onChange={(e) => setOptions({ ...options, text: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t('opt.position')}</Label>
              <Select onValueChange={(value) => setOptions({ ...options, position: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('val.bottom_right')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="center">{t('val.center')}</SelectItem>
                  <SelectItem value="bottom-right">{t('val.bottom_right')}</SelectItem>
                  <SelectItem value="bottom-left">{t('val.bottom_left')}</SelectItem>
                  <SelectItem value="top-right">{t('val.top_right')}</SelectItem>
                  <SelectItem value="top-left">{t('val.top_left')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('opt.opacity')}</Label>
              <Input
                type="number"
                placeholder="0.5"
                min="0"
                max="1"
                step="0.1"
                onChange={(e) => setOptions({ ...options, opacity: parseFloat(e.target.value) || 0.5 })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t('opt.font_size')}</Label>
              <Input
                type="number"
                placeholder="48"
                min="10"
                max="200"
                onChange={(e) => setOptions({ ...options, fontSize: parseInt(e.target.value) || 48 })}
              />
            </div>
            <div>
              <Label>{t('opt.color')}</Label>
              <Input
                placeholder="#ffffff"
                onChange={(e) => setOptions({ ...options, color: e.target.value || '#ffffff' })}
              />
            </div>
          </div>
        </div>
      );

    case 'image-to-ico':
      return (
        <div className="space-y-4">
          <div>
            <Label>{t('opt.ico_size')}</Label>
            <Select onValueChange={(value) => { const s = String(value || '64'); setOptions({ ...options, size: parseInt(s) }); }}>
              <SelectTrigger>
                <SelectValue placeholder="64" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16">16×16 (favicon)</SelectItem>
                <SelectItem value="32">32×32</SelectItem>
                <SelectItem value="48">48×48</SelectItem>
                <SelectItem value="64">64×64</SelectItem>
                <SelectItem value="128">128×128</SelectItem>
                <SelectItem value="256">256×256</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    // ==================== 视频工具选项 ====================

    case 'video-to-audio':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('opt.format')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, format: value })}>
              <SelectTrigger>
                <SelectValue placeholder="MP3" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp3">{t('val.mp3')}</SelectItem>
                <SelectItem value="wav">{t('val.wav')}</SelectItem>
                <SelectItem value="aac">{t('val.aac')}</SelectItem>
                <SelectItem value="ogg">{t('val.ogg')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('opt.quality')}</Label>
            <Input
              type="number"
              placeholder="80"
              min="1"
              max="100"
              onChange={(e) => setOptions({ ...options, quality: parseInt(e.target.value) || 80 })}
            />
          </div>
        </div>
      );

    case 'video-compress':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('opt.quality_level')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, quality: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.medium')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t('val.low')}</SelectItem>
                <SelectItem value="medium">{t('val.medium')}</SelectItem>
                <SelectItem value="high">{t('val.high')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('opt.max_width')} (px)</Label>
            <Input
              type="number"
              placeholder="1920"
              min="100"
              max="3840"
              onChange={(e) => setOptions({ ...options, maxWidth: parseInt(e.target.value) || undefined })}
            />
          </div>
        </div>
      );

    case 'audio-convert':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('opt.targetFormat')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, format: value })}>
              <SelectTrigger>
                <SelectValue placeholder="MP3" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp3">MP3</SelectItem>
                <SelectItem value="wav">WAV</SelectItem>
                <SelectItem value="aac">AAC</SelectItem>
                <SelectItem value="ogg">OGG</SelectItem>
                <SelectItem value="flac">FLAC</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{t('opt.targetFormat.desc')}</p>
          </div>
          <div>
            <Label>{t('opt.quality')}</Label>
            <Input
              type="number"
              placeholder="80"
              min="1"
              max="100"
              onChange={(e) => setOptions({ ...options, quality: parseInt(e.target.value) || 80 })}
            />
          </div>
        </div>
      );

    case 'audio-trim':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('opt.start_time')}</Label>
            <Input
              placeholder="00:00:00"
              onChange={(e) => setOptions({ ...options, startTime: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('opt.start_time.desc')}</p>
          </div>
          <div>
            <Label>{t('opt.end_time')}</Label>
            <Input
              placeholder="00:01:00"
              onChange={(e) => setOptions({ ...options, endTime: e.target.value || undefined })}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('opt.end_time.desc')}</p>
          </div>
          <div>
            <Label>{t('opt.duration')}</Label>
            <Input
              placeholder="00:01:00"
              onChange={(e) => setOptions({ ...options, duration: e.target.value || undefined })}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('opt.duration.desc')}</p>
          </div>
        </div>
      );

    case 'video-trim':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('opt.start_time')}</Label>
            <Input
              placeholder="00:00:00"
              onChange={(e) => setOptions({ ...options, startTime: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('opt.start_time.desc')}</p>
          </div>
          <div>
            <Label>{t('opt.end_time')}</Label>
            <Input
              placeholder="00:01:00"
              onChange={(e) => setOptions({ ...options, endTime: e.target.value || undefined })}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('opt.end_time.desc')}</p>
          </div>
          <div>
            <Label>{t('opt.duration')}</Label>
            <Input
              placeholder="00:01:00"
              onChange={(e) => setOptions({ ...options, duration: e.target.value || undefined })}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('opt.duration.desc')}</p>
          </div>
        </div>
      );

    // ==================== 开发工具选项 ====================

    case 'timestamp':
      return (
        <div className="space-y-4">
          <div>
            <Label>{t('opt.mode')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, mode: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.to_date')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="to-date">{t('val.to_date')}</SelectItem>
                <SelectItem value="from-date">{t('val.from_date')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('opt.format')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, format: value })}>
              <SelectTrigger>
                <SelectValue placeholder="ISO" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="iso">{t('val.iso')}</SelectItem>
                <SelectItem value="locale">{t('val.locale')}</SelectItem>
                <SelectItem value="unix">Unix</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'cron-gen':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label>{t('opt.minute')}</Label>
            <Input
              placeholder="*"
              defaultValue="*"
              onChange={(e) => setOptions({ ...options, minute: e.target.value || '*' })}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('opt.minute.desc')}</p>
          </div>
          <div>
            <Label>{t('opt.hour')}</Label>
            <Input
              placeholder="*"
              defaultValue="*"
              onChange={(e) => setOptions({ ...options, hour: e.target.value || '*' })}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('opt.hour.desc')}</p>
          </div>
          <div>
            <Label>{t('opt.dayOfMonth')}</Label>
            <Input
              placeholder="*"
              defaultValue="*"
              onChange={(e) => setOptions({ ...options, dayOfMonth: e.target.value || '*' })}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('opt.dayOfMonth.desc')}</p>
          </div>
          <div>
            <Label>{t('opt.month')}</Label>
            <Input
              placeholder="*"
              defaultValue="*"
              onChange={(e) => setOptions({ ...options, month: e.target.value || '*' })}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('opt.month.desc')}</p>
          </div>
          <div>
            <Label>{t('opt.dayOfWeek')}</Label>
            <Input
              placeholder="*"
              defaultValue="*"
              onChange={(e) => setOptions({ ...options, dayOfWeek: e.target.value || '*' })}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('opt.dayOfWeek.desc')}</p>
          </div>
        </div>
      );

    case 'lorem-gen':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('opt.paragraphs')}</Label>
            <Input
              type="number"
              placeholder="3"
              defaultValue={3}
              min={1}
              max={20}
              onChange={(e) => setOptions({ ...options, paragraphs: Math.min(20, Math.max(1, parseInt(e.target.value) || 3)) })}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('opt.paragraphs.desc')}</p>
          </div>
          <div>
            <Label>{t('opt.sentencesPerParagraph')}</Label>
            <Input
              type="number"
              placeholder="5"
              defaultValue={5}
              min={1}
              max={20}
              onChange={(e) => setOptions({ ...options, sentencesPerParagraph: Math.min(20, Math.max(1, parseInt(e.target.value) || 5)) })}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('opt.sentencesPerParagraph.desc')}</p>
          </div>
        </div>
      );

    case 'uuid-gen':
      return (
        <div className="space-y-4">
          <div>
            <Label>{t('opt.count')}</Label>
            <Input
              type="number"
              placeholder="1"
              min="1"
              max="100"
              onChange={(e) => setOptions({ ...options, count: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>
      );

    case 'password-gen':
      return (
        <div className="space-y-4">
          <div>
            <Label>{t('opt.length')}</Label>
            <Input
              type="number"
              placeholder="16"
              min="4"
              max="128"
              onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) || 16 })}
            />
          </div>
          <div>
            <Label>{t('opt.count')}</Label>
            <Input
              type="number"
              placeholder="1"
              min="1"
              max="50"
              onChange={(e) => setOptions({ ...options, count: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label>{t('opt.uppercase')}</Label>
              <Select onValueChange={(value) => setOptions({ ...options, uppercase: value === 'true' })}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder={t('val.yes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t('val.yes')}</SelectItem>
                  <SelectItem value="false">{t('val.no')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('opt.lowercase')}</Label>
              <Select onValueChange={(value) => setOptions({ ...options, lowercase: value === 'true' })}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder={t('val.yes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t('val.yes')}</SelectItem>
                  <SelectItem value="false">{t('val.no')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('opt.numbers')}</Label>
              <Select onValueChange={(value) => setOptions({ ...options, numbers: value === 'true' })}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder={t('val.yes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t('val.yes')}</SelectItem>
                  <SelectItem value="false">{t('val.no')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('opt.symbols')}</Label>
              <Select onValueChange={(value) => setOptions({ ...options, symbols: value === 'true' })}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder={t('val.yes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t('val.yes')}</SelectItem>
                  <SelectItem value="false">{t('val.no')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );

    case 'qrcode-gen':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <TermLabel label={t('opt.format')} termKey="term.qr_code" t={t} />
            <Select onValueChange={(value) => setOptions({ ...options, format: value })}>
              <SelectTrigger>
                <SelectValue placeholder="PNG" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">{t('val.png')}</SelectItem>
                <SelectItem value="svg">{t('val.svg')}</SelectItem>
                <SelectItem value="terminal">{t('val.terminal')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('opt.size')} (px)</Label>
            <Input
              type="number"
              placeholder="256"
              min="50"
              max="1000"
              onChange={(e) => setOptions({ ...options, size: parseInt(e.target.value) || 256 })}
            />
          </div>
          <div>
            <Label>{t('opt.error_correction')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, errorCorrectionLevel: value })}>
              <SelectTrigger>
                <SelectValue placeholder="M" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">L (7%)</SelectItem>
                <SelectItem value="M">M (15%)</SelectItem>
                <SelectItem value="Q">Q (25%)</SelectItem>
                <SelectItem value="H">H (30%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'color-convert':
      return (
        <div className="space-y-4">
          <ColorPicker
            color={options.color || '#ff5733'}
            onColorChange={(color) => setOptions({ ...options, color })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t('opt.from_format')}</Label>
              <Select onValueChange={(value) => setOptions({ ...options, from: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="HEX" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hex">HEX</SelectItem>
                  <SelectItem value="rgb">RGB</SelectItem>
                  <SelectItem value="hsl">HSL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('opt.to_format')}</Label>
              <Select onValueChange={(value) => setOptions({ ...options, to: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="RGB" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hex">HEX</SelectItem>
                  <SelectItem value="rgb">RGB</SelectItem>
                  <SelectItem value="hsl">HSL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );

    // ==================== 文件工具选项 ====================

    case 'file-hash':
      return (
        <div className="space-y-4">
          <div>
            <Label>{t('opt.algorithm_hash')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, algorithm: value })}>
              <SelectTrigger>
                <SelectValue placeholder="SHA-256" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="md5">MD5</SelectItem>
                <SelectItem value="sha1">SHA-1</SelectItem>
                <SelectItem value="sha256">SHA-256</SelectItem>
                <SelectItem value="sha512">SHA-512</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'base-converter':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('opt.fromBase')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, fromBase: parseInt(value as string) || 10 })}>
              <SelectTrigger>
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 ({t('val.binary')})</SelectItem>
                <SelectItem value="8">8 ({t('val.octal')})</SelectItem>
                <SelectItem value="10">10 ({t('val.decimal')})</SelectItem>
                <SelectItem value="16">16 ({t('val.hex')})</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{t('opt.fromBase.desc')}</p>
          </div>
          <div>
            <Label>{t('opt.toBase')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, toBase: parseInt(value as string) || 16 })}>
              <SelectTrigger>
                <SelectValue placeholder="16" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 ({t('val.binary')})</SelectItem>
                <SelectItem value="8">8 ({t('val.octal')})</SelectItem>
                <SelectItem value="10">10 ({t('val.decimal')})</SelectItem>
                <SelectItem value="16">16 ({t('val.hex')})</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{t('opt.toBase.desc')}</p>
          </div>
        </div>
      );

    case 'sql-format':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('opt.language')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, language: value })}>
              <SelectTrigger>
                <SelectValue placeholder="SQL" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sql">SQL</SelectItem>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                <SelectItem value="sqlite">SQLite</SelectItem>
                <SelectItem value="bigquery">BigQuery</SelectItem>
                <SelectItem value="tsql">T-SQL</SelectItem>
                <SelectItem value="plsql">PL/SQL</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{t('opt.language.desc')}</p>
          </div>
          <div>
            <Label>{t('opt.indent')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, indent: value })}>
              <SelectTrigger>
                <SelectValue placeholder="2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="tab">Tab</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{t('opt.indent.desc')}</p>
          </div>
        </div>
      );

    // ==================== 转换工具选项 ====================

    case 'xml-to-json':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <TermLabel label={t('opt.indent')} termKey="term.xml" t={t} />
            <Input
              type="number"
              placeholder="2"
              defaultValue={2}
              min={0}
              max={10}
              onChange={(e) => setOptions({ ...options, indent: Math.min(10, Math.max(0, parseInt(e.target.value) || 0)) })}
            />
          </div>
          <div>
            <Label>{t('opt.ignoreAttributes')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, ignoreAttributes: value === 'true' })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.no')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">{t('val.no')}</SelectItem>
                <SelectItem value="true">{t('val.yes')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('opt.attributeNamePrefix')}</Label>
            <Input
              placeholder="@"
              defaultValue="@"
              onChange={(e) => setOptions({ ...options, attributeNamePrefix: e.target.value || '@' })}
            />
          </div>
        </div>
      );

    case 'excel-to-csv':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('opt.sheetIndex')}</Label>
            <Input
              type="number"
              placeholder="0"
              defaultValue={0}
              min={0}
              max={99}
              onChange={(e) => setOptions({ ...options, sheetIndex: Math.min(99, Math.max(0, parseInt(e.target.value) || 0)) })}
            />
          </div>
          <div>
            <TermLabel label={t('opt.delimiter')} termKey="term.csv" t={t} />
            <Select onValueChange={(value) => setOptions({ ...options, delimiter: value })}>
              <SelectTrigger>
                <SelectValue placeholder="," />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=",">{t('val.comma')}</SelectItem>
                <SelectItem value=";">{t('val.semicolon')}</SelectItem>
                <SelectItem value="&#9;">{t('val.tab')}</SelectItem>
                <SelectItem value="|">{t('val.pipe')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'markdown-to-pdf':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>{t('opt.fontSize')}</Label>
            <Input
              type="number"
              placeholder="12"
              defaultValue={12}
              min={6}
              max={72}
              onChange={(e) => setOptions({ ...options, fontSize: Math.min(72, Math.max(6, parseInt(e.target.value) || 12)) })}
            />
          </div>
          <div>
            <Label>{t('opt.margin')}</Label>
            <Input
              type="number"
              placeholder="20"
              defaultValue={20}
              min={0}
              max={100}
              onChange={(e) => setOptions({ ...options, margin: Math.min(100, Math.max(0, parseInt(e.target.value) || 20)) })}
            />
          </div>
          <div>
            <Label>{t('opt.pageSize')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, pageSize: value })}>
              <SelectTrigger>
                <SelectValue placeholder="A4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a4">A4</SelectItem>
                <SelectItem value="letter">Letter</SelectItem>
                <SelectItem value="a3">A3</SelectItem>
                <SelectItem value="a5">A5</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'image-to-base64':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('opt.format')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, outputFormat: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.select_format')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('opt.addDataUri')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, addDataUri: value === 'true' })}>
              <SelectTrigger>
                <SelectValue placeholder={t('val.yes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t('val.yes')}</SelectItem>
                <SelectItem value="false">{t('val.no')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'base64-to-image':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('opt.format')}</Label>
            <Select onValueChange={(value) => setOptions({ ...options, format: value })}>
              <SelectTrigger>
                <SelectValue placeholder="PNG" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'css-format':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('opt.indent')}</Label>
            <Input
              type="number"
              placeholder="2"
              defaultValue={2}
              min={1}
              max={8}
              onChange={(e) => setOptions({ ...options, indent: Math.min(8, Math.max(1, parseInt(e.target.value) || 2)) })}
            />
          </div>
        </div>
      );

    case 'js-format':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('opt.indent')}</Label>
            <Input
              type="number"
              placeholder="2"
              defaultValue={2}
              min={1}
              max={8}
              onChange={(e) => setOptions({ ...options, indent: Math.min(8, Math.max(1, parseInt(e.target.value) || 2)) })}
            />
          </div>
        </div>
      );

    case 'html-format':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('opt.indent')}</Label>
            <Input
              type="number"
              placeholder="2"
              defaultValue={2}
              min={1}
              max={8}
              onChange={(e) => setOptions({ ...options, indent: Math.min(8, Math.max(1, parseInt(e.target.value) || 2)) })}
            />
          </div>
        </div>
      );

    case 'cron-parser':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t('opt.count')}</Label>
            <Input
              type="number"
              placeholder="5"
              defaultValue={5}
              min={1}
              max={20}
              onChange={(e) => setOptions({ ...options, count: Math.min(20, Math.max(1, parseInt(e.target.value) || 5)) })}
            />
          </div>
        </div>
      );

    case 'text-count':
    case 'jwt-decode':
    case 'file-info':
      return null;

    default:
      return null;
  }
}
