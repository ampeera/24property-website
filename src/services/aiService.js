// AI Service using OpenRouter
// สำหรับสร้างคำอธิบายและรูปภาพด้วย AI

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const AI_MODEL = import.meta.env.VITE_AI_MODEL || 'google/gemini-2.0-flash-001';
const IMAGE_MODEL = 'openai/dall-e-3'; // For image generation

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Make request to OpenRouter
const makeAIRequest = async (messages, model = AI_MODEL, options = {}) => {
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'YOUR_OPENROUTER_API_KEY') {
        throw new Error('OpenRouter API Key not configured. Please add VITE_OPENROUTER_API_KEY to .env');
    }

    const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': '24Property Admin'
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
            ...options
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'AI request failed');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
};

// Generate property description in Thai
export const generateDescription = async (propertyData) => {
    const { type, price, area, zone, zoneName, grade, status, title } = propertyData;

    const prompt = `คุณเป็นนักเขียนคำโฆษณาอสังหาริมทรัพย์มืออาชีพ สร้างคำอธิบายภาษาไทยสำหรับประกาศขาย/เช่าอสังหาริมทรัพย์

ข้อมูลทรัพย์สิน:
- ประเภท: ${type || 'ที่ดิน'}
- ชื่อโครงการ: ${title || 'ไม่ระบุ'}
- ราคา: ${price ? price.toLocaleString() : 'ไม่ระบุ'} บาท
- พื้นที่: ${area || 'ไม่ระบุ'}
- โซน: ${zone || ''} - ${zoneName || ''}
- เกรด: ${grade || 'ไม่ระบุ'}
- สถานะ: ${status || 'ขาย'}

กรุณาเขียนคำอธิบายที่:
1. น่าสนใจและดึงดูดผู้ซื้อ/ผู้เช่า
2. กระชับ ความยาว 2-3 ประโยค
3. เน้นจุดเด่นของทรัพย์สิน
4. ใช้ภาษาไทยที่สละสลวย

ตอบเฉพาะคำอธิบายเท่านั้น ไม่ต้องมีคำนำหรือคำอธิบายเพิ่มเติม`;

    const messages = [
        { role: 'user', content: prompt }
    ];

    return makeAIRequest(messages);
};

// Generate catchy title for property
export const generateTitle = async (propertyData) => {
    const { type, zone, zoneName, price, area } = propertyData;

    const prompt = `สร้างชื่อหัวข้อประกาศอสังหาริมทรัพย์ภาษาไทยที่น่าสนใจ

ข้อมูล:
- ประเภท: ${type || 'ที่ดิน'}
- โซน: ${zone || ''} - ${zoneName || ''}
- ราคา: ${price ? price.toLocaleString() : 'ไม่ระบุ'} บาท
- พื้นที่: ${area || 'ไม่ระบุ'}

กรุณาสร้างชื่อหัวข้อที่:
1. สั้นกระชับ (ไม่เกิน 50 ตัวอักษร)
2. จับใจและน่าสนใจ
3. เน้นจุดขาย

ตอบเฉพาะชื่อหัวข้อเท่านั้น`;

    const messages = [
        { role: 'user', content: prompt }
    ];

    return makeAIRequest(messages);
};

// Generate image prompt for property
export const generateImagePrompt = async (propertyData) => {
    const { type, zone, zoneName, description } = propertyData;

    const prompt = `Create an image generation prompt for a Thai real estate property:

Property details:
- Type: ${type || 'land'}
- Zone: ${zone || ''} - ${zoneName || ''}
- Description: ${description || ''}

Create a detailed image prompt that:
1. Describes a professional real estate photo
2. Includes Thai architectural elements if relevant
3. Shows the property in its best light
4. Specifies good lighting and professional photography style

Return only the image prompt, no explanations.`;

    const messages = [
        { role: 'user', content: prompt }
    ];

    return makeAIRequest(messages);
};

// Generate image using DALL-E (via OpenRouter)
export const generateImage = async (prompt, size = '1024x1024') => {
    // Note: For DALL-E 3, we need to use the images API
    // OpenRouter routes to OpenAI's images endpoint

    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'YOUR_OPENROUTER_API_KEY') {
        throw new Error('OpenRouter API Key not configured');
    }

    // Use OpenAI's API directly through OpenRouter for image generation
    const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': '24Property Admin'
        },
        body: JSON.stringify({
            model: IMAGE_MODEL,
            prompt: prompt,
            n: 1,
            size: size,
            quality: 'standard'
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        // If image generation fails, return placeholder URL
        console.warn('Image generation failed, using placeholder:', error);
        return {
            url: `https://placehold.co/1024x768/2d3748/ffffff?text=${encodeURIComponent('Generated Image')}`,
            isPlaceholder: true
        };
    }

    const data = await response.json();
    return {
        url: data.data?.[0]?.url,
        revisedPrompt: data.data?.[0]?.revised_prompt,
        isPlaceholder: false
    };
};

// Improve existing text
export const improveText = async (text, style = 'professional') => {
    const prompt = `ปรับปรุงข้อความภาษาไทยต่อไปนี้ให้${style === 'professional' ? 'ดูเป็นมืออาชีพ' : 'น่าสนใจและดึงดูด'}มากขึ้น:

"${text}"

คงความหมายเดิมไว้ แต่ปรับปรุงการใช้ภาษาให้สละสลวยขึ้น
ตอบเฉพาะข้อความที่ปรับปรุงแล้วเท่านั้น`;

    const messages = [
        { role: 'user', content: prompt }
    ];

    return makeAIRequest(messages);
};

// Translate Thai to English
export const translateToEnglish = async (thaiText) => {
    const prompt = `Translate the following Thai real estate description to English. Keep it professional and suitable for international buyers:

"${thaiText}"

Return only the English translation.`;

    const messages = [
        { role: 'user', content: prompt }
    ];

    return makeAIRequest(messages);
};

// Generate additional details/nearby places
export const generateNearbyArea = async (propertyData) => {
    const { zone, zoneName, mapLink } = propertyData;

    const prompt = `คุณเป็นผู้เชี่ยวชาญพื้นที่ในจังหวัดชลบุรี ประเทศไทย

สร้างข้อมูลพื้นที่ใกล้เคียงสำหรับอสังหาริมทรัพย์ในโซน: ${zone} - ${zoneName}

กรุณาระบุ:
1. สถานที่สำคัญใกล้เคียง (ห้าง, โรงเรียน, โรงพยาบาล)
2. ระยะทางโดยประมาณ
3. ความสะดวกในการเดินทาง

ตอบเป็นข้อความสั้นๆ 2-3 ประโยค เหมาะสำหรับใส่ในประกาศขาย`;

    const messages = [
        { role: 'user', content: prompt }
    ];

    return makeAIRequest(messages);
};

// Auto-generate all content for a property
export const autoGenerateContent = async (propertyData) => {
    try {
        const [title, description, nearby] = await Promise.all([
            generateTitle(propertyData),
            generateDescription(propertyData),
            generateNearbyArea(propertyData)
        ]);

        return {
            title,
            description,
            nearby,
            success: true
        };
    } catch (error) {
        console.error('Auto-generate failed:', error);
        return {
            title: '',
            description: '',
            nearby: '',
            success: false,
            error: error.message
        };
    }
};

export default {
    generateDescription,
    generateTitle,
    generateImagePrompt,
    generateImage,
    improveText,
    translateToEnglish,
    generateNearbyArea,
    autoGenerateContent
};
