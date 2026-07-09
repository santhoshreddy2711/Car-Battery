import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class MockModel<T extends { _id?: string; createdAt?: string; updatedAt?: string }> {
  private filePath: string;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name.toLowerCase()}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  private read(): T[] {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(content) as T[];
    } catch (e) {
      return [];
    }
  }

  private write(data: T[]): void {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private match(item: any, query: any): boolean {
    if (!query) return true;
    for (const key in query) {
      const qVal = query[key];
      const itemVal = item[key];

      // Exact match
      if (typeof qVal !== 'object' || qVal === null || qVal instanceof RegExp) {
        if (qVal instanceof RegExp) {
          if (!qVal.test(String(itemVal || ''))) return false;
        } else if (itemVal !== qVal) {
          return false;
        }
      } else {
        // Operators match ($regex, $gte, $lte, $in, $ne)
        for (const op in qVal) {
          const val = qVal[op];
          if (op === '$regex') {
            const options = qVal['$options'] || '';
            const regex = new RegExp(val, options);
            if (!regex.test(String(itemVal || ''))) return false;
          } else if (op === '$options') {
            // Already handled in $regex
            continue;
          } else if (op === '$gte') {
            if (Number(itemVal) < Number(val)) return false;
          } else if (op === '$lte') {
            if (Number(itemVal) > Number(val)) return false;
          } else if (op === '$gt') {
            if (Number(itemVal) <= Number(val)) return false;
          } else if (op === '$lt') {
            if (Number(itemVal) >= Number(val)) return false;
          } else if (op === '$ne') {
            if (itemVal === val) return false;
          } else if (op === '$in') {
            if (!Array.isArray(val) || !val.includes(itemVal)) return false;
          }
        }
      }
    }
    return true;
  }

  async find(query: any = {}): Promise<T[]> {
    const list = this.read();
    return list.filter(item => this.match(item, query));
  }

  async findOne(query: any = {}): Promise<T | null> {
    const list = this.read();
    const found = list.find(item => this.match(item, query));
    return found || null;
  }

  async findById(id: string): Promise<T | null> {
    const list = this.read();
    const found = list.find(item => item._id === id);
    return found || null;
  }

  async create(data: any): Promise<T> {
    const list = this.read();
    const newItem = {
      _id: Math.random().toString(36).substring(2, 11),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as T;
    list.push(newItem);
    this.write(list);
    return newItem;
  }

  async findByIdAndUpdate(id: string, update: any, options: { new?: boolean } = {}): Promise<T | null> {
    const list = this.read();
    const index = list.findIndex(item => item._id === id);
    if (index === -1) return null;

    // Support Mongoose-like update operators ($inc, $push, etc.)
    let updatedItem = { ...list[index] };
    
    if (update.$inc) {
      for (const key in update.$inc) {
        (updatedItem as any)[key] = (Number((updatedItem as any)[key]) || 0) + Number(update.$inc[key]);
      }
    }
    if (update.$push) {
      for (const key in update.$push) {
        if (!Array.isArray((updatedItem as any)[key])) {
          (updatedItem as any)[key] = [];
        }
        (updatedItem as any)[key].push(update.$push[key]);
      }
    }

    // Clean up update operators for standard direct assignments
    const directUpdates = { ...update };
    delete directUpdates.$inc;
    delete directUpdates.$push;

    updatedItem = {
      ...updatedItem,
      ...directUpdates,
      updatedAt: new Date().toISOString()
    };

    list[index] = updatedItem;
    this.write(list);
    return updatedItem;
  }

  async findByIdAndDelete(id: string): Promise<T | null> {
    const list = this.read();
    const index = list.findIndex(item => item._id === id);
    if (index === -1) return null;
    const removed = list.splice(index, 1)[0];
    this.write(list);
    return removed;
  }

  async countDocuments(query: any = {}): Promise<number> {
    const list = this.read();
    return list.filter(item => this.match(item, query)).length;
  }

  // Helper for batch inserting / bulk seeding
  async insertMany(items: any[]): Promise<T[]> {
    const list = this.read();
    const newItems = items.map(item => ({
      _id: item._id || Math.random().toString(36).substring(2, 11),
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })) as T[];
    list.push(...newItems);
    this.write(list);
    return newItems;
  }
}
