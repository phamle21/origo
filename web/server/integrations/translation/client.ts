import { z } from 'zod';

// Free machine translation without an account: Google's public web endpoint first, MyMemory when it
// fails. Both are best-effort services, so every call is bounded and a miss simply yields null.
const GOOGLE_URL = 'https://translate.googleapis.com/translate_a/single';
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const TIMEOUT_MILLISECONDS = 8_000;

// Content language codes the providers spell differently.
const PROVIDER_CODES: Record<string, string> = { zh: 'zh-CN', 'zh-tw': 'zh-TW' };

const googleResponseSchema = z.tuple([z.array(z.tuple([z.string().nullable()], z.unknown()))], z.unknown());
const myMemoryResponseSchema = z.object({ responseStatus: z.coerce.number(), responseData: z.object({ translatedText: z.string() }) });

function toProviderCode(locale: string): string {
  return PROVIDER_CODES[locale] ?? locale;
}

async function translateWithGoogle(text: string, from: string, to: string): Promise<string> {
  const response = await $fetch<unknown>(GOOGLE_URL, {
    query: { client: 'gtx', dt: 't', sl: from, tl: to, q: text },
    timeout: TIMEOUT_MILLISECONDS,
  });

  // The text comes back in sentence pieces.
  return googleResponseSchema
    .parse(response)[0]
    .map(([piece]) => piece ?? '')
    .join('');
}

async function translateWithMyMemory(text: string, from: string, to: string): Promise<string> {
  const response = myMemoryResponseSchema.parse(
    await $fetch<unknown>(MYMEMORY_URL, { query: { q: text, langpair: `${from}|${to}` }, timeout: TIMEOUT_MILLISECONDS }),
  );

  if (response.responseStatus !== 200) {
    throw new Error(`MyMemory answered ${response.responseStatus}`);
  }

  return response.responseData.translatedText;
}

/** Translates one text; resolves to null when no provider could do it. */
export async function translateText(text: string, from: string, to: string): Promise<string | null> {
  const source = toProviderCode(from);
  const target = toProviderCode(to);

  for (const provider of [translateWithGoogle, translateWithMyMemory]) {
    try {
      const translated = (await provider(text, source, target)).trim();

      if (translated) {
        return translated;
      }
    } catch {
      // Try the next provider; the route reports when every language failed.
    }
  }

  return null;
}
