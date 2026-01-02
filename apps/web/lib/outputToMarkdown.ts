import type {
  StructuredOutput,
  ActionItemsOutput,
  FollowUpEmailOutput,
  SalesEmailOutput,
  InternalUpdateOutput,
  ClientProposalOutput,
  EmailActionItem,
  BlogPostOutput,
  LinkedInOutput,
  CommunicationAnalysisOutput,
  ActionItem,
  AgileBacklogOutput,
  UserStory,
  Epic,
} from '@transcribe/shared';

/**
 * Convert structured output to HTML for rich text clipboard copy
 */
export function structuredOutputToHtml(content: StructuredOutput): string {
  switch (content.type) {
    case 'actionItems':
      return actionItemsToHtml(content as ActionItemsOutput);
    // Specialized email templates
    case 'followUpEmail':
      return followUpEmailToHtml(content as FollowUpEmailOutput);
    case 'salesEmail':
      return salesEmailToHtml(content as SalesEmailOutput);
    case 'internalUpdate':
      return internalUpdateToHtml(content as InternalUpdateOutput);
    case 'clientProposal':
      return clientProposalToHtml(content as ClientProposalOutput);
    case 'blogPost':
      return blogPostToHtml(content as BlogPostOutput);
    case 'linkedin':
      return linkedInToHtml(content as LinkedInOutput);
    case 'communicationAnalysis':
      return communicationAnalysisToHtml(content as CommunicationAnalysisOutput);
    case 'agileBacklog':
      return agileBacklogToHtml(content as AgileBacklogOutput);
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
    // Specialized email templates
    case 'followUpEmail':
      return followUpEmailToMarkdown(content as FollowUpEmailOutput);
    case 'salesEmail':
      return salesEmailToMarkdown(content as SalesEmailOutput);
    case 'internalUpdate':
      return internalUpdateToMarkdown(content as InternalUpdateOutput);
    case 'clientProposal':
      return clientProposalToMarkdown(content as ClientProposalOutput);
    case 'blogPost':
      return blogPostToMarkdown(content as BlogPostOutput);
    case 'linkedin':
      return linkedInToMarkdown(content as LinkedInOutput);
    case 'communicationAnalysis':
      return communicationAnalysisToMarkdown(content as CommunicationAnalysisOutput);
    case 'agileBacklog':
      return agileBacklogToMarkdown(content as AgileBacklogOutput);
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

// ============================================================
// SPECIALIZED EMAIL MARKDOWN FUNCTIONS
// ============================================================

function formatEmailActionItem(item: EmailActionItem): string {
  let line = `- ${item.task}`;
  const meta: string[] = [];
  if (item.owner) meta.push(`@${item.owner}`);
  if (item.deadline) meta.push(`Due: ${item.deadline}`);
  if (meta.length > 0) {
    line += ` (${meta.join(' · ')})`;
  }
  return line;
}

function followUpEmailToMarkdown(data: FollowUpEmailOutput): string {
  const sections: string[] = [];

  sections.push(`# ${data.subject}`);
  sections.push('');
  sections.push(data.greeting);
  sections.push('');

  data.body.forEach(paragraph => {
    sections.push(paragraph);
    sections.push('');
  });

  sections.push('**Meeting Recap:**');
  sections.push(data.meetingRecap);
  sections.push('');

  if (data.decisionsConfirmed.length > 0) {
    sections.push('**Decisions Confirmed:**');
    data.decisionsConfirmed.forEach(decision => {
      sections.push(`- ${decision}`);
    });
    sections.push('');
  }

  if (data.actionItems.length > 0) {
    sections.push('**Action Items:**');
    data.actionItems.forEach(item => {
      sections.push(formatEmailActionItem(item));
    });
    sections.push('');
  }

  sections.push('**Next Steps:**');
  sections.push(data.nextSteps);
  sections.push('');

  sections.push(data.closing);

  return sections.join('\n').trim();
}

function salesEmailToMarkdown(data: SalesEmailOutput): string {
  const sections: string[] = [];

  sections.push(`# ${data.subject}`);
  sections.push('');
  sections.push(data.greeting);
  sections.push('');

  data.body.forEach(paragraph => {
    sections.push(paragraph);
    sections.push('');
  });

  if (data.painPointsAddressed.length > 0) {
    sections.push('**Challenges We Discussed:**');
    data.painPointsAddressed.forEach(point => {
      sections.push(`- ${point}`);
    });
    sections.push('');
  }

  sections.push('**How We Can Help:**');
  sections.push(data.valueProposition);
  sections.push('');

  sections.push('**Next Step:**');
  sections.push(data.callToAction);
  sections.push('');

  if (data.urgencyHook) {
    sections.push(`*${data.urgencyHook}*`);
    sections.push('');
  }

  sections.push(data.closing);

  return sections.join('\n').trim();
}

function internalUpdateToMarkdown(data: InternalUpdateOutput): string {
  const sections: string[] = [];

  sections.push(`# ${data.subject}`);
  sections.push('');
  sections.push(data.greeting);
  sections.push('');

  data.body.forEach(paragraph => {
    sections.push(paragraph);
    sections.push('');
  });

  sections.push('**TL;DR:**');
  sections.push(data.tldr);
  sections.push('');

  if (data.keyDecisions.length > 0) {
    sections.push('**Key Decisions:**');
    data.keyDecisions.forEach(decision => {
      sections.push(`- ${decision}`);
    });
    sections.push('');
  }

  if (data.blockers && data.blockers.length > 0) {
    sections.push('**Blockers / Risks:**');
    data.blockers.forEach(blocker => {
      sections.push(`- ${blocker}`);
    });
    sections.push('');
  }

  sections.push('**Next Milestone:**');
  sections.push(data.nextMilestone);
  sections.push('');

  sections.push(data.closing);

  return sections.join('\n').trim();
}

function clientProposalToMarkdown(data: ClientProposalOutput): string {
  const sections: string[] = [];

  sections.push(`# ${data.subject}`);
  sections.push('');
  sections.push(data.greeting);
  sections.push('');

  data.body.forEach(paragraph => {
    sections.push(paragraph);
    sections.push('');
  });

  sections.push('**Executive Summary:**');
  sections.push(data.executiveSummary);
  sections.push('');

  if (data.requirementsSummary.length > 0) {
    sections.push('**Your Requirements:**');
    data.requirementsSummary.forEach(req => {
      sections.push(`- ${req}`);
    });
    sections.push('');
  }

  sections.push('**Proposed Solution:**');
  sections.push(data.proposedSolution);
  sections.push('');

  if (data.timelineEstimate) {
    sections.push('**Timeline Estimate:**');
    sections.push(data.timelineEstimate);
    sections.push('');
  }

  sections.push('**Next Steps:**');
  data.nextStepsToEngage.forEach(step => sections.push(`- ${step}`));
  sections.push('');

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

// ============================================================
// SPECIALIZED EMAIL HTML FUNCTIONS
// ============================================================

function formatEmailActionItemHtml(item: EmailActionItem): string {
  const meta: string[] = [];
  if (item.owner) meta.push(`@${escapeHtml(item.owner)}`);
  if (item.deadline) meta.push(`Due: ${escapeHtml(item.deadline)}`);

  let html = `<li>${escapeHtml(item.task)}`;
  if (meta.length > 0) {
    html += `<br><span style="color: #666; font-size: 0.9em;">${meta.join(' · ')}</span>`;
  }
  html += '</li>';

  return html;
}

function followUpEmailToHtml(data: FollowUpEmailOutput): string {
  const parts: string[] = [];

  parts.push(`<h1>${escapeHtml(data.subject)}</h1>`);
  parts.push(`<p>${escapeHtml(data.greeting)}</p>`);

  data.body.forEach(paragraph => {
    parts.push(`<p>${escapeHtml(paragraph)}</p>`);
  });

  parts.push(`<p><strong>Meeting Recap:</strong></p>`);
  parts.push(`<p>${escapeHtml(data.meetingRecap)}</p>`);

  if (data.decisionsConfirmed.length > 0) {
    parts.push('<p><strong>Decisions Confirmed:</strong></p>');
    parts.push('<ul>');
    data.decisionsConfirmed.forEach(decision => parts.push(`<li>${escapeHtml(decision)}</li>`));
    parts.push('</ul>');
  }

  if (data.actionItems.length > 0) {
    parts.push('<p><strong>Action Items:</strong></p>');
    parts.push('<ul>');
    data.actionItems.forEach(item => parts.push(formatEmailActionItemHtml(item)));
    parts.push('</ul>');
  }

  parts.push(`<p><strong>Next Steps:</strong></p>`);
  parts.push(`<p>${escapeHtml(data.nextSteps)}</p>`);

  parts.push(`<p>${escapeHtml(data.closing)}</p>`);

  return parts.join('');
}

function salesEmailToHtml(data: SalesEmailOutput): string {
  const parts: string[] = [];

  parts.push(`<h1>${escapeHtml(data.subject)}</h1>`);
  parts.push(`<p>${escapeHtml(data.greeting)}</p>`);

  data.body.forEach(paragraph => {
    parts.push(`<p>${escapeHtml(paragraph)}</p>`);
  });

  if (data.painPointsAddressed.length > 0) {
    parts.push('<p><strong>Challenges We Discussed:</strong></p>');
    parts.push('<ul>');
    data.painPointsAddressed.forEach(point => parts.push(`<li>${escapeHtml(point)}</li>`));
    parts.push('</ul>');
  }

  parts.push(`<p><strong>How We Can Help:</strong></p>`);
  parts.push(`<p>${escapeHtml(data.valueProposition)}</p>`);

  parts.push(`<p><strong>Next Step:</strong></p>`);
  parts.push(`<p>${escapeHtml(data.callToAction)}</p>`);

  if (data.urgencyHook) {
    parts.push(`<p><em>${escapeHtml(data.urgencyHook)}</em></p>`);
  }

  parts.push(`<p>${escapeHtml(data.closing)}</p>`);

  return parts.join('');
}

function internalUpdateToHtml(data: InternalUpdateOutput): string {
  const parts: string[] = [];

  parts.push(`<h1>${escapeHtml(data.subject)}</h1>`);
  parts.push(`<p>${escapeHtml(data.greeting)}</p>`);

  data.body.forEach(paragraph => {
    parts.push(`<p>${escapeHtml(paragraph)}</p>`);
  });

  parts.push(`<p><strong>TL;DR:</strong></p>`);
  parts.push(`<p style="background: #e0f7fa; padding: 10px; border-radius: 4px;"><strong>${escapeHtml(data.tldr)}</strong></p>`);

  if (data.keyDecisions.length > 0) {
    parts.push('<p><strong>Key Decisions:</strong></p>');
    parts.push('<ul>');
    data.keyDecisions.forEach(decision => parts.push(`<li>${escapeHtml(decision)}</li>`));
    parts.push('</ul>');
  }

  if (data.blockers && data.blockers.length > 0) {
    parts.push('<p><strong>Blockers / Risks:</strong></p>');
    parts.push('<ul style="color: #c62828;">');
    data.blockers.forEach(blocker => parts.push(`<li>${escapeHtml(blocker)}</li>`));
    parts.push('</ul>');
  }

  parts.push(`<p><strong>Next Milestone:</strong></p>`);
  parts.push(`<p>${escapeHtml(data.nextMilestone)}</p>`);

  parts.push(`<p>${escapeHtml(data.closing)}</p>`);

  return parts.join('');
}

function clientProposalToHtml(data: ClientProposalOutput): string {
  const parts: string[] = [];

  parts.push(`<h1>${escapeHtml(data.subject)}</h1>`);
  parts.push(`<p>${escapeHtml(data.greeting)}</p>`);

  data.body.forEach(paragraph => {
    parts.push(`<p>${escapeHtml(paragraph)}</p>`);
  });

  parts.push(`<p><strong>Executive Summary:</strong></p>`);
  parts.push(`<p style="background: #f5f5f5; padding: 10px; border-left: 3px solid #3f51b5; border-radius: 4px;">${escapeHtml(data.executiveSummary)}</p>`);

  if (data.requirementsSummary.length > 0) {
    parts.push('<p><strong>Your Requirements:</strong></p>');
    parts.push('<ul>');
    data.requirementsSummary.forEach(req => parts.push(`<li>${escapeHtml(req)}</li>`));
    parts.push('</ul>');
  }

  parts.push(`<p><strong>Proposed Solution:</strong></p>`);
  parts.push(`<p>${escapeHtml(data.proposedSolution)}</p>`);

  if (data.timelineEstimate) {
    parts.push(`<p><strong>Timeline Estimate:</strong></p>`);
    parts.push(`<p>${escapeHtml(data.timelineEstimate)}</p>`);
  }

  parts.push(`<p><strong>Next Steps:</strong></p>`);
  parts.push(`<ul>${data.nextStepsToEngage.map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ul>`);

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

// ============================================================
// AGILE BACKLOG FUNCTIONS
// ============================================================

// Priority badge styles for HTML (Word-compatible inline CSS)
const PRIORITY_HTML_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  'must-have': { bg: '#FEE2E2', color: '#991B1B', label: 'Must Have' },
  'should-have': { bg: '#FEF3C7', color: '#92400E', label: 'Should Have' },
  'could-have': { bg: '#DBEAFE', color: '#1E40AF', label: 'Could Have' },
  'wont-have': { bg: '#F3F4F6', color: '#4B5563', label: "Won't Have" },
};

const PRIORITY_LABELS: Record<string, string> = {
  'must-have': 'Must Have',
  'should-have': 'Should Have',
  'could-have': 'Could Have',
  'wont-have': "Won't Have",
};

/**
 * Convert a single user story to markdown (exported for individual copy)
 */
export function userStoryToMarkdown(story: UserStory): string {
  const lines: string[] = [];

  // Title with ID and priority
  const priorityLabel = story.priority ? ` [${PRIORITY_LABELS[story.priority]}]` : '';
  lines.push(`**${story.id}: ${story.title}**${priorityLabel}`);
  lines.push('');

  // Statement
  lines.push(story.statement);
  lines.push('');

  // Acceptance criteria
  if (story.acceptanceCriteria && story.acceptanceCriteria.length > 0) {
    lines.push('**Acceptance Criteria:**');
    story.acceptanceCriteria.forEach(ac => {
      lines.push(`- [ ] ${ac.criterion}`);
    });
    lines.push('');
  }

  // Technical notes
  if (story.technicalNotes && story.technicalNotes.length > 0) {
    lines.push('**Technical Notes:**');
    story.technicalNotes.forEach(note => {
      lines.push(`- ${note}`);
    });
    lines.push('');
  }

  // Dependencies
  if (story.dependencies && story.dependencies.length > 0) {
    lines.push(`**Dependencies:** ${story.dependencies.join(', ')}`);
    lines.push('');
  }

  return lines.join('\n').trim();
}

/**
 * Convert a single user story to HTML (exported for individual copy)
 */
export function userStoryToHtml(story: UserStory): string {
  const parts: string[] = [];

  // Title with ID and priority badge
  parts.push('<div style="margin-bottom: 16px; padding: 16px; border: 1px solid #E5E7EB; border-left: 3px solid #8D6AFA; border-radius: 8px;">');

  // Header row
  parts.push('<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">');
  parts.push(`<span style="background: rgba(141, 106, 250, 0.1); color: #8D6AFA; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 12px; font-weight: 500;">${escapeHtml(story.id)}</span>`);
  parts.push(`<strong style="font-size: 16px;">${escapeHtml(story.title)}</strong>`);

  if (story.priority) {
    const style = PRIORITY_HTML_STYLES[story.priority];
    if (style) {
      parts.push(`<span style="background: ${style.bg}; color: ${style.color}; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; margin-left: auto;">${style.label}</span>`);
    }
  }
  parts.push('</div>');

  // Statement
  parts.push(`<div style="background: #F9FAFB; padding: 12px; border-radius: 6px; margin-bottom: 12px;">`);
  parts.push(`<p style="margin: 0;">${escapeHtml(story.statement)}</p>`);
  parts.push('</div>');

  // Acceptance criteria
  if (story.acceptanceCriteria && story.acceptanceCriteria.length > 0) {
    parts.push('<div style="margin-bottom: 12px; padding-left: 12px; border-left: 2px solid #14D0DC;">');
    parts.push('<p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em;">Acceptance Criteria</p>');
    parts.push('<ul style="margin: 0; padding-left: 20px;">');
    story.acceptanceCriteria.forEach(ac => {
      parts.push(`<li style="margin-bottom: 4px;">☐ ${escapeHtml(ac.criterion)}</li>`);
    });
    parts.push('</ul>');
    parts.push('</div>');
  }

  // Technical notes
  if (story.technicalNotes && story.technicalNotes.length > 0) {
    parts.push('<div style="margin-bottom: 12px;">');
    parts.push('<p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 500; color: #6B7280;">Technical Notes</p>');
    parts.push('<ul style="margin: 0; padding-left: 20px; color: #4B5563;">');
    story.technicalNotes.forEach(note => {
      parts.push(`<li style="margin-bottom: 2px;">${escapeHtml(note)}</li>`);
    });
    parts.push('</ul>');
    parts.push('</div>');
  }

  // Dependencies
  if (story.dependencies && story.dependencies.length > 0) {
    parts.push('<div>');
    parts.push('<span style="font-size: 12px; font-weight: 500; color: #6B7280;">Dependencies: </span>');
    parts.push(story.dependencies.map(dep =>
      `<span style="background: #F3F4F6; color: #4B5563; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px;">${escapeHtml(dep)}</span>`
    ).join(' '));
    parts.push('</div>');
  }

  parts.push('</div>');

  return parts.join('');
}

function epicToMarkdown(epic: Epic): string {
  const lines: string[] = [];

  lines.push(`### ${epic.id}: ${epic.title}`);
  lines.push('');
  lines.push(epic.description);
  lines.push('');

  if (epic.stories && epic.stories.length > 0) {
    lines.push('#### User Stories');
    lines.push('');
    epic.stories.forEach(story => {
      lines.push(userStoryToMarkdown(story));
      lines.push('');
      lines.push('---');
      lines.push('');
    });
  }

  return lines.join('\n').trim();
}

function epicToHtml(epic: Epic): string {
  const parts: string[] = [];

  parts.push('<div style="margin-bottom: 24px;">');

  // Epic header
  parts.push('<div style="background: rgba(141, 106, 250, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 16px;">');
  parts.push('<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">');
  parts.push(`<span style="background: rgba(141, 106, 250, 0.2); color: #8D6AFA; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 12px; font-weight: 500;">${escapeHtml(epic.id)}</span>`);
  parts.push(`<strong style="font-size: 18px;">${escapeHtml(epic.title)}</strong>`);
  parts.push(`<span style="color: #6B7280; font-size: 14px;">(${epic.stories?.length || 0} stories)</span>`);
  parts.push('</div>');
  parts.push(`<p style="margin: 0; color: #4B5563;">${escapeHtml(epic.description)}</p>`);
  parts.push('</div>');

  // Stories
  if (epic.stories && epic.stories.length > 0) {
    parts.push('<div style="margin-left: 24px;">');
    epic.stories.forEach(story => {
      parts.push(userStoryToHtml(story));
    });
    parts.push('</div>');
  }

  parts.push('</div>');

  return parts.join('');
}

function agileBacklogToMarkdown(data: AgileBacklogOutput): string {
  const sections: string[] = ['# Agile Backlog', ''];

  // Summary if present
  if (data.summary) {
    sections.push(data.summary);
    sections.push('');
  }

  // Epics
  const epics = data.epics || [];
  if (epics.length > 0) {
    sections.push('## Epics');
    sections.push('');
    epics.forEach(epic => {
      sections.push(epicToMarkdown(epic));
      sections.push('');
    });
  }

  // Standalone stories
  const standaloneStories = data.standaloneStories || [];
  if (standaloneStories.length > 0) {
    sections.push('## Standalone Stories');
    sections.push('');
    standaloneStories.forEach(story => {
      sections.push(userStoryToMarkdown(story));
      sections.push('');
      sections.push('---');
      sections.push('');
    });
  }

  return sections.join('\n').trim();
}

function agileBacklogToHtml(data: AgileBacklogOutput): string {
  const parts: string[] = [];

  parts.push('<h1>Agile Backlog</h1>');

  // Summary if present
  if (data.summary) {
    parts.push(`<p>${escapeHtml(data.summary)}</p>`);
  }

  // Stats
  const epics = data.epics || [];
  const standaloneStories = data.standaloneStories || [];
  const totalStoriesInEpics = epics.reduce((acc, epic) => acc + (epic.stories?.length || 0), 0);
  const totalStories = totalStoriesInEpics + standaloneStories.length;

  parts.push(`<p style="color: #6B7280; font-size: 14px;">${epics.length} epic${epics.length !== 1 ? 's' : ''} · ${totalStories} user stor${totalStories !== 1 ? 'ies' : 'y'}</p>`);

  // Epics
  if (epics.length > 0) {
    parts.push('<h2>Epics</h2>');
    epics.forEach(epic => {
      parts.push(epicToHtml(epic));
    });
  }

  // Standalone stories
  if (standaloneStories.length > 0) {
    parts.push('<h2>Standalone Stories</h2>');
    standaloneStories.forEach(story => {
      parts.push(userStoryToHtml(story));
    });
  }

  return parts.join('');
}
