export async function callGemini(prompt: string, apiKey: string) {
    if (!apiKey) throw new Error('Missing API key');

    // Allow overriding a comma-separated list of candidate models via GEMINI_MODEL
    const envModels = process.env.GEMINI_MODEL;
    const candidateModels = envModels ? envModels.split(',').map(s => s.trim()).filter(Boolean) : [
        'gemini-2.5-flash',
        'gemini-2.5-pro'
        // 'gemini-2.1',
        // 'gemini-1.0'
    ];

    const maxAttemptsPerModel = 3;

    // small helper for delay
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    const errors: string[] = [];

    for (const model of candidateModels) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt++) {
            try {
                const resp = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { maxOutputTokens: 8192, temperature: 0.2 }
                    }),
                });

                // If overloaded or rate-limited, retry with backoff
                if (resp.status === 429 || resp.status === 503) {
                    const txt = await resp.text();
                    const bodySnippet = txt ? txt.slice(0, 1000) : '<empty body>';
                    const msg = `Model ${model} returned ${resp.status}: ${bodySnippet}`;
                    errors.push(msg);

                    // exponential backoff with jitter
                    const backoff = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
                    const jitter = Math.floor(Math.random() * 300);
                    await delay(backoff + jitter);
                    continue; // retry same model
                }

                if (!resp.ok) {
                    // Non-retryable error (400, 401, 403, 404, etc.)
                    const txt = await resp.text();
                    const bodySnippet = txt ? txt.slice(0, 1000) : '<empty body>';
                    const msg = `Model ${model} returned ${resp.status}: ${bodySnippet}`;
                    errors.push(msg);
                    // Try next model
                    break;
                }

                // Try to parse JSON safely
                const contentType = resp.headers.get('content-type') || '';
                let data: any = null;
                if (contentType.includes('application/json')) {
                    data = await resp.json();
                } else {
                    const txt = await resp.text();
                    // If the service returned plain text, use it directly
                    if (txt) return txt;
                    throw new Error(`Unexpected non-JSON response from model ${model}`);
                }

                // Extract text from response (defensive)
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || data?.candidates?.[0]?.content?.[0]?.text || data?.output?.[0]?.content?.[0]?.text;

                if (typeof text === 'string' && text.length > 0) return text;

                if (data?.promptFeedback?.blockReason) {
                    const reason = data.promptFeedback.blockReason;
                    console.warn(`Gemini response blocked due to: ${reason}`);
                    return `My response was blocked for the following reason: ${reason}. Please try a different prompt.`;
                }

                errors.push(`Model ${model} returned a response but no text could be extracted`);
                // try next model
                break;
            } catch (err: any) {
                const msg = `callGemini attempt ${attempt} for ${model} failed: ${String(err)}`;
                console.error(msg);
                errors.push(msg);

                // If this was the last attempt for this model, break to try next model
                if (attempt === maxAttemptsPerModel) break;

                // backoff before retry
                const backoff = Math.min(500 * Math.pow(2, attempt - 1), 5000);
                const jitter = Math.floor(Math.random() * 200);
                await delay(backoff + jitter);
            }
        }
    }

    // All models failed
    const aggregated = errors.join('\n---\n');
    console.error('All Gemini candidate models failed:', aggregated);
    throw new Error(`All Gemini models failed. Last errors: ${errors.slice(-3).join(' | ')}`);
}