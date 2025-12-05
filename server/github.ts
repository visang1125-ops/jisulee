// GitHub Integration - uses Replit's GitHub connector
import { Octokit } from '@octokit/rest';

interface ConnectionSettings {
  settings: {
    access_token: string;
    expires_at?: string;
  };
}

let connectionSettings: ConnectionSettings | null = null;

async function getAccessToken() {
  if (connectionSettings?.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
export async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

export async function getAuthenticatedUser() {
  const octokit = await getUncachableGitHubClient();
  const { data } = await octokit.users.getAuthenticated();
  return data;
}

export async function listRepositories() {
  const octokit = await getUncachableGitHubClient();
  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 100
  });
  return data;
}

export async function createRepository(name: string, description: string, isPrivate: boolean = false) {
  const octokit = await getUncachableGitHubClient();
  const { data } = await octokit.repos.createForAuthenticatedUser({
    name,
    description,
    private: isPrivate,
    auto_init: false
  });
  return data;
}

export async function getRepository(owner: string, repo: string) {
  const octokit = await getUncachableGitHubClient();
  try {
    const { data } = await octokit.repos.get({ owner, repo });
    return data;
  } catch (error) {
    const err = error as { status?: number };
    if (err.status === 404) {
      return null;
    }
    throw error;
  }
}
