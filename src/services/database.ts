import { supabase } from '../lib/supabase';
import type { Labour, AttendanceRecord } from '../types';

// Helper to convert DB format to app format
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
});

const mapAttendanceFromDB = (dbRecord: any): AttendanceRecord => ({
    id: dbRecord.id,
    labourId: dbRecord.labour_id,
    date: dbRecord.date,
    status: dbRecord.status,
    wageCalculated: parseFloat(dbRecord.wage_calculated),
});

// Labour Operations
export const database = {
    // Get all labours for current user
    getLabours: async (): Promise<Labour[]> => {
        const { data, error } = await supabase
            .from('labours')
            .select('*')
            .order('created_at', { ascending: false });

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

    // Delete labour
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

    // Create attendance record
    createAttendance: async (record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('attendance_records')
            .insert({
                user_id: user.id,
                labour_id: record.labourId,
                date: record.date,
                status: record.status,
                wage_calculated: record.wageCalculated,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating attendance:', error);
            throw error;
        }

        return mapAttendanceFromDB(data);
    },

    // Get attendance for a specific date
    getAttendanceByDate: async (date: string): Promise<AttendanceRecord[]> => {
        const { data, error } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('date', date);

        if (error) {
            console.error('Error fetching attendance by date:', error);
            throw error;
        }

        return data.map(mapAttendanceFromDB);
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
};
