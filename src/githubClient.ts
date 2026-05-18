import { Octokit } from '@octokit/rest';

export interface GitHubHealthResult {
  login: string;
  rateLimit: number;
  rateLimitRemaining: number;
  rateLimitReset: Date;
}

export function createGitHubClient(token: string): Octokit {
  return new Octokit({
    auth: token,
    userAgent: 'appsec-sidecar-vscode'
  });
}

export async function checkGitHubApi(token: string): Promise<GitHubHealthResult> {
  const octokit = createGitHubClient(token);
  const [{ data: user }, { data: rateLimit }] = await Promise.all([
    octokit.rest.users.getAuthenticated(),
    octokit.rest.rateLimit.get()
  ]);
  const coreLimit = rateLimit.resources.core;

  return {
    login: user.login,
    rateLimit: coreLimit.limit,
    rateLimitRemaining: coreLimit.remaining,
    rateLimitReset: new Date(coreLimit.reset * 1000)
  };
}
