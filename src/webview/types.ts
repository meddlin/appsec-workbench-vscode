export interface RepoInventory {
  columns: string[];
  rows: Record<string, unknown>[];
}

export interface RepoVulnFindings {
  fullName: string;
  codeqlOpen: CodeQlFinding[];
  codeqlDismissed: CodeQlFinding[];
  dependabotOpen: DependabotFinding[];
  dependabotDismissed: DependabotFinding[];
}

export interface CodeQlFinding {
  githubNumber: number;
  state: string;
  severity: string | null;
  githubRuleSeverity: string | null;
  ruleId: string | null;
  ruleName: string | null;
  ruleDescription: string | null;
  path: string | null;
  startLine: number | null;
  endLine: number | null;
  message: string | null;
  htmlUrl: string | null;
  githubUpdatedAt: Date | string | null;
  dismissedAt: Date | string | null;
}

export interface DependabotFinding {
  githubNumber: number;
  state: string;
  severity: string | null;
  packageName: string | null;
  ecosystem: string | null;
  manifestPath: string | null;
  vulnerableVersionRange: string | null;
  patchedVersions: string | null;
  advisorySummary: string | null;
  htmlUrl: string | null;
  githubUpdatedAt: Date | string | null;
  dismissedAt: Date | string | null;
}

export type WebviewPayload =
  | {
      view: 'repoInventory';
      inventory: RepoInventory;
    }
  | {
      view: 'repoVulnFindings';
      findings: RepoVulnFindings;
    };

export interface VsCodeApi {
  postMessage(message: unknown): void;
}
