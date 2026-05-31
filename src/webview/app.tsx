import * as React from 'react';
import { ChevronDown, ChevronRight, ExternalLink, PackageSearch, ShieldAlert, Table2 } from 'lucide-react';

import './styles.css';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import type { CodeQlFinding, DependabotFinding, RepoInventory, RepoVulnFindings, WebviewPayload } from './types';
import { openExternal } from './vscode';

export function App({ payload }: { payload?: WebviewPayload }): React.JSX.Element {
  if (!payload) {
    return (
      <Shell title="AppSec Sidecar">
        <EmptyState title="No panel data" description="The webview opened without an AppSec Sidecar payload." />
      </Shell>
    );
  }

  if (payload.view === 'repoInventory') {
    return <RepoInventoryView inventory={payload.inventory} />;
  }

  return <RepoVulnFindingsView findings={payload.findings} />;
}

function RepoInventoryView({ inventory }: { inventory: RepoInventory }): React.JSX.Element {
  return (
    <Shell title="Repo Inventory" description={`${inventory.rows.length} repositories`}>
      {inventory.rows.length === 0 ? (
        <EmptyState title="No repositories found" description="No repositories were found in the Postgres inventory." />
      ) : (
        <DataTable
          columns={inventory.columns}
          rows={inventory.rows.map((row) => inventory.columns.map((column) => formatCellValue(row[column])))}
        />
      )}
    </Shell>
  );
}

function RepoVulnFindingsView({ findings }: { findings: RepoVulnFindings }): React.JSX.Element {
  return (
    <Shell title="Repo Vuln Findings" description={findings.fullName}>
      <div className="space-y-5">
        <FindingsSection
          title="CodeQL Open Findings"
          count={findings.codeqlOpen.length}
          icon={<ShieldAlert className="size-4" aria-hidden="true" />}
        >
          <CodeQlTable findings={findings.codeqlOpen} />
        </FindingsSection>
        <FindingsSection
          title="Dependabot Open Findings"
          count={findings.dependabotOpen.length}
          icon={<PackageSearch className="size-4" aria-hidden="true" />}
        >
          <DependabotTable findings={findings.dependabotOpen} />
        </FindingsSection>
        <FindingsSection
          title="CodeQL Dismissed Findings"
          count={findings.codeqlDismissed.length}
          collapsed
          icon={<ShieldAlert className="size-4" aria-hidden="true" />}
        >
          <CodeQlTable findings={findings.codeqlDismissed} />
        </FindingsSection>
        <FindingsSection
          title="Dependabot Dismissed Findings"
          count={findings.dependabotDismissed.length}
          collapsed
          icon={<PackageSearch className="size-4" aria-hidden="true" />}
        >
          <DependabotTable findings={findings.dependabotDismissed} />
        </FindingsSection>
      </div>
    </Shell>
  );
}

function Shell({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <main className="min-h-screen bg-[var(--vscode-editor-background)] px-6 py-6 text-[var(--vscode-foreground)]">
      <div className="mx-auto w-full max-w-none space-y-5">
        <header className="flex flex-col gap-1 border-b border-[var(--vscode-panel-border)] pb-4">
          <div className="flex items-center gap-2">
            <Table2 className="size-5 text-[var(--vscode-descriptionForeground)]" aria-hidden="true" />
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
          {description ? <p className="text-sm text-[var(--vscode-descriptionForeground)]">{description}</p> : null}
        </header>
        {children}
      </div>
    </main>
  );
}

function FindingsSection({
  title,
  count,
  collapsed = false,
  icon,
  children
}: {
  title: string;
  count: number;
  collapsed?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}): React.JSX.Element {
  const [open, setOpen] = React.useState(!collapsed);
  const ToggleIcon = open ? ChevronDown : ChevronRight;

  return (
    <section className="section-panel">
      <button className="section-header" type="button" onClick={() => setOpen((value) => !value)}>
        <span className="flex min-w-0 items-center gap-2">
          <ToggleIcon className="size-4 shrink-0" aria-hidden="true" />
          <span className="text-[var(--vscode-descriptionForeground)]">{icon}</span>
          <span className="truncate font-semibold">{title}</span>
        </span>
        <Badge variant={count === 0 ? 'muted' : 'default'}>{count}</Badge>
      </button>
      {open ? (
        <div className="section-content">
          {count === 0 ? <EmptyState title="No findings found" description="This section has no matching findings." /> : children}
        </div>
      ) : null}
    </section>
  );
}

