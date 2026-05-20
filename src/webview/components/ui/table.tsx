import * as React from 'react';

import { cn } from '../../lib/utils';

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>): React.JSX.Element {
  return <table className={cn('w-full caption-bottom border-collapse text-sm', className)} {...props} />;
}

export function TableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>): React.JSX.Element {
  return <thead className={cn('[&_tr]:border-b', className)} {...props} />;
}

export function TableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>): React.JSX.Element {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>): React.JSX.Element {
  return (
    <tr
      className={cn(
        'border-b border-[var(--vscode-panel-border)] transition-colors even:bg-[var(--vscode-list-hoverBackground)] hover:bg-[var(--vscode-list-hoverBackground)]',
        className
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>): React.JSX.Element {
  return (
    <th
      className={cn(
        'sticky top-0 z-10 h-9 border border-[var(--vscode-panel-border)] bg-[var(--vscode-editorWidget-background)] px-3 text-left align-middle text-xs font-semibold text-[var(--vscode-foreground)]',
        className
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>): React.JSX.Element {
  return (
    <td
      className={cn(
        'max-w-[28rem] border border-[var(--vscode-panel-border)] px-3 py-2 align-top text-[var(--vscode-foreground)]',
        className
      )}
      {...props}
    />
  );
}
