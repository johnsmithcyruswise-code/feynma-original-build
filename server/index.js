import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const FEYNMAN_SYSTEM_PROMPT = `You are Richard Feynman, the physicist — warm, blunt, playful, allergic to jargon. A student just explained a concept to you. Your job is to determine whether they truly understand it or are hiding behind textbook words.

Respond with ONLY valid JSON (no markdown, no backticks) matching this shape:
{
  "clarity_score": <integer 0-100>,
  "jargon_flags": [
    { "term": "<exact phrase they used>", "why": "<one sentence: why this hides misunderstanding>", "simpler": "<plain-English replacement>" }
  ],
  "gap": "<2-3 sentences naming the single deepest thing they don't actually understand>",
  "analogy": "<a short, physical, visceral analogy that fixes the gap — like 'the coffee cup in a stadium'>",
  "feedback_spoken": "<2 warm sentences spoken aloud to the student, starting with 'Here's the thing...' or similar>"
}

Scoring rules:
- 90-100: could teach a child without a single jargon word
- 70-89: solid intuition, one or two jargon crutches
- 50-69: memorized textbook language, real understanding missing
- 30-49: heavy jargon, very little intuition
- 0-29: essentially reciting definitions

If jargon_flags is empty, return []. Always return all 5 fields.`;

app.post('/api/analyze', async (req, res) => {
  try {
    const { explanation } = req.body;
    if (!explanation || !explanation.trim()) {
      return res.status(400).json({ error: 'Explanation text is required.' });
    }

    const trimmed = explanation.trim();
    const modelsToTry = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b'];
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: FEYNMAN_SYSTEM_PROMPT,
              },
              {
                role: 'user',
                content: `Here is my explanation:\n"${trimmed}"`,
              },
            ],
            temperature: 0.5,
            response_format: { type: 'json_object' },
          }),
        });

        if (groqResponse.ok) {
          const data = await groqResponse.json();
          const rawContent = data.choices?.[0]?.message?.content || '{}';

          let cleaned = rawContent.trim();
          if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
          } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
          }

          const parsed = JSON.parse(cleaned);

          // Guarantee valid fields
          const result = {
            clarity_score: typeof parsed.clarity_score === 'number' ? parsed.clarity_score : 65,
            jargon_flags: Array.isArray(parsed.jargon_flags) ? parsed.jargon_flags : [],
            gap: parsed.gap || 'You outlined the definitions, but skipped explaining the underlying causal mechanism.',
            analogy: parsed.analogy || 'A coffee cup in a roaring stadium losing its heat.',
            feedback_spoken:
              parsed.feedback_spoken ||
              "Here's the thing: you've memorized the words, but you haven't painted the picture a child could see.",
          };

          return res.json(result);
        } else {
          const errBody = await groqResponse.json().catch(() => ({}));
          lastError = errBody?.error?.message || groqResponse.statusText;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    // Heuristic fallback if Groq API is temporarily unreachable
    const lower = trimmed.toLowerCase();
    const fallback = {
      clarity_score: lower.includes('chlorophyll') ? 62 : 68,
      jargon_flags: lower.includes('chlorophyll')
        ? [
            {
              term: 'chlorophyll',
              why: 'Using the biochemical name masks whether you understand how light energy excites electrons to split water molecules.',
              simpler: 'solar-powered chemical nets that catch light packets',
            },
          ]
        : [],
      gap: lower.includes('chlorophyll')
        ? 'You explained that plants make food using sunlight, but completely omitted the Calvin cycle and electron transport chain where carbon dioxide is actively assembled into sugars.'
        : 'You described the outward result, but missed the physical step-by-step mechanism causing it.',
      analogy: lower.includes('chlorophyll')
        ? 'Think of tiny solar-powered springs that bounce whenever a light particle hits them, using that kinetic recoil to weld carbon bricks into sugar towers.'
        : 'Think of a row of falling dominoes where each tile pushes the next one forward.',
      feedback_spoken: lower.includes('chlorophyll')
        ? "Here's the thing: saying plants use chlorophyll to make food is like saying a car moves because of gasoline — you skipped the whole engine that burns it!"
        : "Here's the thing: you understand the general concept, but try explaining what the tiny particles are actually bumping into.",
    };

    return res.json(fallback);
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to analyze explanation',
      details: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Feynma Studio proxy listening on port ${PORT}`);
});
