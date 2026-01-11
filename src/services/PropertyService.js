import { fetchSheetData, transformToProperty } from '../lib/googleSheets';

export const PropertyService = {

    getAllProperties: async () => {
        try {
            const data = await fetchSheetData();
            return data.map(transformToProperty);
        } catch (error) {
            console.error('Error fetching properties:', error);
            return [];
        }
    },

    getPropertyById: async (id) => {
        try {
            const properties = await PropertyService.getAllProperties();
            return properties.find(p => p.id === id) || null;
        } catch (error) {
            console.error('Error fetching property:', error);
            return null;
        }
    },

    getPropertiesByZone: async (zoneId) => {
        try {
            const properties = await PropertyService.getAllProperties();
            return properties.filter(p => p.zoneId === zoneId);
        } catch (error) {
            console.error('Error fetching properties by zone:', error);
            return [];
        }
    }

    // Note: create/update/delete functions removed
    // Edit data directly in Google Sheets instead
};