function CodeQlTable({ findings }: { findings: CodeQlFinding[] }): React.JSX.Element {
  return (
    <DataTable
      columns={['Number', 'Severity', 'Rule', 'Description', 'Location', 'Message', 'Updated', 'Link']}
      rows={findings.map((finding) => [
        String(finding.githubNumber),
        <SeverityBadge key="severity" severity={finding.severity || finding.githubRuleSeverity} />,
        formatRule(finding.ruleId, finding.ruleName),
        finding.ruleDescription || '',
        formatLocation(finding.path, finding.startLine, finding.endLine),
        finding.message || '',
        formatTimestamp(finding.githubUpdatedAt),
        <OpenLinkButton key="link" url={finding.htmlUrl} />
      ])}
    />
  );
}

function DependabotTable({ findings }: { findings: DependabotFinding[] }): React.JSX.Element {
  return (
    <DataTable
      columns={[
        'Number',
        'Severity',
        'Package',
        'Ecosystem',
        'Manifest',
        'Vulnerable Range',
        'Patched Versions',
        'Advisory',
        'Updated',
        'Link'
      ]}
      rows={findings.map((finding) => [
        String(finding.githubNumber),
        <SeverityBadge key="severity" severity={finding.severity} />,
        finding.packageName || '',
        finding.ecosystem || '',
        finding.manifestPath || '',
        finding.vulnerableVersionRange || '',
        finding.patchedVersions || '',
        finding.advisorySummary || '',
        formatTimestamp(finding.githubUpdatedAt),
        <OpenLinkButton key="link" url={finding.htmlUrl} />
      ])}
    />
  );
}

function DataTable({
  columns,
  rows
}: {
  columns: string[];
  rows: React.ReactNode[][];
}): React.JSX.Element {
  return (
    <div className="table-scroll">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <TableCell key={`${rowIndex}-${columns[cellIndex]}`}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string | null | undefined }): React.JSX.Element {
  const label = severity || 'unknown';
  const variant = getSeverityVariant(label);

  return <Badge variant={variant}>{label}</Badge>;
}

function OpenLinkButton({ url }: { url: string | null }): React.JSX.Element {
  if (!url) {
    return <span className="text-sm text-[var(--vscode-descriptionForeground)]">Unavailable</span>;
  }

  return (
    <Button variant="ghost" size="sm" type="button" onClick={() => openExternal(url)} title={url}>
      <ExternalLink className="size-3.5" aria-hidden="true" />
      Open
    </Button>
  );
}

function EmptyState({ title, description }: { title: string; description: string }): React.JSX.Element {
  return (
    <div className="empty-state">
      <p className="font-medium text-[var(--vscode-foreground)]">{title}</p>
      <p className="text-sm text-[var(--vscode-descriptionForeground)]">{description}</p>
    </div>
  );
}

function getSeverityVariant(severity: string): 'default' | 'destructive' | 'warning' | 'muted' {
  const normalized = severity.toLowerCase();

  if (normalized === 'critical' || normalized === 'high' || normalized === 'error') {
    return 'destructive';
  }

  if (normalized === 'medium' || normalized === 'warning') {
    return 'warning';
  }

  if (normalized === 'unknown' || normalized === 'low' || normalized === 'note') {
    return 'muted';
  }

  return 'default';
}

function formatRule(ruleId: string | null, ruleName: string | null): string {
  return [ruleId, ruleName].filter(Boolean).join(' - ');
}

function formatLocation(path: string | null, startLine: number | null, endLine: number | null): string {
  if (!path) {
    return '';
  }

  if (!startLine) {
    return path;
  }

  const lineRange = endLine && endLine !== startLine ? `${startLine}-${endLine}` : String(startLine);
  return `${path}:${lineRange}`;
}

function formatTimestamp(value: Date | string | null): string {
  if (!value) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}
