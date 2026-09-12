import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Mandapam } from '../types/mandapam.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'mandapams.json');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'submissions');

const SEED_MANDAPAMS: Mandapam[] = [
  {
    id: 'b1a2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    name: 'Khairatabad Maha Ganapathi',
    area: 'Khairatabad',
    address: 'Khairatabad, Hyderabad, Telangana 500004',
    description: 'One of the tallest and most iconic Ganesh idols in India, established in 1954. Attracts millions of devotees during Ganesh Navaratri.',
    latitude: 17.4123,
    longitude: 78.4632,
    image_url: 'https://images.unsplash.com/photo-1567591370504-20a84e311b58?auto=format&fit=crop&w=800&q=80',
    status: 'approved',
    is_featured: true,
    is_verified: true,
    submitted_by: 'Utsava Samithi',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'c2b3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    name: 'Balapur Ganesh',
    area: 'Balapur',
    address: 'Balapur Village, Chandrayangutta, Hyderabad, Telangana 500005',
    description: 'Famous for the historic Balapur Laddu auction and the annual grand immersion procession leading to Hussain Sagar.',
    latitude: 17.3204,
    longitude: 78.5135,
    image_url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80',
    status: 'approved',
    is_featured: true,
    is_verified: true,
    submitted_by: 'Balapur Utsav Samithi',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'd3c4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    name: 'Durgam Cheruvu Eco-Friendly Ganesh',
    area: 'Madhapur',
    address: 'Near Durgam Cheruvu Cable Bridge, Hitec City, Hyderabad, Telangana 500081',
    description: 'Eco-friendly Clay Ganesha set against the scenic backdrop of the illuminated Durgam Cheruvu cable-stayed bridge.',
    latitude: 17.4336,
    longitude: 78.3842,
    image_url: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80',
    status: 'approved',
    is_featured: true,
    is_verified: true,
    submitted_by: 'Hitec Cultural Club',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'e4d5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    name: 'Begum Bazaar Fish Market Ganesh',
    area: 'Begum Bazaar',
    address: 'Fish Market Road, Begum Bazaar, Hyderabad, Telangana 500012',
    description: 'Renowned for creative themes, traditional pujas, and majestic decorative lighting in Old City Hyderabad.',
    latitude: 17.3789,
    longitude: 78.4716,
    image_url: 'https://images.unsplash.com/photo-1568219656418-15c329312bf1?auto=format&fit=crop&w=800&q=80',
    status: 'approved',
    is_featured: false,
    is_verified: true,
    submitted_by: 'Begum Bazaar Traders Assoc',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'f5e6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    name: 'Secunderabad Clock Tower Ganapathi',
    area: 'Secunderabad',
    address: 'Clock Tower Circle, Shivaji Nagar, Secunderabad, Telangana 500003',
    description: 'Historic community mandapam attracting devotees across the twin cities with daily cultural programs and maha aarti.',
    latitude: 17.4399,
    longitude: 78.4983,
    image_url: 'https://images.unsplash.com/photo-1567591370504-20a84e311b58?auto=format&fit=crop&w=800&q=80',
    status: 'approved',
    is_featured: false,
    is_verified: true,
    submitted_by: 'Secunderabad Youth Assoc',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

class LocalStore {
  private cache: Mandapam[] = [];
  private initialized = false;

  private ensureDirs(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  private writeQueue: Promise<void> = Promise.resolve();

  private init(): void {
    if (this.initialized) return;
    this.ensureDirs();

    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cache = parsed;
          this.initialized = true;
          return;
        }
      }
    } catch (err) {
      console.warn('[LocalStore] Error reading data file, re-initializing seed:', err);
    }

    // Seed default data
    this.cache = [...SEED_MANDAPAMS];
    this.persistAsync();
    this.initialized = true;
  }

  private persistAsync(): void {
    // Snapshot the current cache to preserve atomic state at mutation time
    const dataToWrite = JSON.stringify(this.cache, null, 2);
    this.writeQueue = this.writeQueue
      .then(() => this._writeToDisk(dataToWrite))
      .catch((err) => {
        console.error('[LocalStore] Failed to persist data to disk:', err);
      });
  }

  private async _writeToDisk(data: string): Promise<void> {
    try {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
      const tempFile = `${DATA_FILE}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
      await fs.promises.writeFile(tempFile, data, 'utf-8');
      await fs.promises.rename(tempFile, DATA_FILE);
    } catch (err) {
      console.error('[LocalStore] Error writing data file to disk:', err);
      throw err;
    }
  }

  /**
   * Allows graceful shutdown to wait for pending persistence writes.
   */
  public async waitForPendingWrites(): Promise<void> {
    await this.writeQueue;
  }

  public async getAll(): Promise<Mandapam[]> {
    this.init();
    return [...this.cache];
  }

  public async getApproved(area?: string, search?: string): Promise<Mandapam[]> {
    this.init();
    let result = this.cache.filter((m) => m.status === 'approved');

    if (area && area !== 'all') {
      const normalizedArea = area.toLowerCase().trim();
      result = result.filter((m) => m.area.toLowerCase().trim() === normalizedArea);
    }

    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          m.area.toLowerCase().includes(term) ||
          (m.address && m.address.toLowerCase().includes(term)) ||
          (m.description && m.description.toLowerCase().includes(term))
      );
    }

    // Sort descending by created_at
    return result.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public async getFeatured(): Promise<Mandapam[]> {
    this.init();
    const approved = this.cache.filter((m) => m.status === 'approved');
    const featured = approved.filter((m) => m.is_featured);

    if (featured.length > 0) {
      return featured.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    // Fallback to top 3 approved
    return approved
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  }

  public async getById(id: string): Promise<Mandapam | null> {
    this.init();
    const item = this.cache.find((m) => m.id === id);
    return item ? { ...item } : null;
  }

  public async insert(item: Mandapam): Promise<Mandapam> {
    this.init();
    // Add to top of cache
    this.cache.unshift(item);
    this.persistAsync();
    return { ...item };
  }

  public async update(id: string, updates: Partial<Mandapam>): Promise<Mandapam | null> {
    this.init();
    const index = this.cache.findIndex((m) => m.id === id);
    if (index === -1) return null;

    this.cache[index] = {
      ...this.cache[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.persistAsync();
    return { ...this.cache[index] };
  }

  public async delete(id: string): Promise<boolean> {
    this.init();
    const index = this.cache.findIndex((m) => m.id === id);
    if (index === -1) return false;

    const [deleted] = this.cache.splice(index, 1);
    this.persistAsync();

    // Clean up local uploaded file asynchronously if exists (missing file does not cause error)
    if (deleted.image_url && deleted.image_url.startsWith('/api/uploads/')) {
      const filename = path.basename(deleted.image_url);
      const filePath = path.join(UPLOADS_DIR, filename);
      fs.promises.unlink(filePath).catch(() => {
        // Missing file or deletion error must NOT cause delete operation to fail
      });
    }

    return true;
  }

  public async saveUploadedFile(buffer: Buffer, originalname: string): Promise<string> {
    this.ensureDirs();
    const ext = path.extname(originalname).toLowerCase() || '.jpg';
    const uniqueId = crypto.randomUUID();
    const filename = `${uniqueId}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    await fs.promises.writeFile(filePath, buffer);
    // Return relative API URL so frontend gets image seamlessly via /api/uploads/submissions/...
    return `/api/uploads/submissions/${filename}`;
  }
}

export const localStore = new LocalStore();
