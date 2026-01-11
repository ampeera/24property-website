import { fetchSheetData, transformToZone } from '../lib/googleSheets';

export const ZoneService = {

    getAllZones: async () => {
        try {
            const data = await fetchSheetData();
            return transformToZone(data);
        } catch (error) {
            console.error('Error fetching zones:', error);
            return [];
        }
    },

    getZoneById: async (id) => {
        try {
            const zones = await ZoneService.getAllZones();
            return zones.find(z => z.id === id) || null;
        } catch (error) {
            console.error('Error fetching zone:', error);
            return null;
        }
    }
};
