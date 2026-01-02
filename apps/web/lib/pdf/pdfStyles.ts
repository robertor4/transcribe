/**
 * Brand colors and shared styles for PDF generation
 * Matches the Neural Summary design system and SummaryRenderer.tsx styling
 */

export const PDF_COLORS = {
  primary: '#8D6AFA', // Brand purple
  secondary: '#14D0DC', // Cyan for decisions
  accent: '#3F38A0', // Deep purple for next steps
  // Background colors matching Tailwind's opacity variants
  keyPointsBackground: '#F9FAFB', // gray-50
  decisionsBackground: '#E6FAFB', // #14D0DC at 10% opacity on white
  nextStepsBackground: '#ECEAF6', // #3F38A0 at 10% opacity on white
  text: {
    primary: '#111827', // gray-900
    secondary: '#374151', // gray-700
    muted: '#6B7280', // gray-500
  },
  border: '#E5E7EB', // gray-200
  divider: '#E5E7EB', // gray-200 for key points dividers
};

// Recalculate proper 10% opacity backgrounds
// #14D0DC at 10% = rgb(230, 250, 252) = #E6FAFC
// #3F38A0 at 10% = rgb(236, 234, 246) = #ECEAF6
PDF_COLORS.decisionsBackground = '#E6FAFC';
PDF_COLORS.nextStepsBackground = '#ECEAF6';

export const PDF_FONTS = {
  regular: 'Montserrat',
  bold: 'Montserrat-Bold',
};
