import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep
} from 'cloudflare:workers';
import type { Env } from './types';
import { ingestResearch } from './research';

export type ResearchQuerySpec = {
  query: string;
  mode?: 'research' | 'discovery';
  depth?: 'quick' | 'default' | 'deep';
  sources?: string[];
  shallow?: boolean;
};

export type RecentDemandParams = {
  queries?: ResearchQuerySpec[];
  reason?: string;
};

const MONDAY_QUERIES: ResearchQuerySpec[] = [
  {
    query: 'eSIM viaggio problemi',
    depth: 'quick',
    sources: ['reddit', 'youtube', 'web']
  },
  {
    query: 'Airalo vs Holafly recent experiences',
    depth: 'quick',
    sources: ['reddit', 'youtube', 'web']
  }
];

const THURSDAY_QUERIES: ResearchQuerySpec[] = [
  {
    query: 'best eSIM Japan recent experiences',
    depth: 'quick',
    sources: ['reddit', 'youtube', 'web']
  },
  {
    query: 'travel eSIM questions unanswered',
    depth: 'quick',
    sources: ['reddit', 'youtube', 'web']
  }
];

function scheduledQueries(cron?: string): ResearchQuerySpec[] {
  return cron?.includes('THU') ? THURSDAY_QUERIES : MONDAY_QUERIES;
}

function safeName(query: string, index: number): string {
  const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
  return `research-${index + 1}-${slug || 'query'}`;
}

function sanitizeSpecs(input: ResearchQuerySpec[] | undefined): ResearchQuerySpec[] {
  if (!Array.isArray(input) || input.length === 0) return [];
  return input.slice(0, 6).flatMap((item) => {
    const query = typeof item?.query === 'string' ? item.query.trim().slice(0, 500) : '';
    if (!query) return [];
    return [{
      query,
      mode: item.mode === 'discovery' ? 'discovery' : 'research',
      depth: item.depth === 'deep' || item.depth === 'default' ? item.depth : 'quick',
      sources: Array.isArray(item.sources)
        ? item.sources.map((source) => String(source).trim().toLowerCase()).filter(Boolean).slice(0, 10)
        : undefined,
      shallow: item.shallow !== false
    } satisfies ResearchQuerySpec];
  });
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response: ${text.slice(0, 1000)}`);
  }
}

export class RecentDemandWorkflow extends WorkflowEntrypoint<Env> {
  async run(event: WorkflowEvent<RecentDemandParams>, step: WorkflowStep) {
    const supplied = sanitizeSpecs(event.payload?.queries);
    const queries = supplied.length ? supplied : scheduledQueries(event.schedule?.cron);
    const results: unknown[] = [];

    for (const [index, spec] of queries.entries()) {
      const result = await step.do(
        safeName(spec.query, index),
        {
          retries: { limit: 2, delay: '2 minutes', backoff: 'exponential' },
          timeout: '18 minutes'
        },
        async () => {
          const container = this.env.LAST30DAYS_CONTAINER.getByName('senza-roaming-radar');
          const runnerResponse = await container.fetch('http://last30days.internal/run', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(spec)
          });
          const payload = await parseJson(runnerResponse);
          if (!runnerResponse.ok) {
            throw new Error(`last30days runner failed (${runnerResponse.status}): ${JSON.stringify(payload).slice(0, 1500)}`);
          }

          const ingestRequest = new Request('https://internal/api/maintenance/research-ingest', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const ingestResponse = await ingestResearch(ingestRequest, this.env);
          const ingest = await parseJson(ingestResponse);
          if (!ingestResponse.ok) {
            throw new Error(`research ingest failed (${ingestResponse.status}): ${JSON.stringify(ingest).slice(0, 1500)}`);
          }

          return {
            query: spec.query,
            mode: spec.mode || 'research',
            sources: spec.sources || null,
            ingest
          };
        }
      );
      results.push(result);
    }

    return {
      ok: true,
      workflow: event.workflowName,
      instanceId: event.instanceId,
      scheduledBy: event.schedule?.cron || null,
      reason: event.payload?.reason || (event.schedule ? 'scheduled_recent_demand' : 'manual_recent_demand'),
      completed: results.length,
      results
    };
  }
}
