import { createClient } from '@supabase/supabase-js';
import { MockModel } from '../models/mockDb.js';

let isSupabaseConnected = false;
let supabaseClient: any = null;
const mockModels: Record<string, MockModel<any>> = {};

export async function connectDB() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('No SUPABASE_URL / SUPABASE_KEY found in environment. Using Local File JSON Database.');
    isSupabaseConnected = false;
    return;
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized successfully!');
    isSupabaseConnected = true;
  } catch (error) {
    console.error('Supabase initialization failed. Using Local File JSON Database fallback. Error:', error);
    isSupabaseConnected = false;
  }
}

export function getSupabaseClient() {
  return supabaseClient;
}

export function isSupabaseActive() {
  return isSupabaseConnected;
}

export function getMockModel<T extends { _id?: string; createdAt?: string; updatedAt?: string }>(
  modelName: string
): MockModel<T> {
  if (!mockModels[modelName]) {
    mockModels[modelName] = new MockModel<T>(modelName);
  }
  return mockModels[modelName];
}

export function getDbMode(): string {
  return isSupabaseConnected ? 'Supabase' : 'Local JSON Files';
}
