import { Request, Response } from 'express';

const VALID_ROWS = new Set(['top', 'home', 'bottom']);

// @desc    Generate themed typing sentences via backend Gemini proxy
// @route   POST /api/sentences/generate
// @access  Public (Rate-limited)
export const generateSentencesProxy = async (req: Request, res: Response): Promise<Response> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return res.status(503).json({
        message: 'Server-side AI sentence generation is not configured (GEMINI_API_KEY not set).',
        fallback: true,
      });
    }

    const { rows, minWords, maxWords, count, theme } = req.body || {};

    const cleanRows = Array.isArray(rows)
      ? rows.filter((r): r is string => typeof r === 'string' && VALID_ROWS.has(r))
      : [];
    const minW = Math.min(45, Math.max(2, Number(minWords) || 5));
    const maxW = Math.min(45, Math.max(minW, Number(maxWords) || 12));
    const numCount = Math.min(30, Math.max(1, Number(count) || 15));
    const cleanTheme = typeof theme === 'string' ? theme.replace(/[<>"]/g, '').trim().slice(0, 100) : '';

    const rowRestriction =
      cleanRows.length > 0
        ? `ONLY use words that can be spelled using the letters from these rows: ${cleanRows.join(', ')}.`
        : '';

    const themeRestriction =
      cleanTheme.length > 0
        ? `The sentences MUST be heavily themed around or directly about: "${cleanTheme}".`
        : '';

    const prompt = `Generate ${numCount} random English sentences. Keep each sentence between ${minW} and ${maxW} words long. Use common vocabulary. ${rowRestriction} ${themeRestriction} Output ONLY a valid JSON array of strings, with no markdown formatting.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!response.ok) {
      return res.status(502).json({ message: 'Upstream AI generation failed', fallback: true });
    }

    const data: any = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(502).json({ message: 'Empty AI response', fallback: true });
    }

    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      return res.status(502).json({ message: 'Invalid AI response format', fallback: true });
    }

    const sentences = parsed
      .filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
      .slice(0, numCount);

    return res.json({ sentences });
  } catch (error: any) {
    console.error('Sentence Proxy Error:', error.message);
    return res.status(502).json({ message: 'AI sentence generation unavailable', fallback: true });
  }
};
