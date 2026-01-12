// Google Sheets Service
// ดึงข้อมูลจาก Google Sheets ที่ publish เป็น CSV

const SHEET_ID = '1Js3Lsphz2VzofszRq1ghLXB4d2INBmiDIWHtXdgKvRk';
const SHEET_GID = '681312581';

// URL สำหรับดึงข้อมูลแบบ CSV
const getSheetUrl = () => {
    return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
};

// Cache for data
let cachedData = null;
let cacheTime = null;
const CACHE_DURATION = 1 * 60 * 1000; // 1 minute (reduced for faster updates)

// Google Drive Folder for property images
const DRIVE_IMAGE_MAP = {
    // Legacy mapping if needed, or rely on URL columns
};

const DRIVE_MOCKUP_MAP = {};

// Helper to convert Google Drive share link to direct image URL
const convertDriveUrlToImage = (url) => {
    if (!url) return null;

    // Extract file ID
    const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /id=([a-zA-Z0-9_-]+)/,
        /\/d\/([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return `https://lh3.googleusercontent.com/d/${match[1]}`;
        }
    }

    return url;
};

// Parse CSV to array of objects
const parseCSV = (csv) => {
    const lines = csv.split('\n');
    if (lines.length < 2) return [];

    // Parse header (remove quotes and trim)
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim().replace(/^"|"$/g, ''));

        const obj = {};
        headers.forEach((header, idx) => {
            obj[header] = values[idx] || '';
        });

        data.push(obj);
    }

    return data;
};

// Fetch data from Google Sheets
export const fetchSheetData = async (forceRefresh = false) => {
    if (!forceRefresh && cachedData && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
        return cachedData;
    }

    try {
        const response = await fetch(getSheetUrl());
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csv = await response.text();
        const data = parseCSV(csv);

        cachedData = data;
        cacheTime = Date.now();

        return data;
    } catch (error) {
        console.error('Error fetching Google Sheets data:', error);
        return cachedData || [];
    }
};

// Format Thai land area
const formatLandArea = (rai, ngan, wah) => {
    const parts = [];
    if (parseInt(rai) > 0) parts.push(`${rai} ไร่`);
    if (parseInt(ngan) > 0) parts.push(`${ngan} งาน`);
    if (parseInt(wah) > 0 || parseFloat(wah) > 0) parts.push(`${wah} ตร.ว.`);
    return parts.length > 0 ? parts.join(' ') : '-';
};

