import path from 'node:path';
import os from 'node:os';
import { FileAgent, FileItem } from './FileAgent';

export interface OrganizePlan {
  totalFiles: number;
  categories: Record<string, string[]>;
  plannedMoves: Array<{ source: string; destination: string; category: string }>;
}

export class FileOrganizer {
  private fileAgent: FileAgent;

  private extensionMap: Record<string, string> = {
    // Documents
    '.pdf': 'Documents',
    '.docx': 'Documents',
    '.doc': 'Documents',
    '.xlsx': 'Documents',
    '.csv': 'Documents',
    '.txt': 'Documents',
    '.md': 'Documents',
    // Images
    '.png': 'Images',
    '.jpg': 'Images',
    '.jpeg': 'Images',
    '.gif': 'Images',
    '.svg': 'Images',
    '.webp': 'Images',
    // Audio / Video
    '.mp3': 'Media',
    '.wav': 'Media',
    '.mp4': 'Media',
    '.mkv': 'Media',
    // Code / Archives
    '.zip': 'Archives',
    '.tar': 'Archives',
    '.gz': 'Archives',
    '.7z': 'Archives',
    '.exe': 'Installers',
    '.msi': 'Installers',
  };

  constructor(fileAgent?: FileAgent) {
    this.fileAgent = fileAgent || new FileAgent();
  }

  public async createOrganizePlan(targetDir: string): Promise<OrganizePlan> {
    const lower = targetDir.toLowerCase().trim();
    let resolvedDir = targetDir;
    if (lower === 'downloads' || lower === './downloads') {
      resolvedDir = path.join(os.homedir(), 'Downloads');
    } else if (lower === 'desktop' || lower === './desktop') {
      resolvedDir = path.join(os.homedir(), 'Desktop');
    }

    const files = await this.fileAgent.searchFiles(resolvedDir, '*', { maxDepth: 1, limit: 100 });
    const categories: Record<string, string[]> = {};
    const plannedMoves: OrganizePlan['plannedMoves'] = [];

    for (const file of files) {
      const cat = this.extensionMap[file.extension] || 'Others';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(file.name);

      const destPath = path.join(resolvedDir, cat, file.name);
      plannedMoves.push({
        source: file.path,
        destination: destPath,
        category: cat,
      });
    }

    return {
      totalFiles: files.length,
      categories,
      plannedMoves,
    };
  }

  public async executeOrganizePlan(
    plan: OrganizePlan,
    onProgress?: (current: number, total: number, file: string) => void
  ): Promise<{ movedCount: number; errors: string[] }> {
    let movedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < plan.plannedMoves.length; i++) {
      const move = plan.plannedMoves[i];
      try {
        await this.fileAgent.moveFile(move.source, move.destination);
        movedCount++;
        if (onProgress) {
          onProgress(i + 1, plan.plannedMoves.length, path.basename(move.source));
        }
      } catch (err: any) {
        errors.push(`Failed to move ${move.source}: ${err.message}`);
      }
    }

    return { movedCount, errors };
  }
}
