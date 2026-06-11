import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-helpers';

interface ExportBody {
  content: string;
  format: 'markdown' | 'docx' | 'latex';
  filename?: string;
}

// Simple Markdown to LaTeX converter
function markdownToLatex(md: string): string {
  let latex = `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{hyperref}
\\usepackage{listings}
\\usepackage{graphicx}
\\usepackage{amsmath}

\\title{Exported Document}
\\author{}
\\date{\\today}

\\begin{document}
\\maketitle

`;

  const lines = md.split('\n');
  let inItemize = false;
  let inEnumerate = false;

  const closeList = () => {
    if (inItemize) { latex += '\\end{itemize}\n'; inItemize = false; }
    if (inEnumerate) { latex += '\\end{enumerate}\n'; inEnumerate = false; }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      latex += '\n';
      continue;
    }

    // Headings
    if (trimmed.startsWith('###### ')) {
      closeList();
      latex += `\\subparagraph{${escapeLatex(trimmed.slice(7))}}\n`;
    } else if (trimmed.startsWith('##### ')) {
      closeList();
      latex += `\\paragraph{${escapeLatex(trimmed.slice(6))}}\n`;
    } else if (trimmed.startsWith('#### ')) {
      closeList();
      latex += `\\subsubsubsection{${escapeLatex(trimmed.slice(5))}}\n`;
    } else if (trimmed.startsWith('### ')) {
      closeList();
      latex += `\\subsubsection{${escapeLatex(trimmed.slice(4))}}\n`;
    } else if (trimmed.startsWith('## ')) {
      closeList();
      latex += `\\subsection{${escapeLatex(trimmed.slice(3))}}\n`;
    } else if (trimmed.startsWith('# ')) {
      closeList();
      latex += `\\section{${escapeLatex(trimmed.slice(2))}}\n`;
    }
    // Blockquote
    else if (trimmed.startsWith('> ')) {
      closeList();
      latex += `\\begin{quote}\n${escapeLatex(trimmed.slice(2))}\n\\end{quote}\n`;
    }
    // Unordered list
    else if (trimmed.match(/^[-*+]\s/)) {
      if (!inItemize) { closeList(); latex += '\\begin{itemize}\n'; inItemize = true; }
      const item = trimmed.replace(/^[-*+]\s/, '');
      latex += `\\item ${escapeLatex(item)}\n`;
    }
    // Ordered list
    else if (trimmed.match(/^\d+\.\s/)) {
      if (!inEnumerate) { closeList(); latex += '\\begin{enumerate}\n'; inEnumerate = true; }
      const item = trimmed.replace(/^\d+\.\s/, '');
      latex += `\\item ${escapeLatex(item)}\n`;
    }
    // Horizontal rule
    else if (trimmed.match(/^[-*_]{3,}$/)) {
      closeList();
      latex += '\\bigskip\\hrule\\bigskip\n';
    }
    // Regular paragraph
    else {
      closeList();
      latex += `${processInlineLatex(trimmed)}\n\n`;
    }
  }

  closeList();
  latex += '\\end{document}\n';
  return latex;
}

function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/[&%$#_{}]/g, (m) => `\\${m}`)
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

function processInlineLatex(text: string): string {
  let result = escapeLatex(text);
  result = result.replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}');
  result = result.replace(/__(.+?)__/g, '\\textbf{$1}');
  result = result.replace(/\*(.+?)\*/g, '\\textit{$1}');
  result = result.replace(/_(.+?)_/g, '\\textit{$1}');
  result = result.replace(/`(.+?)`/g, '\\texttt{$1}');
  result = result.replace(/\[(.+?)\]\((.+?)\)/g, '\\href{$2}{$1}');
  return result;
}

