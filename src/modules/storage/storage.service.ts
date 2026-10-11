import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

export interface UploadResult {
  fileUrl: string;
  key: string;
}

/**
 * Local-disk storage — no cloud account needed. Files live in
 * `<repo>/uploads/<folder>/<uuid>.<ext>` and are served statically by
 * Nest at `${apiUrl}/uploads/...` (wired in main.ts). Every upload gets
 * a fresh random filename, so browsers can never serve a stale cached
 * image for a URL that now points at different content — replacing a
 * category's photo always produces a brand-new URL. The returned
 * fileUrl also carries a `?v=<timestamp>` cache-buster on top of that,
 * belt-and-braces: even if something ever re-saved the same key, the
 * query string alone forces every cache layer (browser, CDN, Next's
 * image optimizer) to treat it as a new resource and refetch instantly.
 */
@Injectable()
export class StorageService {
  private readonly uploadsDir = join(process.cwd(), 'uploads');
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = `${this.config.get<string>('apiUrl')}/uploads`;
  }

  async saveFile(folder: string, originalName: string, buffer: Buffer): Promise<UploadResult> {
    const ext = originalName.split('.').pop() || 'bin';
    const key = `${folder}/${uuidv4()}.${ext}`;
    const dir = join(this.uploadsDir, folder);
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    await writeFile(join(this.uploadsDir, key), buffer);
    return { fileUrl: `${this.baseUrl}/${key}?v=${Date.now()}`, key };
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = join(this.uploadsDir, key);
    if (existsSync(filePath)) await unlink(filePath);
  }

  extractKeyFromUrl(url: string): string {
    return url.replace(`${this.baseUrl}/`, '').split('?')[0];
  }

  getFileUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }
}
