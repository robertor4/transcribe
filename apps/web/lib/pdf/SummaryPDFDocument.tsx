import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { SummaryV2 } from '@transcribe/shared';
import { PDF_COLORS } from './pdfStyles';

// Logo path - using PNG for better PDF compatibility
const LOGO_PATH = '/assets/logos/neural-summary-logo.png';

// Register Montserrat font (for headings)
Font.register({
  family: 'Montserrat',
  fonts: [
    { src: '/fonts/Montserrat-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Montserrat-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/Montserrat-Light.ttf', fontWeight: 300 },
    { src: '/fonts/Montserrat-SemiBold.ttf', fontWeight: 600 },
  ],
});

// Register Geist font (for body text)
Font.register({
  family: 'Geist',
  fonts: [
    { src: '/fonts/Geist-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Geist-Bold.ttf', fontWeight: 'bold' },
    { src: '/fonts/Geist-Light.ttf', fontWeight: 300 },
    { src: '/fonts/Geist-Medium.ttf', fontWeight: 500 },
    { src: '/fonts/Geist-SemiBold.ttf', fontWeight: 600 },
  ],
});

export interface SummaryPDFMetadata {
  title: string;
  createdAt: Date;
  duration?: number;
  speakerCount?: number;
  language?: string;
}

interface SummaryPDFDocumentProps {
  summary: SummaryV2;
  metadata: SummaryPDFMetadata;
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    paddingBottom: 50,
    fontFamily: 'Geist', // Default to Geist for body text
    fontSize: 9,
    color: PDF_COLORS.text.primary,
  },
  // Logo and branding header
  brandHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  logo: {
    width: 90, // 25% smaller than 120
    height: 28, // Explicit height to prevent clipping (maintains aspect ratio ~3.2:1)
  },
  // Document header
  header: {
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: PDF_COLORS.primary,
    borderBottomStyle: 'solid',
    paddingBottom: 12,
  },
  title: {
    fontFamily: 'Montserrat', // Headings use Montserrat
    fontSize: 18,
    fontWeight: 'bold',
    color: PDF_COLORS.text.primary,
    marginBottom: 6,
  },
  metadata: {
    flexDirection: 'row',
    gap: 12,
    fontSize: 8,
    color: PDF_COLORS.text.muted,
  },
  metadataItem: {
    marginRight: 12,
  },
  // Intro: Geist Light for body text
  intro: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: 300, // Light
    color: PDF_COLORS.text.secondary,
    lineHeight: 1.5,
    marginBottom: 16,
  },
  // Key Points section
  keyPointsBox: {
    backgroundColor: PDF_COLORS.keyPointsBackground,
    borderLeftWidth: 3,
    borderLeftColor: PDF_COLORS.primary,
    borderLeftStyle: 'solid',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Montserrat', // Headings use Montserrat
    fontSize: 10,
    fontWeight: 'bold',
    color: PDF_COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  keyPointsListContainer: {
    marginLeft: 8,
  },
  keyPoint: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.divider,
    borderBottomStyle: 'solid',
  },
  keyPointLast: {
    paddingVertical: 6,
    borderBottomWidth: 0,
  },
  keyPointFirst: {
    paddingTop: 0,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.divider,
    borderBottomStyle: 'solid',
  },
  keyPointText: {
    fontFamily: 'Geist',
    fontSize: 9,
    lineHeight: 1.5,
    color: PDF_COLORS.text.secondary,
  },
  keyPointTopic: {
    fontFamily: 'Geist',
    fontWeight: 600, // SemiBold
    color: PDF_COLORS.text.primary,
  },
  keyPointDescription: {
    fontFamily: 'Geist',
    color: PDF_COLORS.text.secondary,
  },
  // Detailed sections
  detailedSectionsContainer: {
    marginTop: 4,
    marginBottom: 16,
  },
  detailedSection: {
    borderLeftWidth: 2,
    borderLeftColor: PDF_COLORS.border,
    borderLeftStyle: 'solid',
    paddingLeft: 14,
    marginBottom: 12,
  },
  detailedSectionTopic: {
    fontFamily: 'Geist',
    fontSize: 9,
    fontWeight: 600, // SemiBold
    marginBottom: 4,
    color: PDF_COLORS.text.primary,
  },
  detailedSectionContent: {
    fontFamily: 'Geist',
    fontSize: 9,
    lineHeight: 1.6,
    color: PDF_COLORS.text.secondary,
  },
  // Decisions box
  decisionsBox: {
    backgroundColor: PDF_COLORS.decisionsBackground,
    borderLeftWidth: 3,
    borderLeftColor: PDF_COLORS.secondary,
    borderLeftStyle: 'solid',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  decisionsSectionTitle: {
    fontFamily: 'Montserrat', // Headings use Montserrat
    fontSize: 10,
    fontWeight: 'bold',
    color: PDF_COLORS.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  // Next Steps box
  nextStepsBox: {
    backgroundColor: PDF_COLORS.nextStepsBackground,
    borderLeftWidth: 3,
    borderLeftColor: PDF_COLORS.accent,
    borderLeftStyle: 'solid',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  listContainer: {
    marginLeft: 8,
  },
  listItem: {
    fontFamily: 'Geist',
    marginBottom: 8,
    fontSize: 9,
    lineHeight: 1.5,
    color: PDF_COLORS.text.secondary,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 8,
    color: PDF_COLORS.text.muted,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerLeft: {
    color: PDF_COLORS.text.muted,
  },
  footerRight: {
    color: PDF_COLORS.text.muted,
  },
});

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes} min`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export const SummaryPDFDocument: React.FC<SummaryPDFDocumentProps> = ({
  summary,
  metadata,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Brand Logo */}
        <View style={styles.brandHeader}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={LOGO_PATH} style={styles.logo} />
        </View>

        {/* Document Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{metadata.title}</Text>
          <View style={styles.metadata}>
            <Text style={styles.metadataItem}>{formatDate(metadata.createdAt)}</Text>
            {metadata.duration && (
              <Text style={styles.metadataItem}>
                {formatDuration(metadata.duration)}
              </Text>
            )}
            {metadata.speakerCount && metadata.speakerCount > 1 && (
              <Text style={styles.metadataItem}>
                {metadata.speakerCount} speakers
              </Text>
            )}
            {metadata.language && metadata.language !== 'original' && (
              <Text style={styles.metadataItem}>
                Translated to {metadata.language.toUpperCase()}
              </Text>
            )}
          </View>
        </View>

        {/* Intro */}
        {summary.intro && <Text style={styles.intro}>{summary.intro}</Text>}

        {/* Key Points */}
        {summary.keyPoints.length > 0 && (
          <View style={styles.keyPointsBox}>
            <Text style={styles.sectionTitle}>Key Points</Text>
            <View style={styles.keyPointsListContainer}>
              {summary.keyPoints.map((point, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === summary.keyPoints.length - 1;
                const pointStyle = isFirst
                  ? styles.keyPointFirst
                  : isLast
                    ? styles.keyPointLast
                    : styles.keyPoint;
                return (
                  <View key={idx} style={pointStyle}>
                    <Text style={styles.keyPointText}>
                      <Text style={styles.keyPointTopic}>{point.topic}: </Text>
                      <Text style={styles.keyPointDescription}>
                        {point.description}
                      </Text>
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Detailed Sections */}
        {summary.detailedSections.length > 0 && (
          <View style={styles.detailedSectionsContainer}>
            {summary.detailedSections.map((section, idx) => (
              <View key={idx} style={styles.detailedSection}>
                <Text style={styles.detailedSectionTopic}>{section.topic}</Text>
                <Text style={styles.detailedSectionContent}>{section.content}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Decisions */}
        {summary.decisions && summary.decisions.length > 0 && (
          <View style={styles.decisionsBox}>
            <Text style={styles.decisionsSectionTitle}>Decisions Made</Text>
            <View style={styles.listContainer}>
              {summary.decisions.map((decision, idx) => (
                <Text key={idx} style={styles.listItem}>
                  {idx + 1}. {decision}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Next Steps */}
        {summary.nextSteps && summary.nextSteps.length > 0 && (
          <View style={styles.nextStepsBox}>
            <Text style={styles.decisionsSectionTitle}>Next Steps</Text>
            <View style={styles.listContainer}>
              {summary.nextSteps.map((step, idx) => (
                <Text key={idx} style={styles.listItem}>
                  {idx + 1}. {step}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerLeft}>neuralsummary.com</Text>
          <Text
            style={styles.footerRight}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};
