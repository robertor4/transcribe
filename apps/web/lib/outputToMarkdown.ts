import type {
  StructuredOutput,
  ActionItemsOutput,
  EmailOutput,
  BlogPostOutput,
  LinkedInOutput,
  CommunicationAnalysisOutput,
  ActionItem,
} from '@transcribe/shared';

/**
 * Convert structured output to HTML for rich text clipboard copy
 */
export function structuredOutputToHtml(content: StructuredOutput): string {
  switch (content.type) {
    case 'actionItems':
      return actionItemsToHtml(content as ActionItemsOutput);
    case 'email':
      return emailToHtml(content as EmailOutput);
    case 'blogPost':
      return blogPostToHtml(content as BlogPostOutput);
    case 'linkedin':
      return linkedInToHtml(content as LinkedInOutput);
    case 'communicationAnalysis':
      return communicationAnalysisToHtml(content as CommunicationAnalysisOutput);
    default:
      // Fallback to pre-formatted JSON for unknown types
      return `<pre>${JSON.stringify(content, null, 2)}</pre>`;
  }
}

/**
 * Convert structured output to well-formatted markdown for clipboard copy
 */
export function structuredOutputToMarkdown(content: StructuredOutput): string {
  switch (content.type) {
    case 'actionItems':
      return actionItemsToMarkdown(content as ActionItemsOutput);
    case 'email':
      return emailToMarkdown(content as EmailOutput);
    case 'blogPost':
      return blogPostToMarkdown(content as BlogPostOutput);
    case 'linkedin':
      return linkedInToMarkdown(content as LinkedInOutput);
    case 'communicationAnalysis':
      return communicationAnalysisToMarkdown(content as CommunicationAnalysisOutput);
    default:
      // Fallback to formatted JSON for unknown types
      return JSON.stringify(content, null, 2);
  }
}

function formatActionItem(item: ActionItem): string {
  const lines: string[] = [];
  lines.push(`- [ ] ${item.task}`);

  const meta: string[] = [];
  if (item.owner) meta.push(`Owner: ${item.owner}`);
  if (item.deadline) meta.push(`Deadline: ${item.deadline}`);
  if (item.priorityReason) meta.push(`Priority: ${item.priority} — ${item.priorityReason}`);

  if (meta.length > 0) {
    lines.push(`  - ${meta.join(' · ')}`);
  }

  return lines.join('\n');
}

function actionItemsToMarkdown(data: ActionItemsOutput): string {
  const sections: string[] = ['# Action Items', ''];

  if (data.immediateActions.length > 0) {
    sections.push('## This Week');
    sections.push('');
    data.immediateActions.forEach(item => {
      sections.push(formatActionItem(item));
    });
    sections.push('');
  }

  if (data.shortTermActions.length > 0) {
    sections.push('## This Month');
    sections.push('');
    data.shortTermActions.forEach(item => {
      sections.push(formatActionItem(item));
    });
    sections.push('');
  }

  if (data.longTermActions.length > 0) {
    sections.push('## Long Term');
    sections.push('');
    data.longTermActions.forEach(item => {
      sections.push(formatActionItem(item));
    });
    sections.push('');
  }

  const total = data.immediateActions.length + data.shortTermActions.length + data.longTermActions.length;
  if (total === 0) {
    sections.push('No action items found in this conversation.');
  }

  return sections.join('\n').trim();
}

function emailToMarkdown(data: EmailOutput): string {
  const sections: string[] = [];

  sections.push(`# ${data.subject}`);
  sections.push('');
  sections.push(data.greeting);
  sections.push('');

  data.body.forEach(paragraph => {
    sections.push(paragraph);
    sections.push('');
  });

  if (data.keyPoints.length > 0) {
    sections.push('**Key Points:**');
    data.keyPoints.forEach(point => {
      sections.push(`- ${point}`);
    });
    sections.push('');
  }

  if (data.actionItems.length > 0) {
    sections.push('**Action Items:**');
    data.actionItems.forEach(action => {
      sections.push(`- ${action}`);
    });
    sections.push('');
  }

  sections.push(data.closing);

  return sections.join('\n').trim();
}

