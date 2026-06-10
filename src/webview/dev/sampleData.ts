import type { WebviewPayload } from '../types';

export const inventoryPayload: WebviewPayload = {
  view: 'repoInventory',
  inventory: {
    columns: ['fullName', 'visibility', 'defaultBranch', 'primaryLanguage', 'archived', 'updatedAt', 'topics'],
    rows: [
      {
        fullName: 'appsec/workbench-api',
        visibility: 'private',
        defaultBranch: 'main',
        primaryLanguage: 'TypeScript',
        archived: false,
        updatedAt: '2026-05-18T21:14:00.000Z',
        topics: ['security', 'inventory', 'internal-tools']
      },
      {
        fullName: 'appsec/customer-portal',
        visibility: 'private',
        defaultBranch: 'develop',
        primaryLanguage: 'JavaScript',
        archived: false,
        updatedAt: '2026-05-12T14:35:22.000Z',
        topics: ['frontend', 'payments']
      },
      {
        fullName: 'platform/legacy-worker-with-a-very-long-repository-name-to-test-horizontal-layout',
        visibility: 'internal',
        defaultBranch: 'master',
        primaryLanguage: 'Go',
        archived: true,
        updatedAt: '2025-12-01T09:03:10.000Z',
        topics: []
      }
    ]
  }
};

export const emptyInventoryPayload: WebviewPayload = {
  view: 'repoInventory',
  inventory: {
    columns: ['fullName', 'visibility', 'defaultBranch', 'primaryLanguage', 'archived', 'updatedAt'],
    rows: []
  }
};

export const findingsPayload: WebviewPayload = {
  view: 'repoVulnFindings',
  findings: {
    fullName: 'appsec/customer-portal',
    codeqlOpen: [
      {
        githubNumber: 148,
        state: 'open',
        severity: 'high',
        githubRuleSeverity: 'error',
        ruleId: 'js/sql-injection',
        ruleName: 'Database query built from user-controlled sources',
        ruleDescription:
          'A query string is constructed with request data. This sample intentionally has long text so table wrapping and horizontal scrolling can be judged in the browser harness.',
        path: 'src/routes/admin/reports/export.ts',
        startLine: 87,
        endLine: 93,
        message: 'This SQL query depends on a user-controlled value.',
        htmlUrl: 'https://github.com/appsec/customer-portal/security/code-scanning/148',
        githubUpdatedAt: '2026-05-18T19:26:00.000Z',
        dismissedAt: null
      },
      {
        githubNumber: 151,
        state: 'open',
        severity: null,
        githubRuleSeverity: 'warning',
        ruleId: 'js/path-injection',
        ruleName: 'Uncontrolled data used in path expression',
        ruleDescription: null,
        path: 'src/lib/files.ts',
        startLine: 44,
        endLine: null,
        message: 'A filesystem path is derived from request parameters.',
        htmlUrl: null,
        githubUpdatedAt: '2026-05-17T11:05:30.000Z',
        dismissedAt: null
      }
    ],
    codeqlDismissed: [
      {
        githubNumber: 72,
        state: 'dismissed',
        severity: 'medium',
        githubRuleSeverity: 'warning',
        ruleId: 'js/clear-text-logging',
        ruleName: 'Clear-text logging of sensitive information',
        ruleDescription: 'Dismissed after confirming logs are scrubbed by the transport layer.',
        path: 'src/observability/audit.ts',
        startLine: 18,
        endLine: 18,
        message: 'Potential sensitive value in structured logging context.',
        htmlUrl: 'https://github.com/appsec/customer-portal/security/code-scanning/72',
        githubUpdatedAt: '2026-04-19T10:00:00.000Z',
        dismissedAt: '2026-04-20T16:42:00.000Z'
      }
    ],
    dependabotOpen: [
      {
        githubNumber: 88,
        state: 'open',
        severity: 'critical',
        packageName: 'next',
        ecosystem: 'npm',
        manifestPath: 'package.json',
        vulnerableVersionRange: '< 15.4.7',
        patchedVersions: '>= 15.4.7',
        advisorySummary: 'Server-side request forgery vulnerability in image optimization route.',
        htmlUrl: 'https://github.com/appsec/customer-portal/security/dependabot/88',
        githubUpdatedAt: '2026-05-16T22:10:00.000Z',
        dismissedAt: null
      },
      {
        githubNumber: 93,
        state: 'open',
        severity: 'low',
        packageName: '@types/node',
        ecosystem: 'npm',
        manifestPath: 'apps/web/package.json',
        vulnerableVersionRange: '< 22.15.3',
        patchedVersions: '>= 22.15.3',
        advisorySummary: null,
        htmlUrl: null,
        githubUpdatedAt: '2026-05-13T18:47:00.000Z',
        dismissedAt: null
      }
    ],
    dependabotDismissed: [
      {
        githubNumber: 41,
        state: 'auto_dismissed',
        severity: 'medium',
        packageName: 'lodash',
        ecosystem: 'npm',
        manifestPath: 'tools/package.json',
        vulnerableVersionRange: '< 4.17.21',
        patchedVersions: '>= 4.17.21',
        advisorySummary: 'Prototype pollution in lodash.',
        htmlUrl: 'https://github.com/appsec/customer-portal/security/dependabot/41',
        githubUpdatedAt: '2026-01-05T08:30:00.000Z',
        dismissedAt: '2026-01-06T12:00:00.000Z'
      }
    ]
  }
};

export const emptyFindingsPayload: WebviewPayload = {
  view: 'repoVulnFindings',
  findings: {
    fullName: 'appsec/empty-service',
    codeqlOpen: [],
    codeqlDismissed: [],
    dependabotOpen: [],
    dependabotDismissed: []
  }
};

export function getSamplePayload(view: string | null): WebviewPayload | undefined {
  switch (view) {
    case 'inventory':
      return inventoryPayload;
    case 'empty-inventory':
      return emptyInventoryPayload;
    case 'findings':
      return findingsPayload;
    case 'empty':
    case 'empty-findings':
      return emptyFindingsPayload;
    case 'none':
      return undefined;
    default:
      return findingsPayload;
  }
}
