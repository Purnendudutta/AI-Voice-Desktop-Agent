import { CommandSandbox } from '../security/CommandSandbox';

export interface GitStatusSummary {
  branch: string;
  isClean: boolean;
  stagedFiles: string[];
  modifiedFiles: string[];
  untrackedFiles: string[];
}

export class GitAgent {
  private sandbox: CommandSandbox;

  constructor(sandbox: CommandSandbox) {
    this.sandbox = sandbox;
  }

  public async getStatus(repoPath = process.cwd()): Promise<GitStatusSummary> {
    const res = await this.sandbox.execute('git status --porcelain -b', { cwd: repoPath });
    const lines = res.stdout.trim().split('\n');

    let branch = 'unknown';
    const stagedFiles: string[] = [];
    const modifiedFiles: string[] = [];
    const untrackedFiles: string[] = [];

    for (const line of lines) {
      if (line.startsWith('## ')) {
        branch = line.replace('## ', '').split('...')[0].trim();
      } else if (line.startsWith('?? ')) {
        untrackedFiles.push(line.substring(3).trim());
      } else if (line.length >= 2) {
        const indexStatus = line[0];
        const worktreeStatus = line[1];
        const file = line.substring(3).trim();

        if (indexStatus !== ' ' && indexStatus !== '?') {
          stagedFiles.push(file);
        }
        if (worktreeStatus !== ' ' && worktreeStatus !== '?') {
          modifiedFiles.push(file);
        }
      }
    }

    return {
      branch,
      isClean: stagedFiles.length === 0 && modifiedFiles.length === 0 && untrackedFiles.length === 0,
      stagedFiles,
      modifiedFiles,
      untrackedFiles,
    };
  }

  public async getDiff(repoPath = process.cwd(), staged = false): Promise<string> {
    const cmd = staged ? 'git diff --cached' : 'git diff';
    const res = await this.sandbox.execute(cmd, { cwd: repoPath });
    return res.stdout || 'No changes detected.';
  }

  public async getLog(repoPath = process.cwd(), limit = 10): Promise<string[]> {
    const res = await this.sandbox.execute(`git log -n ${limit} --oneline`, { cwd: repoPath });
    return res.stdout.trim().split('\n').filter(Boolean);
  }

  public async stageFiles(files: string[], repoPath = process.cwd()): Promise<boolean> {
    const fileList = files.map((f) => `"${f}"`).join(' ');
    const res = await this.sandbox.execute(`git add ${fileList}`, { cwd: repoPath });
    return res.exitCode === 0;
  }

  public async commit(message: string, repoPath = process.cwd()): Promise<string> {
    // Sanitized commit message
    const sanitizedMsg = message.replace(/"/g, '\\"');
    const res = await this.sandbox.execute(`git commit -m "${sanitizedMsg}"`, { cwd: repoPath });
    return res.stdout || res.stderr;
  }
}
