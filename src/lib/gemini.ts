export async function callGemini(prompt: string, apiKey: string) {
    if (!apiKey) {
        throw new Error('Missing API key');
    }

    // Use the modern 'gemini-pro' model
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Updated request body for gemini-pro
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 8192,
                    temperature: 0.2,
                }
            }),
        });

        if (!resp.ok) {
            const txt = await resp.text();
            const bodySnippet = txt ? txt.slice(0, 1000) : '<empty body>';
            throw new Error(`Model ${model} returned ${resp.status}: ${bodySnippet}`);
        }

        const data = await resp.json();

        // Updated response parsing for gemini-pro
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (typeof text === 'string') {
            return text;
        }

        // Handle cases where the response was blocked or empty
        if (data?.promptFeedback?.blockReason) {
            const reason = data.promptFeedback.blockReason;
            console.warn(`Gemini response blocked due to: ${reason}`);
            return `My response was blocked for the following reason: ${reason}. Please try a different prompt.`;
        }

        console.warn('Unexpected Gemini response format:', data);
        return 'Could not extract text from Gemini response.';

    } catch (err) {
        console.error(`callGemini failed:`, err);
        // Re-throw the error to be caught by the API route
        throw err;
    }
}