export interface Category {
    id: string;
    name: string;
    userId: string;
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
    categoryId?: string;
    createdAt?: string;
}

export interface AttendanceRecord {
    id: string;
    labourId: string;
    date: string; // YYYY-MM-DD
    status: 'present' | 'absent' | 'half-day' | 'voided';
    wageCalculated: number;
    voidedAt?: string;
    voidedBy?: string;
}
