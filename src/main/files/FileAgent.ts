import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface FileItem {
  name: string;
  path: string;
  sizeBytes: number;
  extension: string;
  modifiedAt: number;
  isDirectory: boolean;
}

export class FileAgent {
  public async searchFiles(
    targetDir: string,
    query: string,
    options: { maxDepth?: number; extensions?: string[]; limit?: number } = {}
  ): Promise<FileItem[]> {
    const results: FileItem[] = [];
    const maxDepth = options.maxDepth ?? 3;
    const limit = options.limit ?? 50;

    const traverse = (dir: string, depth: number) => {
      if (depth > maxDepth || results.length >= limit) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (results.length >= limit) break;
          const fullPath = path.join(dir, entry.name);
          const isDir = entry.isDirectory();

          // Match query
          const matchesQuery = query === '*' || entry.name.toLowerCase().includes(query.toLowerCase());
          const ext = path.extname(entry.name).toLowerCase();
          const matchesExt = !options.extensions || options.extensions.includes(ext);

          if (!isDir && matchesQuery && matchesExt) {
            try {
              const stat = fs.statSync(fullPath);
              results.push({
                name: entry.name,
                path: fullPath,
                sizeBytes: stat.size,
                extension: ext,
                modifiedAt: stat.mtimeMs,
                isDirectory: false,
              });
            } catch {
              // ignore unreadable files
            }
          }

          if (isDir && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            traverse(fullPath, depth + 1);
          }
        }
      } catch {
        // ignore unreadable directories
      }
    };

    traverse(path.resolve(targetDir), 0);
    return results;
  }

  public async readFile(filePath: string, maxBytes = 100 * 1024): Promise<string> {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`File not found: ${resolved}`);
    }
    const stat = fs.statSync(resolved);
    if (stat.size > maxBytes) {
      const fd = fs.openSync(resolved, 'r');
      const buffer = Buffer.alloc(maxBytes);
      fs.readSync(fd, buffer, 0, maxBytes, 0);
      fs.closeSync(fd);
      return buffer.toString('utf-8') + `\n...[Truncated: file size is ${stat.size} bytes]`;
    }
    return fs.readFileSync(resolved, 'utf-8');
  }

  public async createFile(filePath: string, content: string): Promise<boolean> {
    const resolved = path.resolve(filePath);
    const parent = path.dirname(resolved);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }
    fs.writeFileSync(resolved, content, 'utf-8');
    return fs.existsSync(resolved);
  }

  public async moveFile(sourcePath: string, destPath: string): Promise<boolean> {
    const src = path.resolve(sourcePath);
    const dst = path.resolve(destPath);
    const dstDir = path.dirname(dst);
    if (!fs.existsSync(dstDir)) {
      fs.mkdirSync(dstDir, { recursive: true });
    }
    fs.renameSync(src, dst);
    return fs.existsSync(dst);
  }

  public async copyFile(sourcePath: string, destPath: string): Promise<boolean> {
    const src = path.resolve(sourcePath);
    const dst = path.resolve(destPath);
    const dstDir = path.dirname(dst);
    if (!fs.existsSync(dstDir)) {
      fs.mkdirSync(dstDir, { recursive: true });
    }
    fs.copyFileSync(src, dst);
    return fs.existsSync(dst);
  }

  public async deleteFile(filePath: string): Promise<boolean> {
    const resolved = path.resolve(filePath);
    if (fs.existsSync(resolved)) {
      const stat = fs.statSync(resolved);
      if (stat.isDirectory()) {
        fs.rmSync(resolved, { recursive: true, force: true });
      } else {
        fs.unlinkSync(resolved);
      }
      return !fs.existsSync(resolved);
    }
    return true;
  }

  public async findDuplicates(dirPath: string): Promise<Map<string, string[]>> {
    const hashes = new Map<string, string[]>();
    const files = await this.searchFiles(dirPath, '*', { maxDepth: 2, limit: 100 });

    for (const file of files) {
      if (file.sizeBytes === 0) continue;
      try {
        const buffer = fs.readFileSync(file.path);
        const hash = crypto.createHash('md5').update(buffer).digest('hex');
        const list = hashes.get(hash) || [];
        list.push(file.path);
        hashes.set(hash, list);
      } catch {
        // ignore
      }
    }

    const duplicates = new Map<string, string[]>();
    for (const [hash, fileList] of hashes.entries()) {
      if (fileList.length > 1) {
        duplicates.set(hash, fileList);
      }
    }
    return duplicates;
  }

  public async findLargeFiles(dirPath: string, minSizeMB = 50): Promise<FileItem[]> {
    const minBytes = minSizeMB * 1024 * 1024;
    const all = await this.searchFiles(dirPath, '*', { maxDepth: 3, limit: 200 });
    return all.filter((f) => f.sizeBytes >= minBytes).sort((a, b) => b.sizeBytes - a.sizeBytes);
  }
}
