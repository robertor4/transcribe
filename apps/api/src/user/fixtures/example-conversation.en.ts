/**
 * Example conversation fixture data for new user onboarding.
 *
 * This creates a realistic 8-minute product strategy meeting between
 * a Product Lead and an Engineering Lead discussing Q2 roadmap priorities.
 * Pre-includes a SummaryV2, speaker segments, and 3 AI asset outputs.
 */
import type {
  SummaryV2,
  Speaker,
  SpeakerSegment,
  ActionItemsOutput,
  FollowUpEmailOutput,
  MeetingMinutesOutput,
} from '@transcribe/shared';

// ---------------------------------------------------------------------------
// Transcript segments
// ---------------------------------------------------------------------------

export function getExampleSpeakerSegments(): SpeakerSegment[] {
  return [
    {
      speakerTag: 'Speaker 1',
      startTime: 0,
      endTime: 18,
      text: "Alright, let's get started. Thanks for making time, Alex. I want to walk through the Q2 roadmap priorities and make sure we're aligned on what's feasible from an engineering perspective.",
    },
    {
      speakerTag: 'Speaker 2',
      startTime: 19,
      endTime: 30,
      text: 'Sounds good. I reviewed the draft you sent yesterday. I have a few thoughts on the timeline, but overall the priorities make sense.',
    },
    {
      speakerTag: 'Speaker 1',
      startTime: 31,
      endTime: 62,
      text: "Great. So the top three items are: first, the self-service onboarding flow for new customers. We're losing about 30% of signups during the first session because the setup process is too manual. Second, the API rate limiting overhaul. And third, the dashboard analytics redesign.",
    },
    {
      speakerTag: 'Speaker 2',
      startTime: 63,
      endTime: 95,
      text: "For the onboarding flow, I think we can scope that to six weeks if we keep it focused. The main risk is the integration with the billing system. We'd need to refactor how we handle trial-to-paid conversions. Right now that logic is spread across three services and it's fragile.",
    },
    {
      speakerTag: 'Speaker 1',
      startTime: 96,
      endTime: 120,
      text: "That's a good call. Can we break it into two phases? Phase one would be the guided setup wizard and the new welcome experience. Phase two handles the billing integration. That way we ship value to users faster and derisk the billing work.",
    },
    {
      speakerTag: 'Speaker 2',
      startTime: 121,
      endTime: 155,
      text: "Yeah, that works. Phase one is probably three to four weeks. We can use feature flags to roll it out gradually. For the billing refactor, I'd want to bring in Sarah since she owns that service. I'd estimate another three weeks for phase two, including testing.",
    },
    {
      speakerTag: 'Speaker 1',
      startTime: 156,
      endTime: 185,
      text: "Perfect. Now for the API rate limiting. I know we've had customer complaints about hitting limits during peak hours. What's the current thinking on the technical approach?",
    },
    {
      speakerTag: 'Speaker 2',
      startTime: 186,
      endTime: 230,
      text: "We've been evaluating two options. Option A is a token bucket algorithm with Redis, which is simpler and covers 90% of use cases. Option B is a sliding window approach that's more accurate but adds complexity. My recommendation is option A. We can always upgrade later, and the token bucket handles burst traffic better for our usage patterns.",
    },
    {
      speakerTag: 'Speaker 1',
      startTime: 231,
      endTime: 255,
      text: "I agree. Let's go with the token bucket approach. How long would that take?",
    },
    {
      speakerTag: 'Speaker 2',
      startTime: 256,
      endTime: 285,
      text: "About two weeks for the core implementation, plus another week for documentation, client SDK updates, and migration tooling. We should also build a dashboard for customers to monitor their usage in real time. That's probably one more week.",
    },
    {
      speakerTag: 'Speaker 1',
      startTime: 286,
      endTime: 320,
      text: 'That usage dashboard ties nicely into the third priority, the analytics redesign. Marketing has been asking for better conversion metrics too. Can we combine the customer-facing usage dashboard with the internal analytics work?',
    },
    {
      speakerTag: 'Speaker 2',
      startTime: 321,
      endTime: 360,
      text: "Partially. The backend data layer can be shared, but the frontend work is separate. The customer dashboard needs to be embedded in their admin panel, while the internal analytics would be on our admin tool. I'd say we can share about 60% of the backend work.",
    },
    {
      speakerTag: 'Speaker 1',
      startTime: 361,
      endTime: 395,
      text: "Good. So here's what I'm thinking for the Q2 timeline. April: kick off onboarding phase one and the rate limiting core work in parallel. May: ship onboarding phase one, start billing refactor and the analytics backend. June: ship rate limiting, start analytics frontend, and continue billing work.",
    },
    {
      speakerTag: 'Speaker 2',
      startTime: 396,
      endTime: 430,
      text: "That's ambitious but doable if we have the headcount. I'd need to pull Marco from the infrastructure project for the rate limiting work. And we should flag the risk on the billing refactor early. If we find unexpected complexity there, it could push into July.",
    },
    {
      speakerTag: 'Speaker 1',
      startTime: 431,
      endTime: 460,
      text: "Understood. Let's set a checkpoint at the end of April to assess progress. If the billing refactor looks risky, we can adjust scope. I'd rather ship fewer things well than rush everything.",
    },
    {
      speakerTag: 'Speaker 2',
      startTime: 461,
      endTime: 480,
      text: "Agreed. I'll put together a technical design doc for the rate limiting this week and schedule a review with the team for next Tuesday.",
    },
    {
      speakerTag: 'Speaker 1',
      startTime: 481,
      endTime: 510,
      text: "Sounds great. I'll update the roadmap document and share it with stakeholders by Friday. Let's also loop in Sarah for a 30-minute sync on the billing refactor next week. Thanks, Alex. This was really productive.",
    },
    {
      speakerTag: 'Speaker 2',
      startTime: 511,
      endTime: 520,
      text: 'Absolutely. Talk soon.',
    },
  ];
}