// Markdown to DOCX converter
async function markdownToDocx(md: string): Promise<Uint8Array> {
  const docxLib = await import('docx');
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
    LevelFormat,
    convertInchesToTwip,
  } = docxLib;

  function parseInlineRuns(text: string): InstanceType<typeof TextRun>[] {
    const runs: InstanceType<typeof TextRun>[] = [];
    const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|([^*`]+)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[2]) {
        runs.push(new TextRun({ text: match[2], bold: true }));
      } else if (match[4]) {
        runs.push(new TextRun({ text: match[4], italics: true }));
      } else if (match[6]) {
        runs.push(new TextRun({ text: match[6], font: 'Courier New', size: 20 }));
      } else if (match[7]) {
        runs.push(new TextRun({ text: match[7] }));
      }
    }
    if (runs.length === 0) {
      runs.push(new TextRun({ text }));
    }
    return runs;
  }

  const paragraphs: InstanceType<typeof Paragraph>[] = [];
  const lines = md.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      paragraphs.push(new Paragraph({ children: [] }));
      continue;
    }

    if (trimmed.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: parseInlineRuns(trimmed.slice(2)),
        })
      );
    } else if (trimmed.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: parseInlineRuns(trimmed.slice(3)),
        })
      );
    } else if (trimmed.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: parseInlineRuns(trimmed.slice(4)),
        })
      );
    } else if (trimmed.startsWith('#### ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_4,
          children: parseInlineRuns(trimmed.slice(5)),
        })
      );
    } else if (trimmed.startsWith('> ')) {
      paragraphs.push(
        new Paragraph({
          indent: { left: convertInchesToTwip(0.5) },
          children: [new TextRun({ text: trimmed.slice(2), italics: true, color: '666666' })],
        })
      );
    } else if (trimmed.match(/^[-*+]\s/)) {
      const item = trimmed.replace(/^[-*+]\s/, '');
      paragraphs.push(
        new Paragraph({ bullet: { level: 0 }, children: parseInlineRuns(item) })
      );
    } else if (trimmed.match(/^\d+\.\s/)) {
      const item = trimmed.replace(/^\d+\.\s/, '');
      paragraphs.push(
        new Paragraph({
          numbering: { reference: 'default-numbering', level: 0 },
          children: parseInlineRuns(item),
        })
      );
    } else if (trimmed.match(/^[-*_]{3,}$/)) {
      paragraphs.push(
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '999999' } },
          children: [],
        })
      );
    } else {
      paragraphs.push(new Paragraph({ children: parseInlineRuns(trimmed) }));
    }
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'default-numbering',
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
    sections: [{ children: paragraphs }],
  });

  return await Packer.toBuffer(doc);
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: ExportBody = await request.json();
    const { content, format, filename } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    if (!format || !['markdown', 'docx', 'latex'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Invalid format. Must be "markdown", "docx", or "latex"' },
        { status: 400 }
      );
    }

    const baseFilename = filename?.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 60) || 'export';

    switch (format) {
      case 'markdown': {
        return new NextResponse(content, {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Content-Disposition': `attachment; filename="${baseFilename}.md"`,
          },
        });
      }

      case 'docx': {
        try {
          const buffer = await markdownToDocx(content);
          return new NextResponse(Buffer.from(buffer), {
            headers: {
              'Content-Type':
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'Content-Disposition': `attachment; filename="${baseFilename}.docx"`,
            },
          });
        } catch (err) {
          console.error('DOCX generation failed:', err);
          return NextResponse.json(
            { success: false, error: 'DOCX generation failed' },
            { status: 500 }
          );
        }
      }

      case 'latex': {
        const latex = markdownToLatex(content);
        return new NextResponse(latex, {
          headers: {
            'Content-Type': 'application/x-tex; charset=utf-8',
            'Content-Disposition': `attachment; filename="${baseFilename}.tex"`,
          },
        });
      }
    }
  } catch (error) {
    console.error('Export failed:', error);
    return NextResponse.json({ success: false, error: 'Export failed' }, { status: 500 });
  }
}
