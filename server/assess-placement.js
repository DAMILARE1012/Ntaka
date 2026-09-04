/**
 * POST /assess-writing        { languageId, prompt, response }         -> verdict | null
 * POST /assess-comprehension  { languageId, source, question, answer } -> verdict | null
 * POST /assess-speaking       { languageId, promptId, audio, target }  -> signals | null
 *
 * Groq-backed assessment for the placement test and for Interactive Learning.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  GROQ_API_KEY IS SERVER-ONLY
 * ─────────────────────────────────────────────────────────────────────────────
 *  Same rule as DAILY_API_KEY. Vite inlines every VITE_-prefixed variable into the
 *  public bundle, so VITE_GROQ_API_KEY would hand every visitor your quota.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  WHAT THIS CAN AND CANNOT DO
 * ─────────────────────────────────────────────────────────────────────────────
 *  Writing   Works for any language gpt-oss-20b can read. This is the reliable half.
 *
 *  Speaking  Whisper covers 8 of Ntaka's 25 languages. IGBO IS NOT ONE OF THEM, and
 *            neither is any Nguni, Ghanaian or Senegambian language we teach. For those,
 *            this returns `transcribable: false` and the recording goes to a teacher.
 *            Auto-detecting instead would be worse than nothing: Whisper would transcribe
 *            Igbo as a language it does know and invent fluent, plausible text.
 *
 *            Even where supported, low-resource African languages run 25-35% word error
 *            or worse, so the transcript is used only for coarse signals - how much of the
 *            answer was in the target language, and whether a read-aloud resembles its
 *            target. Pronunciation is never scored here.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  PRIVACY - DO THIS BEFORE SHIPPING
 * ─────────────────────────────────────────────────────────────────────────────
 *  Sending a learner's voice to Groq makes them a sub-processor of personal data under
 *  NDPR and GDPR, and their terms allow files to persist for up to 30 days. You need
 *  explicit consent at the point of recording, a privacy policy naming Groq, and a
 *  retention answer. `consented` below is a hard gate, not a formality.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  FAILURE POLICY
 * ─────────────────────────────────────────────────────────────────────────────
 *  Every path returns null rather than throwing. A learner must never be blocked from
 *  finishing the test because Groq was slow, rate-limited or down; the caller falls back
 *  to the heuristic scoring in lib/placementScoring.js.
 */

import {
  GROQ_MODELS,
  WHISPER_LANGUAGES,
  isTranscribable,
  buildWritingPrompt,
  buildComprehensionPrompt,
  buildSpeakingPrompt,
  parseWritingVerdict,
  parseComprehensionVerdict,
  parseSpeakingVerdict,
  readAloudSimilarity,
} from '../src/lib/groqAssessment.js';

const GROQ_API = 'https://api.groq.com/openai/v1';

/** Free tier is ~30 requests/minute. One retry on 429, then give up quietly. */
const RETRY_STATUSES = new Set([429, 500, 502, 503]);

