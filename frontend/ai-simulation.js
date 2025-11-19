// ai-simulation.js - AI response simulation for pest/disease detection

// AI response generation
async function generateAIResponse(query) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const queryText = query.text.toLowerCase();
    let response = '';
    
    // Pest detection
    if (queryText.includes('insect') || queryText.includes('pest') || queryText.includes('bug') || 
        queryText.includes('कीट') || queryText.includes('பூச்சி')) {
        response = generatePestResponse(queryText, query.cropType);
    }
    // Disease detection
    else if (queryText.includes('disease') || queryText.includes('fungus') || queryText.includes('rot') || 
             queryText.includes('blight') || queryText.includes('रोग')) {
        response = generateDiseaseResponse(queryText, query.cropType);
    }
    // Nutrient deficiency
    else if (queryText.includes('yellow') || queryText.includes('pale') || queryText.includes('nutrient') || 
             queryText.includes('fertilizer') || queryText.includes('पीला') || queryText.includes('खाद')) {
        response = generateNutrientResponse(queryText, query.cropType);
    }
    // Weather related
    else if (queryText.includes('weather') || queryText.includes('rain') || queryText.includes('drought') || 
             queryText.includes('मौसम') || queryText.includes('बारिश')) {
        response = generateWeatherResponse(queryText, query.cropType);
    }
    // Market related
    else if (queryText.includes('market') || queryText.includes('price') || queryText.includes('sell') || 
             queryText.includes('बाजार') || queryText.includes('भाव')) {
        response = generateMarketResponse(queryText, query.cropType);
    }
    // General advice
    else {
        response = generateGeneralResponse(queryText, query.cropType);
    }
    
    return response;
}

function generatePestResponse(text, crop) {
    const responses = [
        `Based on your description, this appears to be a common pest issue in ${crop || 'crops'}. Preliminary recommendation: Apply neem-based organic pesticide or consult with our officer for specific treatment.`,
        `This could be an infestation issue. Immediate action recommended: Inspect plants carefully, remove affected parts if isolated. Our agricultural officer will provide detailed treatment plan.`,
        `Pest management needed. Quick tip: Use yellow sticky traps to monitor pest population. Detailed advice will be provided by our expert within 24 hours.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

function generateDiseaseResponse(text, crop) {
    const responses = [
        `This shows symptoms of a possible fungal/bacterial disease. Avoid overhead watering and improve air circulation. Our plant pathologist will review and provide specific treatment.`,
        `Disease symptoms detected. Immediate action: Isolate affected plants if possible. Do not apply water on leaves. Expert diagnosis and treatment plan will follow.`,
        `This could be ${crop || 'crop'} disease. Preliminary advice: Remove infected leaves, apply fungicide if available. Detailed prescription coming from our specialist.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

function generateNutrientResponse(text, crop) {
    const responses = [
        `Your ${crop || 'crop'} appears to show nutrient deficiency symptoms. This could be nitrogen, iron, or magnesium deficiency. Soil test recommended. Our soil expert will provide specific fertilizer recommendations.`,
        `Yellowing indicates possible nutrient issues. Quick fix: Apply balanced NPK fertilizer. Our agronomist will review soil conditions and provide customized nutrient management plan.`,
        `Nutrient deficiency detected. Immediate action: Apply compost or organic manure. Detailed fertilizer schedule will be provided by our expert.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

function generateWeatherResponse(text, crop) {
    const responses = [
        `Weather-related query noted. Current recommendation: Monitor weather forecasts regularly. Our meteorology team will provide crop-specific weather advisory.`,
        `Weather impact on ${crop || 'crops'} requires careful management. Immediate: Ensure proper drainage. Detailed weather-based crop management plan coming soon.`,
        `Weather concern acknowledged. Take preventive measures: Cover young plants if frost expected, ensure irrigation during dry spells. Expert advice will follow.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

function generateMarketResponse(text, crop) {
    const responses = [
        `Market query for ${crop || 'your crop'} received. Current trend: Check local mandi prices. Our market analyst will provide selling strategy and price forecast.`,
        `Regarding ${crop || 'crop'} marketing: Consider storage options if prices are low. Detailed market analysis and selling recommendations will be provided.`,
        `Market advisory: Current prices vary by region. Our expert will provide location-specific market intelligence and best selling time.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

function generateGeneralResponse(text, crop) {
    return `Thank you for your query about ${crop || 'agricultural matter'}. Our agricultural officer will review your question and provide expert guidance within 24 hours. In the meantime, ensure basic crop care: adequate watering, weed control, and regular monitoring.`;
}

// Detect urgency
function detectUrgency(text) {
    const urgentKeywords = [
        'emergency', 'urgent', 'dying', 'critical', 'immediately', 'help', 'fast',
        'dying plants', 'crop loss', 'severe', 'spreading', 'rapid',
        'आपात', 'तुरंत', 'मर रहा', 'நெருக்கடி', '即刻'
    ];
    
    const lowerText = text.toLowerCase();
    return urgentKeywords.some(keyword => lowerText.includes(keyword)) ? 'high' : 'normal';
}

// Helper functions for main.js
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getStatusClass(status) {
    const classes = {
        'open': 'bg-warning text-dark',
        'assigned': 'bg-info text-white',
        'resolved': 'bg-success text-white'
    };
    return classes[status] || 'bg-secondary text-white';
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