function blogPostToMarkdown(data: BlogPostOutput): string {
  const sections: string[] = [];

  sections.push(`# ${data.headline}`);
  if (data.subheading) {
    sections.push(`*${data.subheading}*`);
  }
  sections.push('');

  // Include hero image if available
  if (data.heroImage) {
    sections.push(`![${data.heroImage.alt}](${data.heroImage.url})`);
    sections.push('');
  }

  sections.push(data.hook);
  sections.push('');

  data.sections.forEach(section => {
    sections.push(`## ${section.heading}`);
    sections.push('');

    section.paragraphs.forEach(para => {
      sections.push(para);
      sections.push('');
    });

    if (section.bulletPoints && section.bulletPoints.length > 0) {
      section.bulletPoints.forEach(point => {
        sections.push(`- ${point}`);
      });
      sections.push('');
    }

    if (section.quotes && section.quotes.length > 0) {
      section.quotes.forEach(quote => {
        sections.push(`> "${quote.text}" — ${quote.attribution}`);
      });
      sections.push('');
    }
  });

  sections.push('---');
  sections.push('');
  sections.push(data.callToAction);

  return sections.join('\n').trim();
}

function linkedInToMarkdown(data: LinkedInOutput): string {
  const sections: string[] = [];

  sections.push(data.hook);
  sections.push('');
  sections.push(data.content);
  sections.push('');
  sections.push(data.callToAction);
  sections.push('');

  if (data.hashtags.length > 0) {
    sections.push(data.hashtags.map(tag => `#${tag}`).join(' '));
  }

  return sections.join('\n').trim();
}

function communicationAnalysisToMarkdown(data: CommunicationAnalysisOutput): string {
  const sections: string[] = [];

  sections.push('# Communication Analysis');
  sections.push('');
  sections.push(`**Overall Score: ${data.overallScore}/100**`);
  sections.push('');
  sections.push(data.overallAssessment);
  sections.push('');

  sections.push('## Dimensions');
  sections.push('');

  data.dimensions.forEach(dim => {
    sections.push(`### ${dim.name} — ${dim.score}/100`);
    sections.push('');

    if (dim.strengths.length > 0) {
      sections.push('**Strengths:**');
      dim.strengths.forEach(s => sections.push(`- ${s}`));
      sections.push('');
    }

    if (dim.improvements.length > 0) {
      sections.push('**Areas for Improvement:**');
      dim.improvements.forEach(i => sections.push(`- ${i}`));
      sections.push('');
    }
  });

  sections.push('---');
  sections.push('');
  sections.push(`**Key Takeaway:** ${data.keyTakeaway}`);

  return sections.join('\n').trim();
}

// ============================================================
// HTML CONVERSION FUNCTIONS (for rich text clipboard)
// ============================================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatActionItemHtml(item: ActionItem): string {
  const meta: string[] = [];
  if (item.owner) meta.push(escapeHtml(item.owner));
  if (item.deadline) meta.push(escapeHtml(item.deadline));

  let html = `<li>${escapeHtml(item.task)}`;
  if (meta.length > 0) {
    html += `<br><span style="color: #666; font-size: 0.9em;">${meta.join(' · ')}</span>`;
  }
  html += '</li>';

  return html;
}

function actionItemsToHtml(data: ActionItemsOutput): string {
  const parts: string[] = ['<h1>Action Items</h1>'];

  if (data.immediateActions.length > 0) {
    parts.push('<h2>This Week</h2>');
    parts.push('<ul>');
    data.immediateActions.forEach(item => parts.push(formatActionItemHtml(item)));
    parts.push('</ul>');
  }

  if (data.shortTermActions.length > 0) {
    parts.push('<h2>This Month</h2>');
    parts.push('<ul>');
    data.shortTermActions.forEach(item => parts.push(formatActionItemHtml(item)));
    parts.push('</ul>');
  }

  if (data.longTermActions.length > 0) {
    parts.push('<h2>Long Term</h2>');
    parts.push('<ul>');
    data.longTermActions.forEach(item => parts.push(formatActionItemHtml(item)));
    parts.push('</ul>');
  }

  const total = data.immediateActions.length + data.shortTermActions.length + data.longTermActions.length;
  if (total === 0) {
    parts.push('<p><em>No action items found in this conversation.</em></p>');
  }

  return parts.join('');
}

