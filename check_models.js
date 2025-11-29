// Load environment variables
const fs = require('fs');
const path = require('path');
const dotenvPath = path.resolve(process.cwd(), '.env');
const envConfig = require('dotenv').parse(fs.readFileSync(dotenvPath));

const apiKey = envConfig.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ No API Key found in .env file!");
    process.exit(1);
}

console.log("🔍 Checking available Gemini models for your API Key...");

async function checkModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            console.error("❌ API Error:", data.error.message);
            return;
        }

        console.log("\n✅ AVAILABLE MODELS:");
        // Filter only the ones that generate content
        const models = data.models
            .filter(m => m.supportedGenerationMethods.includes("generateContent"))
            .map(m => m.name.replace("models/", "")); // Clean up the name
            
        models.forEach(model => console.log(`   • ${model}`));
        
        console.log("\n👉 RECOMMENDATION: Pick one of the above for your actions.ts file.");

    } catch (error) {
        console.error("Network Error:", error);
    }
}

checkModels();