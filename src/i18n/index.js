import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Thai translations
const th = {
    welcome: "โอกาสการลงทุนบนทำเลทอง",
    search_placeholder: "หาที่ดินวิลล่า ใกล้ Tomorrowland...",
    login: "เข้าสู่ระบบ",
    zones: {
        A: "โซน A: โป่ง / Tomorrowland",
        B: "โซน B: จุดพักรถมอเตอร์เวย์",
        C: "โซน C: นิคมอุตสาหกรรม"
    },
    map: {
        roadmap: "แผนที่",
        satellite: "ดาวเทียม",
        hybrid: "ไฮบริด",
        terrain: "ภูมิประเทศ",
        loading: "กำลังโหลดแผนที่...",
        my_location: "ตำแหน่งของฉัน",
        change_type: "เปลี่ยนประเภทแผนที่",
        browser_not_supported: "เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง",
        location_error: "ไม่สามารถระบุตำแหน่งได้"
    },
    search: {
        near_tomorrowland: "ใกล้ Tomorrowland",
        price_under_15m: "ราคา < 15M",
        villa_potential: "ศักยภาพวิลล่า",
        ask_ai: "ถาม AI"
    },
    property: {
        land_info: "ข้อมูลที่ดิน",
        land_size: "ขนาดที่ดิน",
        status: "สถานะ",
        type: "ประเภท",
        grade: "เกรด",
        position: "ตำแหน่ง",
        view_on_google_maps: "ดูตำแหน่งบน Google Maps",
        additional_details: "รายละเอียดเพิ่มเติม",
        nearby_area: "พื้นที่ใกล้เคียง",
        see_future_view: "ดูภาพอนาคต (AI)",
        currency: "บาท",
        per_rai: "บาท/ไร่",
        status_sale: "ขาย",
        status_rent: "เช่า",
        status_sold: "ขายแล้ว",
        status_urgent: "ขายด่วน",
        type_land: "ที่ดิน",
        type_house: "บ้าน",
        type_condo: "คอนโดมิเนียม",
        type_factory: "โรงงาน"
    },
    gallery: {
        current: "ปัจจุบัน",
        future: "AI Future"
    },
    sales: {
        contact_sales: "ติดต่อทีมขาย",
        call: "โทร"
    },
    inquiry: {
        contact_owner: "ติดต่อเจ้าของ",
        sent_success: "ส่งข้อความสำเร็จ!",
        will_contact: "เราจะติดต่อกลับโดยเร็วที่สุด",
        close: "ปิด",
        error_generic: "เกิดข้อผิดพลาด กรุณาลองใหม่",
        name_label: "ชื่อ-นามสกุล",
        name_placeholder: "ชื่อของคุณ",
        email_label: "อีเมล",
        phone_label: "เบอร์โทร",
        message_label: "ข้อความ",
        message_placeholder: "สนใจอยากทราบรายละเอียดเพิ่มเติม...",
        sending: "กำลังส่ง...",
        send: "ส่งข้อความ"
    },
    future_view: {
        title: "AI Potential Vision",
        subtitle: "สร้างจากแนวทางการพัฒนา Zone A",
        current: "ปัจจุบัน",
        future: "อนาคต",
        future_concept: "✨ Future Concept: Luxury Pool Villa",
        current_state: "📍 สภาพปัจจุบัน: ที่ดินว่าง",
        disclaimer: "หมายเหตุ: ภาพนี้สร้างโดย AI เพื่อใช้ในการแสดงผลเท่านั้น ไม่ใช่โปรเจกต์ที่รับประกัน"
    },
    video: {
        title: "วิดีโอรีวิว",
        watch_on_tiktok: "ดูบน TikTok",
        watch_on_facebook: "ดูบน Facebook",
        watch_video: "ดูวิดีโอ"
    },
    zones_dropdown: {
        all: "ทุก Zone"
    }
};

