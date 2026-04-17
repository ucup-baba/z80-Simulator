import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalysisFeedback } from './programAnalyzer';

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
    const modelsToTry = ['gemini-flash-latest', 'gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-1.5-pro', 'gemini-pro'];
    let result;
    
    for (const modelName of modelsToTry) {
      try {
        if (modelName === 'gemini-pro') {
          // Gemini Pro 1.0 does not support native systemInstruction
          const model = genAI.getGenerativeModel({ model: modelName });
          result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
        } else {
          const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: systemPrompt });
          result = await model.generateContent(userPrompt);
        }
        break; // Stop looping once a model succeeds
      } catch (e: any) {
        if (e.message?.includes('not found') || e.message?.includes('supported')) {
          // Proceed to check the next older model
          console.warn(`Model ${modelName} tidak didukung oleh API Key ini, beralih ke model berikutnya...`);
          continue;
        } else {
          // Throw real errors (like network/quota issues)
          throw e;
        }
      }
    }

    if (!result) {
      throw new Error("Semua versi model Gemini diblokir atau tidak tersedia untuk API Key Anda.");
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