export function getExampleSpeakers(): Speaker[] {
  return [
    {
      speakerId: 0,
      speakerTag: 'Speaker 1',
      totalSpeakingTime: 278,
      wordCount: 420,
      firstAppearance: 0,
    },
    {
      speakerId: 1,
      speakerTag: 'Speaker 2',
      totalSpeakingTime: 242,
      wordCount: 380,
      firstAppearance: 19,
    },
  ];
}

export function getExampleTranscriptText(): string {
  return getExampleSpeakerSegments()
    .map((seg) => `${seg.speakerTag}: ${seg.text}`)
    .join('\n\n');
}

// ---------------------------------------------------------------------------
// Summary V2
// ---------------------------------------------------------------------------

export function getExampleSummaryV2(): SummaryV2 {
  return {
    version: 2,
    title: 'Q2 Roadmap Priorities and Timeline',
    intro:
      'Product and engineering leadership aligned on three Q2 priorities: a self-service onboarding flow to reduce signup drop-off, an API rate limiting overhaul to address customer complaints, and a dashboard analytics redesign. The team agreed on phased delivery starting in April.',
    keyPoints: [
      {
        topic: 'Self-service onboarding',
        description:
          'A two-phase approach to reduce the 30% signup drop-off: phase one delivers a guided setup wizard in 3-4 weeks, phase two tackles the billing refactor.',
      },
      {
        topic: 'API rate limiting',
        description:
          'Token bucket algorithm with Redis selected over sliding window for simplicity and better burst handling, estimated at 3 weeks including documentation.',
      },
      {
        topic: 'Analytics redesign',
        description:
          'Customer-facing usage dashboard and internal analytics share about 60% of backend work, with separate frontend implementations.',
      },
      {
        topic: 'Timeline and risks',
        description:
          'Parallel workstreams starting April, with an end-of-April checkpoint to assess billing refactor complexity and adjust scope if needed.',
      },
    ],
    detailedSections: [
      {
        topic: 'Self-service onboarding',
        content:
          'The team identified a 30% signup drop-off during the first session caused by a manual setup process. The solution is split into two phases: phase one focuses on a guided setup wizard and welcome experience (3-4 weeks), using feature flags for gradual rollout. Phase two addresses the billing system integration, specifically the trial-to-paid conversion logic currently spread across three services. Sarah, who owns the billing service, will be brought in for phase two, estimated at three additional weeks.',
      },
      {
        topic: 'API rate limiting',
        content:
          'Two technical approaches were evaluated: a token bucket algorithm with Redis (simpler, handles burst traffic well) and a sliding window approach (more accurate but complex). The team chose the token bucket approach with an upgrade path for later. Core implementation is estimated at two weeks, plus one week for documentation, SDK updates, and migration tooling, and one additional week for a real-time usage monitoring dashboard.',
      },
      {
        topic: 'Analytics redesign',
        content:
          'The customer-facing usage dashboard and internal analytics redesign share a common backend data layer, saving about 60% of backend effort. However, frontend work remains separate since the customer dashboard embeds in their admin panel while internal analytics sits in the company admin tool. This work was sequenced to start in May-June after higher-priority items ship.',
      },
      {
        topic: 'Timeline and risks',
        content:
          'The proposed timeline runs parallel workstreams: April kicks off onboarding phase one and rate limiting simultaneously. May ships onboarding phase one and begins the billing refactor and analytics backend. June focuses on shipping rate limiting and starting analytics frontend. The main risk is the billing refactor, which could push into July if unexpected complexity is discovered. An end-of-April checkpoint was agreed upon to assess and adjust scope.',
      },
    ],
    decisions: [
      'Two-phase approach for onboarding: setup wizard first, billing refactor second',
      'Token bucket algorithm with Redis for API rate limiting',
      'Parallel workstreams starting April with end-of-April checkpoint',
      'Marco reassigned from infrastructure to rate limiting',
    ],
    nextSteps: [
      'Alex to write technical design doc for rate limiting by end of week',
      'Rate limiting design review scheduled for next Tuesday',
      'Roadmap document updated and shared with stakeholders by Friday',
      'Schedule 30-minute sync with Sarah on billing refactor next week',
    ],
    generatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Pre-generated AI assets
// ---------------------------------------------------------------------------

export function getExampleActionItems(): ActionItemsOutput {
  return {
    type: 'actionItems',
    immediateActions: [
      {
        task: 'Write technical design doc for API rate limiting',
        owner: 'Alex',
        deadline: 'End of this week',
        priority: 'high',
        priorityReason:
          'Blocks the rate limiting work scheduled to start in April',
      },
      {
        task: 'Update Q2 roadmap document and share with stakeholders',
        owner: 'Speaker 1',
        deadline: 'Friday',
        priority: 'high',
        priorityReason: 'Stakeholders need visibility on the updated plan',
      },
      {
        task: 'Schedule rate limiting design review with the team',
        owner: 'Alex',
        deadline: 'Next Tuesday',
        priority: 'medium',
        priorityReason: 'Required before implementation can begin',
      },
      {
        task: 'Schedule 30-minute sync with Sarah on billing refactor',
        owner: 'Speaker 1',
        deadline: 'Next week',
        priority: 'medium',
        priorityReason: 'Early involvement needed to assess billing complexity',
      },
    ],
    shortTermActions: [
      {
        task: 'Begin onboarding phase one implementation (guided setup wizard)',
        owner: 'Engineering team',
        deadline: 'Start of April',
        priority: 'high',
        priorityReason: 'Addresses 30% signup drop-off',
      },
      {
        task: 'Reassign Marco from infrastructure project to rate limiting',
        owner: 'Alex',
        deadline: 'Before April',
        priority: 'medium',
        priorityReason: 'Required headcount for rate limiting work',
      },
    ],
    longTermActions: [
      {
        task: 'End-of-April checkpoint to assess billing refactor risk',
        owner: 'Speaker 1 and Alex',
        deadline: 'End of April',
        priority: 'medium',
        priorityReason: 'May require scope adjustment if complexity is high',
      },
      {
        task: 'Ship customer-facing usage monitoring dashboard',
        owner: 'Engineering team',
        deadline: 'June',
        priority: 'low',
        priorityReason: 'Sequenced after core rate limiting ships',
      },
    ],
  };
}

export function getExampleFollowUpEmail(): FollowUpEmailOutput {
  return {
    type: 'followUpEmail',
    subject: 'Q2 Roadmap Alignment - Summary and Next Steps',
    greeting: 'Hi Alex,',
    meetingRecap:
      'Thanks for the productive discussion on our Q2 roadmap priorities today.',
    body: [
      'We aligned on three key priorities for Q2: the self-service onboarding flow, the API rate limiting overhaul, and the dashboard analytics redesign.',
      'For onboarding, we agreed on a two-phase approach. Phase one delivers the guided setup wizard and welcome experience in 3-4 weeks using feature flags for gradual rollout. Phase two tackles the billing system refactor with Sarah, estimated at three additional weeks.',
      'For rate limiting, we chose the token bucket algorithm with Redis. You mentioned a total estimate of about four weeks including documentation, SDK updates, and the usage monitoring dashboard.',
      'The analytics redesign will leverage shared backend work between the customer-facing and internal dashboards, with separate frontend implementations.',
    ],
    decisionsConfirmed: [
      'Two-phase onboarding: setup wizard first, billing refactor second',
      'Token bucket with Redis for rate limiting (not sliding window)',
      'Parallel workstreams starting April',
      'End-of-April checkpoint to assess billing refactor risk',
      'Marco reassigned from infrastructure to rate limiting',
    ],
    actionItems: [
      {
        task: 'Write rate limiting technical design doc',
        owner: 'Alex',
        deadline: 'End of this week',
      },
      {
        task: 'Schedule design review with team',
        owner: 'Alex',
        deadline: 'Next Tuesday',
      },
      {
        task: 'Update and share roadmap with stakeholders',
        owner: null,
        deadline: 'Friday',
      },
      {
        task: 'Schedule billing refactor sync with Sarah',
        owner: null,
        deadline: 'Next week',
      },
    ],
    nextSteps:
      "I'll share the updated roadmap by Friday. Let's connect again after your design review next Tuesday to confirm the rate limiting approach with the broader team.",
    closing:
      'Thanks again for the clear thinking on the technical approach. Looking forward to a strong Q2.',
  };
}

export function getExampleMeetingMinutes(): MeetingMinutesOutput {
  return {
    type: 'meetingMinutes',
    title: 'Q2 Roadmap Planning - Product & Engineering Sync',
    date: new Date().toISOString().split('T')[0],
    attendees: ['Product Lead', 'Alex (Engineering Lead)'],
    agendaItems: [
      {
        topic: 'Self-service onboarding flow',
        discussion: [
          '30% of signups drop off during first session due to manual setup process.',
          'Two-phase approach proposed: phase one is the guided setup wizard (3-4 weeks), phase two is billing refactor (3 weeks).',
          'Feature flags will be used for gradual rollout of phase one.',
          'Sarah needs to be involved for the billing integration in phase two.',
        ],
        decisions: [
          'Ship phase one first to deliver value faster and derisk billing work.',
        ],
      },
      {
        topic: 'API rate limiting overhaul',
        discussion: [
          'Customer complaints about hitting limits during peak hours.',
          'Two options evaluated: token bucket with Redis vs sliding window approach.',
          'Token bucket recommended for simplicity and better burst traffic handling.',
          'Scope includes core implementation (2 weeks), docs and SDK updates (1 week), and usage dashboard (1 week).',
        ],
        decisions: [
          'Token bucket algorithm with Redis selected.',
          'Marco to be reassigned from infrastructure project.',
        ],
      },
      {
        topic: 'Dashboard analytics redesign',
        discussion: [
          'Marketing requesting better conversion metrics.',
          'Customer-facing usage dashboard and internal analytics can share about 60% of backend work.',
          'Frontend work remains separate due to different embedding requirements.',
        ],
      },
      {
        topic: 'Q2 timeline',
        discussion: [
          'April: onboarding phase one and rate limiting in parallel.',
          'May: ship onboarding phase one, start billing refactor and analytics backend.',
          'June: ship rate limiting, start analytics frontend.',
          'Risk: billing refactor could push into July.',
        ],
        decisions: [
          'End-of-April checkpoint to assess progress and adjust scope if needed.',
        ],
      },
    ],
    decisions: [
      'Two-phase onboarding approach',
      'Token bucket algorithm for rate limiting',
      'Parallel execution starting April',
      'End-of-April risk checkpoint',
    ],
    actionItems: [
      {
        task: 'Write rate limiting technical design doc',
        owner: 'Alex',
        deadline: 'End of this week',
      },
      {
        task: 'Schedule design review with team',
        owner: 'Alex',
        deadline: 'Next Tuesday',
      },
      {
        task: 'Update roadmap and share with stakeholders',
        owner: 'Product Lead',
        deadline: 'Friday',
      },
      {
        task: 'Schedule billing refactor sync with Sarah',
        owner: 'Product Lead',
        deadline: 'Next week',
      },
    ],
    nextMeeting: 'After rate limiting design review (next Tuesday)',
  };
}
