import type { Labour, AttendanceRecord } from '../types';

const KEYS = {
    LABOURS: 'lams_labours',
    ATTENDANCE: 'lams_attendance',
    USER: 'lams_user'
};


export const storage = {
    getLabours: (): Labour[] => {
        const data = localStorage.getItem(KEYS.LABOURS);
        return data ? JSON.parse(data) : [];
    },

    saveLabour: (labour: Labour) => {
        const labours = storage.getLabours();
        const existingIndex = labours.findIndex(l => l.id === labour.id);
        if (existingIndex >= 0) {
            labours[existingIndex] = labour;
        } else {
            labours.push(labour);
        }
        localStorage.setItem(KEYS.LABOURS, JSON.stringify(labours));
    },

    getAttendance: (): AttendanceRecord[] => {
        const data = localStorage.getItem(KEYS.ATTENDANCE);
        return data ? JSON.parse(data) : [];
    },

    saveAttendance: (record: AttendanceRecord) => {
        const records = storage.getAttendance();
        // remove existing for same labour same day if exists (though UI should prevent)
        const filtered = records.filter(r => !(r.labourId === record.labourId && r.date === record.date));
        filtered.push(record);
        localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(filtered));
    },

    clear: () => {
        localStorage.clear();
    }
};
