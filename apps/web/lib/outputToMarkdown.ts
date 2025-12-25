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
  sections.push(data.nextStepsToEngage);
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
  parts.push(`<p>${escapeHtml(data.nextStepsToEngage)}</p>`);

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
