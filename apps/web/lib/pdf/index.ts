/**
 * PDF Export utilities for Neural Summary
 *
 * This module provides lazy-loaded PDF generation to avoid bundle bloat.
 * The @react-pdf/renderer library (~300KB) is only loaded when needed.
 */

export type { SummaryPDFMetadata } from './SummaryPDFDocument';
export type { GeneratePDFOptions } from './generateSummaryPDF';

/**
 * Lazy-load the PDF generator to avoid bundle bloat
 * The @react-pdf/renderer library is only loaded when this function is called
 */
export async function loadPDFGenerator() {
  const pdfModule = await import('./generateSummaryPDF');
  return pdfModule.generateSummaryPDF;
}
