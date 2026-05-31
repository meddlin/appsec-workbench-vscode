import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex h-6 items-center rounded-md border px-2 text-xs font-medium uppercase leading-none',
  {
    variants: {
      variant: {
        default:
          'border-[var(--vscode-badge-background)] bg-[var(--vscode-badge-background)] text-[var(--vscode-badge-foreground)]',
        destructive:
          'border-[var(--vscode-inputValidation-errorBorder)] bg-[color-mix(in_srgb,var(--vscode-inputValidation-errorBackground)_35%,transparent)] text-[var(--vscode-inputValidation-errorForeground,var(--vscode-foreground))]',
        warning:
          'border-[var(--vscode-inputValidation-warningBorder)] bg-[color-mix(in_srgb,var(--vscode-inputValidation-warningBackground)_40%,transparent)] text-[var(--vscode-inputValidation-warningForeground,var(--vscode-foreground))]',
        muted:
          'border-[var(--vscode-panel-border)] bg-[var(--vscode-editorWidget-background)] text-[var(--vscode-descriptionForeground)]'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps): React.JSX.Element {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