// English translations
const en = {
    welcome: "Investment Opportunities",
    search_placeholder: "Find villas near Tomorrowland...",
    login: "Login",
    zones: {
        A: "Zone A: Pong / Tomorrowland",
        B: "Zone B: Highway Rest Stop",
        C: "Zone C: Industrial Estate"
    },
    map: {
        roadmap: "Map",
        satellite: "Satellite",
        hybrid: "Hybrid",
        terrain: "Terrain",
        loading: "Loading map...",
        my_location: "My Location",
        change_type: "Change map type",
        browser_not_supported: "Your browser does not support geolocation",
        location_error: "Unable to get location"
    },
    search: {
        near_tomorrowland: "Near Tomorrowland",
        price_under_15m: "Price < 15M",
        villa_potential: "Villa Potential",
        ask_ai: "Ask AI"
    },
    property: {
        land_info: "Land Information",
        land_size: "Land Size",
        status: "Status",
        type: "Type",
        grade: "Grade",
        position: "Location",
        view_on_google_maps: "View on Google Maps",
        additional_details: "Additional Details",
        nearby_area: "Nearby Area",
        see_future_view: "See Future View (AI)",
        currency: "THB",
        per_rai: "THB/rai",
        status_sale: "For Sale",
        status_rent: "For Rent",
        status_sold: "Sold",
        status_urgent: "Urgent Sale",
        type_land: "Land",
        type_house: "House",
        type_condo: "Condominium",
        type_factory: "Factory"
    },
    gallery: {
        current: "Current",
        future: "AI Future"
    },
    sales: {
        contact_sales: "Contact Sales Team",
        call: "Call"
    },
    inquiry: {
        contact_owner: "Contact Owner",
        sent_success: "Message Sent!",
        will_contact: "We will contact you back as soon as possible",
        close: "Close",
        error_generic: "An error occurred. Please try again",
        name_label: "Full Name",
        name_placeholder: "Your name",
        email_label: "Email",
        phone_label: "Phone",
        message_label: "Message",
        message_placeholder: "I'm interested in learning more...",
        sending: "Sending...",
        send: "Send Message"
    },
    future_view: {
        title: "AI Potential Vision",
        subtitle: "Generated based on Zone A development guidelines",
        current: "Current",
        future: "Future",
        future_concept: "✨ Future Concept: Luxury Pool Villa",
        current_state: "📍 Current State: Vacant Land",
        disclaimer: "Disclaimer: This image is generated by AI for visualization purposes only. Not a guaranteed project."
    },
    video: {
        title: "Video Review",
        watch_on_tiktok: "Watch on TikTok",
        watch_on_facebook: "Watch on Facebook",
        watch_video: "Watch Video"
    },
    zones_dropdown: {
        all: "All Zones"
    }
};

// Chinese translations
const zh = {
    welcome: "黄金地段投资机会",
    search_placeholder: "寻找 Tomorrowland 附近的别墅用地...",
    login: "登录",
    zones: {
        A: "A区：Pong / Tomorrowland",
        B: "B区：高速公路休息站",
        C: "C区：工业园区"
    },
    map: {
        roadmap: "地图",
        satellite: "卫星",
        hybrid: "混合",
        terrain: "地形",
        loading: "正在加载地图...",
        my_location: "我的位置",
        change_type: "更改地图类型",
        browser_not_supported: "您的浏览器不支持地理定位",
        location_error: "无法获取位置"
    },
    search: {
        near_tomorrowland: "靠近 Tomorrowland",
        price_under_15m: "价格 < 15M",
        villa_potential: "别墅潜力",
        ask_ai: "问AI"
    },
    property: {
        land_info: "土地信息",
        land_size: "土地面积",
        status: "状态",
        type: "类型",
        grade: "等级",
        position: "位置",
        view_on_google_maps: "在 Google Maps 上查看",
        additional_details: "详细信息",
        nearby_area: "附近区域",
        see_future_view: "查看未来视图 (AI)",
        currency: "泰铢",
        per_rai: "泰铢/莱",
        status_sale: "出售",
        status_rent: "出租",
        status_sold: "已售",
        status_urgent: "急售",
        type_land: "土地",
        type_house: "房屋",
        type_condo: "公寓",
        type_factory: "工厂"
    },
    gallery: {
        current: "当前",
        future: "AI 未来"
    },
    sales: {
        contact_sales: "联系销售团队",
        call: "电话"
    },
    inquiry: {
        contact_owner: "联系业主",
        sent_success: "消息已发送！",
        will_contact: "我们会尽快与您联系",
        close: "关闭",
        error_generic: "发生错误，请重试",
        name_label: "姓名",
        name_placeholder: "您的姓名",
        email_label: "电子邮件",
        phone_label: "电话",
        message_label: "留言",
        message_placeholder: "我想了解更多详情...",
        sending: "发送中...",
        send: "发送消息"
    },
    future_view: {
        title: "AI潜力愿景",
        subtitle: "根据A区开发指南生成",
        current: "当前",
        future: "未来",
        future_concept: "✨ 未来概念：豪华泳池别墅",
        current_state: "📍 当前状态：空地",
        disclaimer: "免责声明：此图片由AI生成，仅供可视化参考，不保证项目实现。"
    },
    video: {
        title: "视频评测",
        watch_on_tiktok: "在TikTok观看",
        watch_on_facebook: "在Facebook观看",
        watch_video: "观看视频"
    },
    zones_dropdown: {
        all: "所有区域"
    }
};

// Supported languages list
export const SUPPORTED_LANGUAGES = [
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
];

const resources = {
    th: { translation: th },
    en: { translation: en },
    zh: { translation: zh }
};

// Get saved language or detect from browser
const getSavedLanguage = () => {
    const saved = localStorage.getItem('i18nextLng');
    if (saved && ['th', 'en', 'zh'].includes(saved)) {
        return saved;
    }
    const browserLang = navigator.language.split('-')[0];
    if (['th', 'en', 'zh'].includes(browserLang)) {
        return browserLang;
    }
    return 'th'; // Default to Thai
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: getSavedLanguage(),
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        },
        react: {
            useSuspense: false
        }
    });

// Save language preference when changed
i18n.on('languageChanged', (lng) => {
    localStorage.setItem('i18nextLng', lng);
    document.documentElement.lang = lng;
});

export default i18n;
