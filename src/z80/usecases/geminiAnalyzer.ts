import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai';
import type { GenerateContentResult } from '@google/generative-ai';
import type { AnalysisFeedback } from './programAnalyzer';

/**
 * Urutan model yang dicoba. Model pertama yang berhasil dipakai.
 * Model lama (gemini-1.5-*, gemini-2.0-*, gemini-pro) sudah dipensiunkan oleh Google (404),
 * dan alias `gemini-flash-latest` sering menjawab 503 "high demand" — jadi ia ditaruh paling akhir.
 */
const MODELS_TO_TRY = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
];
const MAX_ATTEMPTS_PER_MODEL = 2;
const RETRY_DELAY_MS = 1500;
const REQUEST_TIMEOUT_MS = 30_000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const errorMessage = (e: unknown): string =>
  (e instanceof Error ? e.message : String(e ?? '')).toLowerCase();

const httpStatus = (e: unknown): number | undefined =>
  e instanceof GoogleGenerativeAIFetchError ? e.status : undefined;

/** 404: model sudah dipensiunkan / tidak tersedia untuk API key ini → lanjut ke model berikutnya. */
const isModelUnavailable = (e: unknown): boolean => {
  const msg = errorMessage(e);
  return httpStatus(e) === 404 || msg.includes('not found') || msg.includes('no longer available') || msg.includes('not supported');
};

/** 503 (high demand / overloaded) atau 429 (kuota/rate limit) → sementara, layak dicoba ulang. */
const isServerBusy = (e: unknown): boolean => {
  const status = httpStatus(e);
  const msg = errorMessage(e);
  return status === 503 || status === 429
    || msg.includes('high demand') || msg.includes('overloaded') || msg.includes('unavailable')
    || msg.includes('resource_exhausted') || msg.includes('quota') || msg.includes('rate limit');
};

const isTimeout = (e: unknown): boolean =>
  (e instanceof Error && e.name === 'AbortError') || errorMessage(e).includes('abort');

export interface GeminiResponse {
  markdown: string;
  success: boolean;
}

export async function deepAnalyzeZ80Code(
  code: string,
  localFeedbacks: AnalysisFeedback[],
  apiKey?: string
): Promise<GeminiResponse> {
  const token = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
  if (!token || token === "ISI_API_KEY_ANDA_DI_SINI") {
    return {
      success: false,
      markdown: '🚨 Kunci API Gemini (`VITE_GEMINI_API_KEY`) belum dikonfigurasi pada file `.env`.',
    };
  }

  const systemPrompt = `Anda adalah Asisten Praktikum Sistem Mikroprosesor tingkat pengantar yang suportif.
Tugas Anda adalah meninjau program Z-80 Assembly mahasiswa.
Ikuti 4 aturan mutlak berikut:

Aturan 1 (Scope Materi): Batasi analisis HANYA pada instruksi Z-80 dasar (LD, INC, DEC, DJNZ, HALT, aritmatika/memori dasar). DILARANG membahas instruksi spesifik lanjutan (LDIR, LDDR), manajemen interupsi, stack pointer kompleks, memori vektor, atau mengkritik ketiadaan ORG 0000H kecuali ditanya eksplisit.
Aturan 2 (Deteksi Status): Tentukan langsung apakah ada error fatal/logika. Jika logika kode sejatinya SUDAH BENAR untuk tugas dasar, awali dengan konfirmasi positif dan JANGAN mencari-cari kesalahan opsional.
Aturan 3 (Gaya Komunikasi): Bersikap langsung dan suportif. DILARANG bergaya Socrates atau melempar teka-teki. Jika ada error, tunjukkan barisnya dan berikan solusi perbaikan secara konkret.
Aturan 4 (Struktur Respon): Gunakan urutan baku:
1. Status: [KODE BENAR / TERDAPAT ERROR]
2. Penjelasan Singkat: Jelaskan fungsi kode tersebut secara umum.
3. Catatan: Poin perbaikan konkret jika ada (Maks 2 poin).
4. Penutup: Afirmasi positif singkat.

Pertahankan panjang respon kurang dari 150 kata untuk kasus sederhana.`;

  const feedbackList = localFeedbacks
    .map(fb => `- Baris ${fb.line} (${fb.severity}): ${fb.title} -> ${fb.message}`)
    .join('\n');

  const userPrompt = `Mohon evaluasi kode Z-80 Assembly berikut:

\`\`\`assembly
${code}
\`\`\`

Peringatan Linter (Hanya sebagai konteks tambahan):
${feedbackList || 'Tidak ada peringatan.'}

Berikan respons Anda mengikuti 4 aturan baku.`;

  try {
    const genAI = new GoogleGenerativeAI(token);
    let result: GenerateContentResult | undefined;
    let lastError: unknown;

    for (const modelName of MODELS_TO_TRY) {
      const model = genAI.getGenerativeModel(
        { model: modelName, systemInstruction: systemPrompt },
        { timeout: REQUEST_TIMEOUT_MS }
      );

      // Coba model ini sampai MAX_ATTEMPTS_PER_MODEL kali kalau servernya sedang sibuk (503/429)
      for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL && !result; attempt++) {
        try {
          result = await model.generateContent(userPrompt);
        } catch (e: unknown) {
          lastError = e;
          if (isModelUnavailable(e)) {
            console.warn(`Model ${modelName} tidak tersedia untuk API Key ini, beralih ke model berikutnya...`);
            break;
          }
          if (isServerBusy(e) || isTimeout(e)) {
            const reason = isTimeout(e) ? 'timeout' : 'sedang sibuk';
            if (attempt < MAX_ATTEMPTS_PER_MODEL) {
              console.warn(`Model ${modelName} ${reason} (percobaan ${attempt}/${MAX_ATTEMPTS_PER_MODEL}), mencoba lagi...`);
              await sleep(RETRY_DELAY_MS * attempt);
            } else {
              console.warn(`Model ${modelName} ${reason}, beralih ke model berikutnya...`);
            }
            continue;
          }
          // Error lain (API key salah, request diblokir, dsb.) tidak perlu dicoba ulang
          throw e;
        }
      }
      if (result) break;
    }

    if (!result) {
      if (isServerBusy(lastError) || isTimeout(lastError)) {
        return {
          success: false,
          markdown: '⏳ Server AI Google Gemini sedang sibuk (high demand) di semua model yang dicoba. Ini biasanya sementara — silakan coba lagi dalam beberapa saat.',
        };
      }
      throw new Error('Semua versi model Gemini diblokir atau tidak tersedia untuk API Key Anda.');
    }

    const response = await result.response;
    return { success: true, markdown: response.text() };

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return {
      success: false,
      markdown: `Gagal menghubungi API Google Gemini. Pesan Error: ${error.message || String(error)}`,
    };
  }
}
