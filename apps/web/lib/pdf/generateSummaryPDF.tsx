import { pdf } from '@react-pdf/renderer';
import type { SummaryV2 } from '@transcribe/shared';
import { SummaryPDFDocument, type SummaryPDFMetadata } from './SummaryPDFDocument';

export interface GeneratePDFOptions {
  summary: SummaryV2;
  metadata: SummaryPDFMetadata;
}

/**
 * Sanitize filename by removing special characters
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .substring(0, 50); // Limit length
}

/**
 * Generate and download a PDF from a V2 summary
 */
export async function generateSummaryPDF(options: GeneratePDFOptions): Promise<void> {
  const { summary, metadata } = options;

  // Create the PDF document element
  const doc = <SummaryPDFDocument summary={summary} metadata={metadata} />;

  // Generate the PDF blob
  const blob = await pdf(doc).toBlob();

  // Create filename
  const date = new Date().toISOString().split('T')[0];
  const locale =
    metadata.language && metadata.language !== 'original'
      ? `_${metadata.language}`
      : '';
  const filename = `${sanitizeFilename(metadata.title)}${locale}_${date}.pdf`;

  // Trigger download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