async function groq(path, { apiKey, body, isForm = false, timeoutMs = 20000, attempt = 0 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${GROQ_API}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      },
      body: isForm ? body : JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      if (RETRY_STATUSES.has(response.status) && attempt < 1) {
        const wait = Number(response.headers.get('retry-after')) * 1000 || 1500;
        await new Promise((r) => setTimeout(r, wait));
        return groq(path, { apiKey, body, isForm, timeoutMs, attempt: attempt + 1 });
      }
      return null;
    }
    return response.json();
  } catch {
    // Aborted, offline, DNS - all the same to the caller.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const messageContent = (completion) => completion?.choices?.[0]?.message?.content ?? null;

/* -------------------------------------------------------------------- writing */

export function createWritingAssessor({ apiKey, model = GROQ_MODELS.chat }) {
  return async function assessWriting({ languageName, prompt, response }) {
    if (!apiKey) return null;
    const text = String(response ?? '').trim();
    // Below this there is nothing to assess and it is not worth a request.
    if (text.length < 8) return null;

    const completion = await groq('/chat/completions', {
      apiKey,
      body: {
        model,
        messages: buildWritingPrompt({ languageName, prompt, response: text }),
        // Deterministic: the same sample should not drift between levels on a retry.
        temperature: 0,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      },
    });

    return parseWritingVerdict(messageContent(completion));
  };
}

/* ------------------------------------------------------------- comprehension */

/**
 * Marks a written answer about a conversation the learner listened to, or a passage they
 * read. Used by Interactive Learning after every listening and reading lesson.
 *
 * Two guards worth keeping. Without marking points there is nothing objective to mark
 * against, so this returns null rather than letting the model invent a rubric. And the
 * comprehension half never touches the learner's CEFR level: understanding a dialogue is
 * evidence about listening, not about the writing that a level describes.
 */
export function createComprehensionAssessor({ apiKey, model = GROQ_MODELS.chat }) {
  return async function assessComprehension({
    languageName,
    sourceKind,
    sourceTranscript,
    question,
    expectedPoints,
    response,
  }) {
    if (!apiKey) return null;

    const text = String(response ?? '').trim();
    if (text.length < 8) return null;
    if (!sourceTranscript || !Array.isArray(expectedPoints) || expectedPoints.length === 0) {
      return null;
    }

    const completion = await groq('/chat/completions', {
      apiKey,
      body: {
        model,
        messages: buildComprehensionPrompt({
          languageName,
          sourceKind,
          sourceTranscript,
          question,
          expectedPoints,
          response: text,
        }),
        // Deterministic: the same answer must not score differently on a retry.
        temperature: 0,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      },
    });

    return parseComprehensionVerdict(messageContent(completion), expectedPoints);
  };
}

/* ------------------------------------------------------------------- speaking */

export function createSpeakingAssessor({
  apiKey,
  chatModel = GROQ_MODELS.chat,
  transcribeModel = GROQ_MODELS.transcribe,
}) {
  return async function assessSpeaking({
    languageId,
    languageName,
    audio,
    filename = 'answer.webm',
    prompt,
    consented,
  }) {
    if (!apiKey) return null;

    // No consent, no third party. This is a gate, not a warning.
    if (!consented) {
      return { transcribable: false, reason: 'no_consent', transcript: null };
    }

    if (!isTranscribable(languageId)) {
      return { transcribable: false, reason: 'language_unsupported', transcript: null };
    }

    const form = new FormData();
    form.append('file', audio, filename);
    form.append('model', transcribeModel);
    // Forcing the language stops Whisper guessing, which is where hallucination starts.
    form.append('language', WHISPER_LANGUAGES[languageId]);
    form.append('temperature', '0');
    form.append('response_format', 'json');

    const transcription = await groq('/audio/transcriptions', {
      apiKey,
      body: form,
      isForm: true,
      timeoutMs: 45000,
    });

    const transcript = transcription?.text?.trim() ?? '';
    if (!transcript) {
      return { transcribable: true, transcript: '', usable: false, reason: 'empty_transcript' };
    }

    const similarity =
      prompt?.kind === 'read-aloud' ? readAloudSimilarity(transcript, prompt.text) : null;

    const completion = await groq('/chat/completions', {
      apiKey,
      body: {
        model: chatModel,
        messages: buildSpeakingPrompt({
          languageName,
          transcript,
          targetText: prompt?.text,
          kind: prompt?.kind,
        }),
        temperature: 0,
        max_tokens: 250,
        response_format: { type: 'json_object' },
      },
    });

    const verdict = parseSpeakingVerdict(messageContent(completion));

    return {
      transcribable: true,
      transcript,
      readAloudSimilarity: similarity,
      verdict,
      usable: verdict?.usable ?? Boolean(transcript),
      // Never a level. See the header.
      scored: false,
      needsHumanReview: true,
      model: transcribeModel,
    };
  };
}

/* -------------------------------------------------------------------------- */
/* Supabase Edge Function entry points. Uncomment when deploying.             */
/* -------------------------------------------------------------------------- */
//
// Deno.serve(async (req) => {
//   const user = await getUserFromAuthHeader(req);
//   if (!user) return new Response('Unauthorized', { status: 401 });
//
//   const { languageId, languageName, prompt, response } = await req.json();
//   const assess = createWritingAssessor({ apiKey: Deno.env.get('GROQ_API_KEY') });
//   const verdict = await assess({ languageName, prompt, response });
//
//   return new Response(JSON.stringify({ verdict }), {
//     headers: { 'Content-Type': 'application/json' },
//   });
// });