function emailToHtml(data: EmailOutput): string {
  const parts: string[] = [];

  parts.push(`<h1>${escapeHtml(data.subject)}</h1>`);
  parts.push(`<p>${escapeHtml(data.greeting)}</p>`);

  data.body.forEach(paragraph => {
    parts.push(`<p>${escapeHtml(paragraph)}</p>`);
  });

  if (data.keyPoints.length > 0) {
    parts.push('<p><strong>Key Points:</strong></p>');
    parts.push('<ul>');
    data.keyPoints.forEach(point => parts.push(`<li>${escapeHtml(point)}</li>`));
    parts.push('</ul>');
  }

  if (data.actionItems.length > 0) {
    parts.push('<p><strong>Action Items:</strong></p>');
    parts.push('<ul>');
    data.actionItems.forEach(action => parts.push(`<li>${escapeHtml(action)}</li>`));
    parts.push('</ul>');
  }

  parts.push(`<p>${escapeHtml(data.closing)}</p>`);

  return parts.join('');
}

function blogPostToHtml(data: BlogPostOutput): string {
  const parts: string[] = [];

  parts.push(`<h1>${escapeHtml(data.headline)}</h1>`);
  if (data.subheading) {
    parts.push(`<p><em>${escapeHtml(data.subheading)}</em></p>`);
  }

  // Include hero image if available (floated right for editorial layout)
  if (data.heroImage) {
    parts.push(`<img src="${escapeHtml(data.heroImage.url)}" alt="${escapeHtml(data.heroImage.alt)}" style="float: right; margin: 0 0 1em 1em; max-width: 300px; border-radius: 8px;">`);
  }

  parts.push(`<p>${escapeHtml(data.hook)}</p>`);

  data.sections.forEach(section => {
    parts.push(`<h2>${escapeHtml(section.heading)}</h2>`);

    section.paragraphs.forEach(para => {
      parts.push(`<p>${escapeHtml(para)}</p>`);
    });

    if (section.bulletPoints && section.bulletPoints.length > 0) {
      parts.push('<ul>');
      section.bulletPoints.forEach(point => parts.push(`<li>${escapeHtml(point)}</li>`));
      parts.push('</ul>');
    }

    if (section.quotes && section.quotes.length > 0) {
      section.quotes.forEach(quote => {
        parts.push(`<blockquote>"${escapeHtml(quote.text)}" — <em>${escapeHtml(quote.attribution)}</em></blockquote>`);
      });
    }
  });

  parts.push('<hr>');
  parts.push(`<p>${escapeHtml(data.callToAction)}</p>`);

  return parts.join('');
}

function linkedInToHtml(data: LinkedInOutput): string {
  const parts: string[] = [];

  parts.push(`<p><strong>${escapeHtml(data.hook)}</strong></p>`);
  // Convert \n to <br> for LinkedIn content
  parts.push(`<p>${escapeHtml(data.content).replace(/\n/g, '<br>')}</p>`);
  parts.push(`<p>${escapeHtml(data.callToAction)}</p>`);

  if (data.hashtags.length > 0) {
    parts.push(`<p style="color: #0077B5;">${data.hashtags.map(tag => `#${escapeHtml(tag)}`).join(' ')}</p>`);
  }

  return parts.join('');
}

function communicationAnalysisToHtml(data: CommunicationAnalysisOutput): string {
  const parts: string[] = [];

  parts.push('<h1>Communication Analysis</h1>');
  parts.push(`<p><strong>Overall Score: ${data.overallScore}/100</strong></p>`);
  parts.push(`<p>${escapeHtml(data.overallAssessment)}</p>`);

  parts.push('<h2>Dimensions</h2>');

  data.dimensions.forEach(dim => {
    parts.push(`<h3>${escapeHtml(dim.name)} — ${dim.score}/100</h3>`);

    if (dim.strengths.length > 0) {
      parts.push('<p><strong>Strengths:</strong></p>');
      parts.push('<ul>');
      dim.strengths.forEach(s => parts.push(`<li>${escapeHtml(s)}</li>`));
      parts.push('</ul>');
    }

    if (dim.improvements.length > 0) {
      parts.push('<p><strong>Areas for Improvement:</strong></p>');
      parts.push('<ul>');
      dim.improvements.forEach(i => parts.push(`<li>${escapeHtml(i)}</li>`));
      parts.push('</ul>');
    }
  });

  parts.push('<hr>');
  parts.push(`<p><strong>Key Takeaway:</strong> ${escapeHtml(data.keyTakeaway)}</p>`);

  return parts.join('');
}
