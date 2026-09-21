export class ClipboardManager {
  private currentContent = '';

  public async readText(): Promise<string> {
    return this.currentContent || 'Current clipboard content';
  }

  public async writeText(text: string): Promise<boolean> {
    this.currentContent = text;
    return true;
  }

  public async clear(): Promise<void> {
    this.currentContent = '';
  }
}
