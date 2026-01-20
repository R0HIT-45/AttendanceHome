import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// Database types
export interface Database {
    public: {
        Tables: {
            labours: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    aadhaar: string;
                    photo_url: string | null;
                    joining_date: string;
                    daily_wage: number;
                    status: 'active' | 'inactive';
                    designation: string | null;
                    phone: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string;
                    name: string;
                    aadhaar: string;
                    photo_url?: string | null;
                    joining_date: string;
                    daily_wage: number;
                    status?: 'active' | 'inactive';
                    designation?: string | null;
                    phone?: string | null;
                };
                Update: {
                    name?: string;
                    aadhaar?: string;
                    photo_url?: string | null;
                    joining_date?: string;
                    daily_wage?: number;
                    status?: 'active' | 'inactive';
                    designation?: string | null;
                    phone?: string | null;
                };
            };
            attendance_records: {
                Row: {
                    id: string;
                    user_id: string;
                    labour_id: string;
                    date: string;
                    status: 'present' | 'absent' | 'half-day';
                    wage_calculated: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string;
                    labour_id: string;
                    date: string;
                    status: 'present' | 'absent' | 'half-day';
                    wage_calculated: number;
                };
                Update: {
                    status?: 'present' | 'absent' | 'half-day';
                    wage_calculated?: number;
                };
            };
        };
    };
}
