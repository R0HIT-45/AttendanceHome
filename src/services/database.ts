import { supabase } from '../lib/supabase';
import type { Labour, AttendanceRecord, Category } from '../types';

const mapCategoryFromDB = (dbCategory: any): Category => ({
    id: dbCategory.id,
    name: dbCategory.name,
    userId: dbCategory.user_id,
});

const mapLabourFromDB = (dbLabour: any): Labour => ({
    id: dbLabour.id,
    name: dbLabour.name,
    aadhaar: dbLabour.aadhaar,
    photoUrl: dbLabour.photo_url,
    joiningDate: dbLabour.joining_date,
    dailyWage: parseFloat(dbLabour.daily_wage),
    status: dbLabour.status,
    designation: dbLabour.designation,
    phone: dbLabour.phone,
    categoryId: dbLabour.category_id,
    createdAt: dbLabour.created_at,
});

const mapAttendanceFromDB = (dbRecord: any): AttendanceRecord => ({
    id: dbRecord.id,
    labourId: dbRecord.labour_id,
    date: dbRecord.date,
    status: dbRecord.status,
    wageCalculated: parseFloat(dbRecord.wage_calculated),
    voidedAt: dbRecord.voided_at,
    voidedBy: dbRecord.voided_by,
});

// Labour Operations
export const database = {
    // Get all labours for current user
    getLabours: async (): Promise<Labour[]> => {
        const { data, error } = await supabase
            .from('labours')
            .select('*')
            .order('name', { ascending: true }); // Alphabetical sorting

        if (error) {
            console.error('Error fetching labours:', error);
            throw error;
        }

        return data.map(mapLabourFromDB);
    },

    // Create new labour
    createLabour: async (labour: Omit<Labour, 'id'>): Promise<Labour> => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('labours')
            .insert({
                user_id: user.id,
                name: labour.name,
                aadhaar: labour.aadhaar,
                photo_url: labour.photoUrl,
                joining_date: labour.joiningDate,
                daily_wage: labour.dailyWage,
                status: labour.status,
                designation: labour.designation,
                phone: labour.phone,
                category_id: labour.categoryId,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating labour:', error);
            throw error;
        }

        return mapLabourFromDB(data);
    },

    // Update labour
    updateLabour: async (id: string, updates: Partial<Labour>): Promise<Labour> => {
        const updateData: any = {};
        if (updates.name) updateData.name = updates.name;
        if (updates.aadhaar) updateData.aadhaar = updates.aadhaar;
        if (updates.photoUrl !== undefined) updateData.photo_url = updates.photoUrl;
        if (updates.joiningDate) updateData.joining_date = updates.joiningDate;
        if (updates.dailyWage !== undefined) updateData.daily_wage = updates.dailyWage;
        if (updates.status) updateData.status = updates.status;
        if (updates.designation !== undefined) updateData.designation = updates.designation;
        if (updates.phone !== undefined) updateData.phone = updates.phone;
        if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('labours')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating labour:', error);
            throw error;
        }

        return mapLabourFromDB(data);
    },

    deleteLabour: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('labours')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting labour:', error);
            throw error;
        }
    },

    // Attendance Operations
    getAttendance: async (filters?: { startDate?: string; endDate?: string }): Promise<AttendanceRecord[]> => {
        let query = supabase
            .from('attendance_records')
            .select('*')
            .neq('status', 'voided') // Default to non-voided for general reports
            .order('date', { ascending: false });

        if (filters?.startDate) {
            query = query.gte('date', filters.startDate);
        }
        if (filters?.endDate) {
            query = query.lte('date', filters.endDate);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching attendance:', error);
            throw error;
        }

        return data.map(mapAttendanceFromDB);
    },

    // Bulk create/update attendance records
    bulkCreateAttendance: async (records: Omit<AttendanceRecord, 'id'>[]): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const insertData = records.map(record => ({
            user_id: user.id,
            labour_id: record.labourId,
            date: record.date,
            status: record.status,
            wage_calculated: record.wageCalculated,
        }));

        const { error } = await supabase
            .from('attendance_records')
            .upsert(insertData, {
                onConflict: 'labour_id,date'
            });

        if (error) {
            console.error('Error in bulk attendance:', error);
            throw error;
        }
    },

    // Get attendance for a specific date
    getAttendanceByDate: async (date: string): Promise<AttendanceRecord[]> => {
        const { data, error } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('date', date)
            .neq('status', 'voided');

        if (error) {
            console.error('Error fetching attendance by date:', error);
            throw error;
        }

        return data.map(mapAttendanceFromDB);
    },

    // Analytics: Get attendance percentages for the last N days
    getAttendanceTrends: async (days: number = 30): Promise<any[]> => {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { data: labours } = await supabase.from('labours').select('id').eq('status', 'active');
        const totalActive = labours?.length || 0;

        const { data, error } = await supabase
            .from('attendance_records')
            .select('date, status, labour_id')
            .gte('date', startDate)
            .lte('date', endDate);

        if (error) throw error;

        // Unique workers present per day
        const grouped = data.reduce((acc: any, curr) => {
            if (!acc[curr.date]) acc[curr.date] = new Set();
            if (curr.status === 'present' || curr.status === 'half-day') {
                acc[curr.date].add(curr.labour_id);
            }
            return acc;
        }, {});

        // Fill missing dates and calculate percentage
        const trends = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const uniquePresent = grouped[d]?.size || 0;
            trends.push({
                date: d.slice(5), // MM-DD
                fullDate: d,
                percentage: totalActive > 0 ? Math.round((uniquePresent / totalActive) * 100) : 0,
                present: uniquePresent,
                total: totalActive
            });
        }

        return trends;
    },

    // Analytics: Get daily costs for the last N days
    getCostAnalysis: async (days: number = 30): Promise<any[]> => {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('attendance_records')
            .select('date, wage_calculated')
            .gte('date', startDate)
            .lte('date', endDate);

        if (error) throw error;

        const grouped = data.reduce((acc: any, curr) => {
            if (!acc[curr.date]) acc[curr.date] = 0;
            acc[curr.date] += parseFloat(curr.wage_calculated);
            return acc;
        }, {});

        const analysis = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            analysis.push({
                date: d.slice(5),
                fullDate: d,
                cost: Math.round(grouped[d] || 0)
            });
        }

        return analysis;
    },

    // Real-time subscriptions
    subscribeToLabours: (callback: (labours: Labour[]) => void) => {
        const subscription = supabase
            .channel('labours_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'labours',
                },
                async () => {
                    // Refetch data when changes occur
                    const labours = await database.getLabours();
                    callback(labours);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    },

    subscribeToAttendance: (callback: (records: AttendanceRecord[]) => void) => {
        const subscription = supabase
            .channel('attendance_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'attendance_records',
                },
                async () => {
                    const records = await database.getAttendance();
                    callback(records);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    },

    // Category Operations
    getCategories: async (): Promise<Category[]> => {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching categories:', error);
            // If the table doesn't exist yet (42P01) or isn't in cache (PGRST205),
            // return empty array to prevent entire page failure.
            if (error.code === '42P01' || error.code === 'PGRST205') return [];
            throw error;
        }

        return (data || []).map(mapCategoryFromDB);
    },

    createCategory: async (name: string): Promise<Category> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('categories')
            .insert({
                user_id: user.id,
                name: name,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating category:', error);
            throw error;
        }

        return mapCategoryFromDB(data);
    },

    deleteCategory: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    },

    deleteAttendanceRecord: async (id: string): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('attendance_records')
            .update({
                status: 'voided',
                wage_calculated: 0,
                voided_at: new Date().toISOString(),
                voided_by: user.id
            })
            .eq('id', id);

        if (error) {
            console.error('Error voiding attendance record:', error);
            throw error;
        }
    },

    // Admin only: Get full audit history (including voided)
    getAttendanceAuditHistory: async (labourId: string): Promise<AttendanceRecord[]> => {
        const { data, error } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('labour_id', labourId)
            .order('date', { ascending: false });

        if (error) throw error;
        return data.map(mapAttendanceFromDB);
    },
};
