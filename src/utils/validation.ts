/**
 * Input Validation Utilities
 * Comprehensive validation functions for labour management system
 */

export interface ValidationError {
    field: string;
    message: string;
}

/**
 * Validate Aadhaar number (12 digits)
 */
export const validateAadhaar = (aadhaar: string): string | null => {
    if (!aadhaar) return 'Aadhaar number is required';
    if (!/^\d{12}$/.test(aadhaar.replace(/\s/g, ''))) {
        return 'Aadhaar must be 12 digits';
    }
    return null;
};

/**
 * Validate phone number (10 digits)
 */
export const validatePhone = (phone: string): string | null => {
    if (!phone) return 'Phone number is required';
    if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) {
        return 'Phone must be 10 digits';
    }
    return null;
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Please enter a valid email address';
    }
    return null;
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required';
    if (password.length < 6) {
        return 'Password must be at least 6 characters';
    }
    if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter';
    }
    if (!/[0-9]/.test(password)) {
        return 'Password must contain at least one number';
    }
    return null;
};

/**
 * Validate daily wage (positive number)
 */
export const validateWage = (wage: number | string): string | null => {
    if (wage === '' || wage === null || wage === undefined) {
        return 'Daily wage is required';
    }
    const numWage = typeof wage === 'string' ? parseFloat(wage) : wage;
    if (isNaN(numWage)) {
        return 'Daily wage must be a valid number';
    }
    if (numWage <= 0) {
        return 'Daily wage must be greater than 0';
    }
    if (numWage > 100000) {
        return 'Daily wage seems too high';
    }
    return null;
};

/**
 * Validate person name (not empty, reasonable length)
 */
export const validateName = (name: string, fieldName: string = 'Name'): string | null => {
    if (!name || !name.trim()) {
        return `${fieldName} is required`;
    }
    if (name.trim().length < 2) {
        return `${fieldName} must be at least 2 characters`;
    }
    if (name.length > 100) {
        return `${fieldName} must be less than 100 characters`;
    }
    return null;
};

/**
 * Validate date (not in future)
 */
export const validateDate = (date: Date | string, fieldName: string = 'Date'): string | null => {
    if (!date) return `${fieldName} is required`;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (dateObj > today) {
        return `${fieldName} cannot be in the future`;
    }
    return null;
};

/**
 * Validate date range (start <= end)
 */
export const validateDateRange = (
    startDate: Date | string,
    endDate: Date | string
): string | null => {
    if (!startDate || !endDate) return 'Both dates are required';
    
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    if (start > end) {
        return 'Start date must be before or equal to end date';
    }
    
    // Check if range is too large (more than 1 year)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
        return 'Date range cannot be more than 1 year';
    }
    
    return null;
};

/**
 * Validate joining date (not in future)
 */
export const validateJoiningDate = (date: Date | string): string | null => {
    const error = validateDate(date, 'Joining date');
    if (error) return error;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    if (dateObj < oneYearAgo && dateObj.getFullYear() < 2020) {
        // Allow older dates, but warn about very old dates
    }
    
    return null;
};

/**
 * Validate attendance data before submission
 */
export const validateAttendanceRecord = (record: {
    labourId?: string;
    date?: Date | string;
    status?: string;
}): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (!record.labourId) {
        errors.push({ field: 'labourId', message: 'Labour is required' });
    }
    
    if (!record.date) {
        errors.push({ field: 'date', message: 'Date is required' });
    } else {
        const dateError = validateDate(record.date, 'Attendance date');
        if (dateError) {
            errors.push({ field: 'date', message: dateError });
        }
    }
    
    if (!record.status || !['present', 'absent', 'half-day'].includes(record.status)) {
        errors.push({ field: 'status', message: 'Valid status is required' });
    }
    
    return errors;
};

/**
 * Validate labour data before creation/update
 */
export const validateLabour = (labour: {
    name?: string;
    aadhaar?: string;
    phone?: string;
    dailyWage?: number;
    joiningDate?: Date | string;
    category?: string;
}): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (labour.name) {
        const nameError = validateName(labour.name);
        if (nameError) errors.push({ field: 'name', message: nameError });
    } else {
        errors.push({ field: 'name', message: 'Name is required' });
    }
    
    if (labour.aadhaar) {
        const aadhaarError = validateAadhaar(labour.aadhaar);
        if (aadhaarError) errors.push({ field: 'aadhaar', message: aadhaarError });
    } else {
        errors.push({ field: 'aadhaar', message: 'Aadhaar is required' });
    }
    
    if (labour.phone) {
        const phoneError = validatePhone(labour.phone);
        if (phoneError) errors.push({ field: 'phone', message: phoneError });
    } else {
        errors.push({ field: 'phone', message: 'Phone is required' });
    }
    
    if (labour.dailyWage !== undefined) {
        const wageError = validateWage(labour.dailyWage);
        if (wageError) errors.push({ field: 'dailyWage', message: wageError });
    } else {
        errors.push({ field: 'dailyWage', message: 'Daily wage is required' });
    }
    
    if (labour.joiningDate) {
        const dateError = validateJoiningDate(labour.joiningDate);
        if (dateError) errors.push({ field: 'joiningDate', message: dateError });
    } else {
        errors.push({ field: 'joiningDate', message: 'Joining date is required' });
    }
    
    if (!labour.category) {
        errors.push({ field: 'category', message: 'Category is required' });
    }
    
    return errors;
};

/**
 * Format and sanitize Aadhaar for display (XXX XXX XXXX where X are last 4 digits)
 */
export const maskAadhaar = (aadhaar: string): string => {
    const digits = aadhaar.replace(/\D/g, '');
    if (digits.length !== 12) return aadhaar;
    return `XXXX XXXX ${digits.slice(-4)}`;
};

/**
 * Format phone number
 */
export const formatPhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) return phone;
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
};

/**
 * Check if all validation errors are present
 */
export const hasErrors = (errors: ValidationError[]): boolean => {
    return errors.length > 0;
};

/**
 * Get first error for a specific field
 */
export const getFieldError = (errors: ValidationError[], fieldName: string): string | null => {
    const error = errors.find(e => e.field === fieldName);
    return error?.message || null;
};
