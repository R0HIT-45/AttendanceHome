export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'labour';
}

export interface Labour {
    id: string;
    name: string;
    aadhaar: string;
    photoUrl?: string;
    joiningDate: string;
    dailyWage: number;
    status: 'active' | 'inactive';
    designation?: string;
    phone?: string;
}

export interface AttendanceRecord {
    id: string;
    labourId: string;
    date: string; // YYYY-MM-DD
    status: 'present' | 'absent' | 'half-day';
    wageCalculated: number;
}
