
import fs from 'fs';
import path from 'path';

try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        console.log("FAIL: .env.local does not exist.");
        process.exit(1);
    }

    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(/VITE_GEMINI_API_KEY=(.+)/);

    if (match && match[1] && match[1].trim().length > 5) {
        if (match[1].includes("sua_chave_aqui")) {
            console.log("WARN: .env.local exists but uses placeholder key.");
        } else {
            console.log("PASS: VITE_GEMINI_API_KEY is configured.");
        }
    } else {
        console.log("FAIL: VITE_GEMINI_API_KEY is missing or empty.");
    }
} catch (e) {
    console.log("ERROR: " + e.message);
}
