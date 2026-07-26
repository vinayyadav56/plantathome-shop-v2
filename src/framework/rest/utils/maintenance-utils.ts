
import Cookie from 'js-cookie';
import { MAINTENANCE_DETAILS } from './constants';
import { Maintenance } from '@/types';

export function setMaintenanceDetails(isUnderMaintenance: boolean, maintenance: Maintenance | any) {
    Cookie.set(MAINTENANCE_DETAILS, JSON.stringify({ isUnderMaintenance, maintenance }));
}

export function getMaintenanceDetails(): {
    isUnderMaintenance: boolean | null;
    maintenance: Maintenance | null;
} {
    const maintenanceDetails = Cookie.get(MAINTENANCE_DETAILS);
    if (maintenanceDetails) {
        // Corrupt cookie → "unknown", never throw.
        try {
            return JSON.parse(maintenanceDetails);
        } catch {
            return { isUnderMaintenance: null, maintenance: null };
        }
    }
    return { isUnderMaintenance: null, maintenance: null };
}