// Format price
const formatPrice = (price) => {
    const num = parseFloat(price) || 0;
    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)} ล้านบาท`;
    }
    return `${num.toLocaleString()} บาท`;
};

// Map Thai Type to Internal Type (4 Groups)
const mapType = (thaiType) => {
    if (!thaiType) return 'land';
    const t = thaiType.trim();

    // 1. ที่ดิน (Land)
    if (t.includes('ที่ดิน')) return 'land';

    // 2. ที่อยู่อาศัย (Residential)
    if (t.includes('บ้าน') || t.includes('คอนโด') || t.includes('ทาวน์') || t.includes('อพาร์ต') || t.includes('อาคารพาณิชย์') || t === 'ที่อยู่อาศัย') return 'residential';

    // 3. อุตสาหกรรม (Industrial)
    if (t.includes('โรงงาน') || t.includes('โกดัง') || t.includes('คลัง') || t === 'อุตสาหกรรม') return 'industrial';

    // 4. พาณิชยกรรม (Commercial)
    if (t.includes('พาณิชย์') || t === 'พาณิชยกรรม' || t.includes('ออฟฟิศ') || t.includes('สำนักงาน')) return 'commercial';

    return 'land'; // Default
};

// Map Thai Status to Internal Status
const mapStatus = (thaiStatus) => {
    const map = {
        'ขาย': 'available',
        'เช่า': 'rent',
        'ขายแล้ว': 'sold',
        'จองแล้ว': 'reserved'
    };
    return map[thaiStatus] || 'available';
};

// Extract coordinates from row data
const extractCoordinates = (row) => {
    let lat = parseFloat(row['ละติจูด'] || row['Latitude'] || 0);
    let lng = parseFloat(row['ลองจิจูด'] || row['Longitude'] || 0);

    const mapLink = row['พิกัด'] || row['ลิงก์แผนที่'] || row['Google Map Link'] || '';
    if ((lat === 0 || lng === 0) && mapLink) {
        // Pattern 1: @lat,lng format (standard Google Maps URL)
        // Example: https://www.google.com/maps/place/.../@12.950744,100.9835819,17z/...
        let match = mapLink.match(/@([\d.-]+),([\d.-]+)/);
        if (match) {
            lat = parseFloat(match[1]);
            lng = parseFloat(match[2]);
        }

        // Pattern 2: !3d{lat}!4d{lng} format (embedded/data format)
        // Example: m2!1e3!4b1!4m4!3m3!8m2!3d12.950744!4d100.9835819
        if (lat === 0 || lng === 0) {
            match = mapLink.match(/!3d([\d.-]+)!4d([\d.-]+)/);
            if (match) {
                lat = parseFloat(match[1]);
                lng = parseFloat(match[2]);
            }
        }

        // Pattern 3: ?q=lat,lng format (query parameter)
        // Example: https://www.google.com/maps?q=12.950744,100.9835819
        if (lat === 0 || lng === 0) {
            match = mapLink.match(/[?&]q=([\d.-]+),([\d.-]+)/);
            if (match) {
                lat = parseFloat(match[1]);
                lng = parseFloat(match[2]);
            }
        }

        // Pattern 4: /maps/@lat,lng or place/.../@lat,lng format
        // Example: https://www.google.com/maps/@12.950744,100.9835819,17z
        if (lat === 0 || lng === 0) {
            match = mapLink.match(/\/maps\/@([\d.-]+),([\d.-]+)/);
            if (match) {
                lat = parseFloat(match[1]);
                lng = parseFloat(match[2]);
            }
        }

        // Pattern 5: ll=lat,lng format
        // Example: https://www.google.com/maps/...?ll=12.950744,100.9835819
        if (lat === 0 || lng === 0) {
            match = mapLink.match(/[?&]ll=([\d.-]+),([\d.-]+)/);
            if (match) {
                lat = parseFloat(match[1]);
                lng = parseFloat(match[2]);
            }
        }

        // Pattern 6: sll=lat,lng format
        if (lat === 0 || lng === 0) {
            match = mapLink.match(/[?&]sll=([\d.-]+),([\d.-]+)/);
            if (match) {
                lat = parseFloat(match[1]);
                lng = parseFloat(match[2]);
            }
        }

        // Pattern 7: Simple coordinate format (just lat,lng)
        // Example: 12.950744,100.9835819
        if (lat === 0 || lng === 0) {
            match = mapLink.match(/^([\d.-]+),([\d.-]+)$/);
            if (match) {
                lat = parseFloat(match[1]);
                lng = parseFloat(match[2]);
            }
        }

        // Pattern 8: DMS format (Degrees, Minutes, Seconds)
        // Example: 12°57'02.7"N 100°59'00.9"E
        if (lat === 0 || lng === 0) {
            try {
                const decoded = decodeURIComponent(mapLink);
                const dmsMatch = decoded.match(/([\d.]+)[°]([\d.]+)'([\d.]+)"([NS])[\s+]*([\d.]+)[°]([\d.]+)'([\d.]+)"([EW])/);
                if (dmsMatch) {
                    lat = parseFloat(dmsMatch[1]) + parseFloat(dmsMatch[2]) / 60 + parseFloat(dmsMatch[3]) / 3600;
                    if (dmsMatch[4] === 'S') lat = -lat;
                    lng = parseFloat(dmsMatch[5]) + parseFloat(dmsMatch[6]) / 60 + parseFloat(dmsMatch[7]) / 3600;
                    if (dmsMatch[8] === 'W') lng = -lng;
                }
            } catch (e) { }
        }

        // Pattern 9: !8m2!3d{lat}!4d{lng} format (alternate data format)
        if (lat === 0 || lng === 0) {
            match = mapLink.match(/!8m2!3d([\d.-]+)!4d([\d.-]+)/);
            if (match) {
                lat = parseFloat(match[1]);
                lng = parseFloat(match[2]);
            }
        }
    }

    // Validate coordinates are in Thailand range (roughly)
    if (lat !== 0 && lng !== 0) {
        // Thailand bounds: lat 5.5-20.5, lng 97.5-105.5
        if (lat < 5 || lat > 21 || lng < 97 || lng > 106) {
            console.warn(`Coordinates outside Thailand: ${lat}, ${lng} - from link: ${mapLink}`);
        }
    }

    return { lat, lng };
};

// Transform raw data to property format
export const transformToProperty = (row) => {
    // Required fields: Use ID column (รหัส)
    const propertyId = row['รหัส'] || row['ID'] || row['id'] || Math.random().toString(36).substr(2, 9);

    // Images - process Google Drive URLs
    const processImg = (url) => convertDriveUrlToImage(url) || '';

    // Cover image
    const coverImage = processImg(row['url รูปภาพปก'] || row['รูปปก'] || row['Cover Image'] || '');

    // Mockup image
    const mockupImage = processImg(row['url รูปภาพจำลอง'] || row['รูปจำลอง'] || '');

    // Collect all images
    const images = [];
    if (coverImage) images.push(coverImage);
    if (mockupImage) images.push(mockupImage);

    // Additional images (url รูปภาพ 2 through url รูปภาพ 9)
    for (let i = 2; i <= 9; i++) {
        const imgUrl = row[`url รูปภาพ ${i}`] || row[`รูป${i}`];
        if (imgUrl) {
            const processed = processImg(imgUrl);
            if (processed) images.push(processed);
        }
    }

    const type = mapType(row['ประเภท'] || row['Type']);

    // Extract coordinates using helper
    const { lat, lng } = extractCoordinates(row);
    const mapLink = row['พิกัด'] || row['ลิงก์แผนที่'] || row['Google Map Link'] || '';

    // Land area - note: sheet uses ตรว not ตร.ว.
    const wahValue = row['ตรว'] || row['ตร.ว.'] || row['วา'] || 0;

    return {
        id: propertyId,
        zoneId: row['โซน'] || row['Zone'] || '',
        zoneName: row['ชื่อโซน'] || '',
        zoneIcon: row['ไอคอนโซน'] || '📍',
        grade: row['เกรด'] || row['Grade'] || '',
        type: type,
        typeLabel: row['ประเภท'] || '',
        status: mapStatus(row['สถานะ'] || row['Status']),
        statusLabel: row['สถานะ'] || '',
        title: {
            th: row['ชื่อโครงการ'] || row['Title'] || '',
            en: row['ชื่อโครงการ (EN)'] || row['Title (EN)'] || row['ชื่อโครงการ'] || row['Title'] || '',
            zh: row['ชื่อโครงการ (ZH)'] || row['Title (ZH)'] || row['ชื่อโครงการ'] || row['Title'] || ''
        },
        price: parseFloat((row['ราคา'] || row['Price'] || '0').replace(/,/g, '')),
        priceFormatted: formatPrice((row['ราคา'] || row['Price'] || '0').replace(/,/g, '')),
        landArea: {
            rai: parseInt(row['ไร่'] || 0),
            ngan: parseInt(row['งาน'] || 0),
            wah: parseFloat(wahValue),
            formatted: formatLandArea(row['ไร่'] || 0, row['งาน'] || 0, wahValue)
        },
        // Calculate price per rai (convert ngan and wah to rai for accurate calculation)
        pricePerRai: (() => {
            const price = parseFloat((row['ราคา'] || row['Price'] || '0').replace(/,/g, ''));
            const rai = parseInt(row['ไร่'] || 0);
            const ngan = parseInt(row['งาน'] || 0);
            const wah = parseFloat(wahValue);
            // Total rai = rai + (ngan/4) + (wah/400)
            const totalRai = rai + (ngan / 4) + (wah / 400);
            if (totalRai > 0) {
                return Math.round(price / totalRai); // No decimals
            }
            return 0;
        })(),
        description: {
            th: row['รายละเอียด'] || row['Description'] || '',
            en: row['รายละเอียด (EN)'] || row['Description (EN)'] || row['รายละเอียด'] || row['Description'] || '',
            zh: row['รายละเอียด (ZH)'] || row['Description (ZH)'] || row['รายละเอียด'] || row['Description'] || ''
        },
        additionalDescription: {
            th: row['รายละเอียด เพิ่มเติม'] || '',
            en: row['รายละเอียด เพิ่มเติม (EN)'] || row['รายละเอียด เพิ่มเติม'] || '',
            zh: row['รายละเอียด เพิ่มเติม (ZH)'] || row['รายละเอียด เพิ่มเติม'] || ''
        },
        nearbyArea: {
            th: row['พื้นที่ใกล้เคียง'] || '',
            en: row['พื้นที่ใกล้เคียง (EN)'] || row['พื้นที่ใกล้เคียง'] || '',
            zh: row['พื้นที่ใกล้เคียง (ZH)'] || row['พื้นที่ใกล้เคียง'] || ''
        },
        position: { lat, lng },
        mapLink: mapLink,
        currentImage: coverImage,
        mockupImage: mockupImage,
        images: images,
        videoUrl: row['Video Link'] || row['วิดีโอ'] || '',
        province: row['จังหวัด'] || 'Chonburi'
    };
};

export const transformToZone = (data) => {
    const zonesMap = new Map();
    const zoneProperties = new Map(); // Track properties per zone for center calculation

    // Default center for Chonburi, Thailand
    const defaultCenter = { lat: 13.1667, lng: 100.9833 };

    data.forEach(row => {
        const zoneId = row['โซน'] || row['Zone'];
        const zoneName = row['ชื่อโซน'] || zoneId;
        const zoneIcon = row['ไอคอนโซน'] || '📍';

        if (!zoneId) return;

        // Initialize zone if not exists
        if (!zonesMap.has(zoneId)) {
            zonesMap.set(zoneId, {
                id: zoneId,
                name: zoneName,
                description: `Zone ${zoneId} - ${zoneName}`,
                icon: zoneIcon,
                center: null,
                zoom: 13
            });
            zoneProperties.set(zoneId, []);
        }

        // Extract coordinates using helper
        const { lat, lng } = extractCoordinates(row);

        if (lat !== 0 && lng !== 0) {
            zoneProperties.get(zoneId).push({ lat, lng });
        }
    });

    // Calculate center for each zone
    zonesMap.forEach((zone, zoneId) => {
        const props = zoneProperties.get(zoneId);
        if (props && props.length > 0) {
            const avgLat = props.reduce((sum, p) => sum + p.lat, 0) / props.length;
            const avgLng = props.reduce((sum, p) => sum + p.lng, 0) / props.length;
            zone.center = { lat: avgLat, lng: avgLng };
        } else {
            zone.center = defaultCenter;
        }
    });

    return Array.from(zonesMap.values());
};

