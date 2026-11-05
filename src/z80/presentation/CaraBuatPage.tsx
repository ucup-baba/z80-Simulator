import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Bot, Camera, Check, ChevronDown, ClipboardCheck, Code2, Copy,
  Cpu, Database, GitBranch, Globe, Lightbulb, Rocket, Search, Sparkles, TestTube2, Wrench,
} from 'lucide-react';
import { useTheme } from './ThemeContext';

/**
 * Halaman "Di Balik Layar" (/cara-buat atau ?cara-buat): cerita cara simulator
 * ini dibuat, untuk peserta semhas yang ingin membuat aplikasi serupa.
 * Setiap bagian ringkas di awal dan bisa diklik untuk detailnya.
 */

type IconType = React.FC<{ className?: string }>;

interface Step {
  icon: IconType;
  title: string;
  short: string;
  points: string[];
  tip: string;
}

const STEPS: Step[] = [
  {
    icon: Search,
    title: 'Pilih software acuan',
    short: 'Tentukan software yang fiturnya mau dibuat ulang.',
    points: [
      'Acuan simulator ini adalah OshonSoft Z80 Simulator IDE, yang dipakai di perkuliahan.',
      'Buat tabel fitur: register, flag, memori 64 KB, step-by-step, breakpoint, dan seterusnya.',
      'Tandai mana fitur inti (wajib ada) dan mana tambahan (misalnya Asisten AI, mode HP).',
    ],
    tip: 'Tabel perbandingan fitur sekaligus jadi bahan Bab analisis kebutuhan di skripsi.',
  },
  {
    icon: Camera,
    title: 'Dokumentasi dengan tangkapan layar',
    short: 'Rekam tampilan dan perilaku software acuan.',
    points: [
      'Screenshot setiap jendela: editor assembly, panel register, flag, memori, dan log.',
      'Jalankan program contoh, lalu screenshot sebelum dan sesudah tiap instruksi.',
      'Tulis perilakunya dengan kalimat, misalnya "ADD A,B dengan A=FFH, B=02H menghasilkan A=01H dan Carry=1".',
    ],
    tip: 'Screenshot + catatan perilaku adalah "spesifikasi" yang paling mudah dipahami AI.',
  },
  {
    icon: Bot,
    title: 'Bangun dengan AI',
    short: 'Masukkan dokumentasi ke Claude dan Antigravity, satu fitur demi satu fitur.',
    points: [
      'Claude dipakai untuk merancang struktur aplikasi, menulis kode, menjelaskan bug, dan menyusun dokumentasi.',
      'Antigravity dipakai sebagai editor kode ber-AI untuk mengerjakan dan menjalankan project.',
      'Kirim satu fitur per permintaan, sertakan screenshot dan perilaku yang diharapkan.',
      'Minta AI menjelaskan kode yang dibuat, supaya kamu paham saat ditanya penguji.',
    ],
    tip: 'Jangan minta "buatkan aplikasi lengkap" sekaligus. Fitur kecil yang diuji satu per satu jauh lebih stabil.',
  },
  {
    icon: TestTube2,
    title: 'Uji dan perbaiki',
    short: 'Bandingkan hasil simulator dengan software acuan.',
    points: [
      'Jalankan program yang sama di OshonSoft dan di simulator, lalu cocokkan register dan flag.',
      'Simulator ini punya 133 uji otomatis untuk instruksi Z-80, supaya perbaikan baru tidak merusak yang lama.',
      'AI tetap bisa salah: beberapa perilaku instruksi Z-80 harus dicek ulang secara manual.',
    ],
    tip: 'Simpan setiap kasus bug sebagai uji otomatis. Bug yang sama tidak akan kembali diam-diam.',
  },
  {
    icon: Rocket,
    title: 'Hosting dan online',
    short: 'Upload ke internet supaya bisa dibuka dari HP mana pun.',
    points: [
      'Kode disimpan di GitHub, jadi ada riwayat perubahan dan cadangan.',
      'Website di-hosting di Firebase Hosting.',
      'Data angket validasi dan daftar hadir disimpan di Firestore, dengan login Google untuk peneliti.',
      'Dibuat sebagai PWA, jadi bisa dipasang di HP seperti aplikasi biasa.',
    ],
    tip: 'Paket gratis Firebase sudah cukup untuk kebutuhan skripsi dengan puluhan sampai ratusan responden.',
  },
  {
    icon: ClipboardCheck,
    title: 'Validasi penelitian',
    short: 'Uji kelayakan oleh ahli dan pengguna.',
    points: [
      'Angket untuk ahli materi, ahli media, dosen, dan mahasiswa dibuat langsung di dalam simulator.',
      'Hasilnya masuk ke dashboard peneliti dan diolah untuk Bab IV.',
      'Masukan responden dipakai untuk revisi produk.',
    ],
    tip: 'Kalau angket ada di dalam aplikasinya, responden bisa mencoba produk dan menilai di tempat yang sama.',
  },
];

type ToolCat = 'AI' | 'Kode' | 'Online';

interface Tool {
  name: string;
  cat: ToolCat;
  icon: IconType;
  role: string;
  detail: string;
}

const TOOLS: Tool[] = [
  { name: 'Claude', cat: 'AI', icon: Sparkles, role: 'Asisten AI utama',
    detail: 'Merancang arsitektur, menulis dan memperbaiki kode, membaca screenshot, sampai menyusun manual book.' },
  { name: 'Antigravity', cat: 'AI', icon: Bot, role: 'Editor kode ber-AI',
    detail: 'Tempat project dikerjakan dan dijalankan, dengan agen AI yang bisa mengubah banyak file sekaligus.' },
  { name: 'Gemini API', cat: 'AI', icon: Lightbulb, role: 'Fitur Asisten AI di simulator',
    detail: 'Menganalisis kode assembly mahasiswa dan memberi umpan balik langsung di dalam aplikasi.' },
  { name: 'React + TypeScript', cat: 'Kode', icon: Code2, role: 'Tampilan aplikasi',
    detail: 'React menyusun tampilan dari komponen; TypeScript menangkap banyak kesalahan sebelum aplikasi dijalankan.' },
  { name: 'Vite', cat: 'Kode', icon: Wrench, role: 'Menjalankan dan mem-build project',
    detail: 'Server pengembangan yang cepat dan perintah build untuk menghasilkan file siap upload.' },
  { name: 'Tailwind CSS', cat: 'Kode', icon: Cpu, role: 'Desain dan tampilan responsif',
    detail: 'Menata warna, jarak, dan tata letak supaya enak di HP maupun laptop, termasuk mode gelap.' },
  { name: 'GitHub', cat: 'Online', icon: GitBranch, role: 'Penyimpanan kode',
    detail: 'Menyimpan seluruh riwayat perubahan, jadi versi lama selalu bisa dikembalikan.' },
  { name: 'Firebase', cat: 'Online', icon: Database, role: 'Hosting, database, login',
    detail: 'Hosting untuk website, Firestore untuk data angket dan daftar hadir, Auth untuk login Google dan sesi anonim.' },
  { name: 'OshonSoft Z80', cat: 'Online', icon: Globe, role: 'Software acuan',
    detail: 'Patokan fitur dan pembanding hasil eksekusi saat pengujian.' },
];

const PROMPTS: { label: string; text: string }[] = [
  {
    label: 'Mulai project',
    text:
      'Saya ingin membuat versi web dari [nama software] untuk skripsi. Berikut daftar fitur dan screenshot tampilannya. ' +
      'Tolong rancang struktur folder dan teknologi yang cocok (React + TypeScript), lalu buat dulu tampilan dasarnya tanpa logika.',
  },
  {
    label: 'Tiru satu fitur',
    text:
      'Ini screenshot panel [nama fitur] di software acuan. Perilakunya: [jelaskan]. ' +
      'Buatkan komponen yang sama di project saya. Jelaskan juga bagian kode yang penting supaya saya paham.',
  },
  {
    label: 'Perbaiki bug',
    text:
      'Saat saya menjalankan [langkah], hasilnya [hasil di aplikasi saya], padahal di software acuan [hasil yang benar]. ' +
      'Cari penyebabnya, perbaiki, dan tambahkan uji otomatis untuk kasus ini.',
  },
  {
    label: 'Siapkan hosting',
    text:
      'Bantu saya meng-online-kan project ini di Firebase Hosting, dan simpan data form ke Firestore. ' +
      'Buat aturan keamanan supaya hanya saya yang bisa membaca data responden.',
  },
];

const SKILLS: { label: string; level: 'Wajib' | 'Membantu' }[] = [
  { label: 'Paham materi yang disimulasikan (misalnya arsitektur Z-80)', level: 'Wajib' },
  { label: 'Bisa menjelaskan kebutuhan dengan jelas ke AI', level: 'Wajib' },
  { label: 'Teliti menguji dan membandingkan hasil', level: 'Wajib' },
  { label: 'Dasar HTML, CSS, dan JavaScript', level: 'Membantu' },
  { label: 'Git dan GitHub', level: 'Membantu' },
  { label: 'Cara deploy ke hosting', level: 'Membantu' },
];

const FAQ: { q: string; a: string }[] = [
  { q: 'Harus jago coding dulu?',
    a: 'Tidak harus jago, tapi perlu mau belajar. AI menulis sebagian besar kode, sedangkan kamu yang menentukan arah, menguji, dan harus bisa menjelaskan cara kerjanya saat sidang.' },
  { q: 'Boleh membuat clone software untuk skripsi?',
    a: 'Boleh, selama yang dibuat ulang adalah fungsinya, bukan menyalin kode, logo, atau nama software aslinya. Sebutkan software acuan sebagai referensi, dan tambahkan nilai baru (di sini: berbasis web, bisa di HP, dan ada Asisten AI).' },
  { q: 'Apakah hasil AI bisa langsung dipakai?',
    a: 'Jangan langsung percaya. Selalu jalankan dan bandingkan dengan software acuan. Di simulator ini pun ada perilaku instruksi yang harus dikoreksi manual setelah dibuat AI.' },
  { q: 'Butuh biaya?',
    a: 'Hosting dan database bisa memakai paket gratis Firebase. Tool AI punya versi gratis dengan batasan, dan versi berbayar kalau butuh pemakaian lebih banyak.' },
  { q: 'Dari mana mulainya kalau mau mencoba?',
    a: 'Pilih satu software acuan, screenshot satu fitur intinya, lalu minta AI membuat fitur itu saja. Setelah jalan, lanjut ke fitur berikutnya.' },
];

export const CaraBuatPage: React.FC<{ onBackToSimulator: () => void }> = ({ onBackToSimulator }) => {
  const { isDark } = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [toolCat, setToolCat] = useState<'Semua' | ToolCat>('Semua');
  const [openTool, setOpenTool] = useState<string | null>(null);
  const [promptIdx, setPromptIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [skills, setSkills] = useState<Set<number>>(new Set());
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const bg = isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-gray-50 text-gray-900';
  const card = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm';
  const muted = isDark ? 'text-zinc-400' : 'text-gray-500';
  const soft = isDark ? 'bg-zinc-800/70' : 'bg-gray-100';
  const hover = isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100';
  const pill = (on: boolean) =>
    `px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all focus-visible:outline-2 focus-visible:outline-blue-500 ${
      on ? 'bg-blue-600 text-white shadow' : `${soft} ${isDark ? 'text-zinc-300' : 'text-gray-700'} ${hover}`
    }`;

  const tools = useMemo(() => TOOLS.filter((t) => toolCat === 'Semua' || t.cat === toolCat), [toolCat]);
  const wajibTotal = SKILLS.filter((s) => s.level === 'Wajib').length;
  const wajibDone = SKILLS.filter((s, i) => s.level === 'Wajib' && skills.has(i)).length;
  const pct = Math.round((skills.size / SKILLS.length) * 100);

  const step = STEPS[activeStep];
  const StepIcon = step.icon;

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(PROMPTS[promptIdx].text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard ditolak: teks tetap bisa diseleksi manual.
    }
  };

  const toggleSkill = (i: number) =>
    setSkills((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  const SectionTitle: React.FC<{ eyebrow: string; title: string; desc?: string }> = ({ eyebrow, title, desc }) => (
    <div className="space-y-1.5">
      <p className="text-xs font-bold uppercase tracking-wider text-blue-500">{eyebrow}</p>
      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-balance">{title}</h2>
      {desc && <p className={`text-sm leading-relaxed max-w-2xl ${muted}`}>{desc}</p>}
    </div>
  );

  return (
    <div className={`min-h-screen w-full font-sans ${bg}`}>
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md ${isDark ? 'bg-zinc-950/85 border-zinc-800' : 'bg-white/85 border-gray-200'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button onClick={onBackToSimulator} className={`flex items-center gap-1.5 px-3 py-2 -ml-3 rounded-xl text-sm font-semibold ${hover}`}>
            <ArrowLeft className="w-4 h-4" /> Simulator
          </button>
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            {[['alur', 'Alur'], ['tools', 'Tools'], ['prompt', 'Prompt'], ['skill', 'Skill'], ['faq', 'FAQ']].map(([id, l]) => (
              <a key={id} href={`#${id}`} className={`px-3 py-1.5 rounded-lg font-medium ${muted} ${hover}`}>{l}</a>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-14 sm:space-y-20">
        {/* Hero */}
        <section className="space-y-6">
          <div className="space-y-3 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-500">Di balik layar</p>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] text-balance">
              Cara membuat Web Simulator Z-80 dengan bantuan AI
            </h1>
            <p className={`text-base sm:text-lg leading-relaxed ${muted}`}>
              Dari screenshot software acuan sampai aplikasi online yang bisa dibuka di HP. Ringkasan ini untuk kamu yang ingin
              membuat aplikasi serupa untuk tugas atau skripsi. Klik bagian mana pun untuk melihat detailnya.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['6 tahap', '9 tools', '133 uji otomatis', 'Memori 64 KB', 'Bisa dipasang di HP'].map((c) => (
              <span key={c} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${isDark ? 'border-zinc-700 text-zinc-300' : 'border-gray-300 text-gray-700'}`}>
                {c}
              </span>
            ))}
          </div>
        </section>

        {/* Alur */}
        <section id="alur" className="space-y-6 scroll-mt-20">
          <SectionTitle eyebrow="Alur kerja" title="Enam tahap dari ide sampai online" desc="Pilih tahap untuk melihat apa saja yang dikerjakan." />

          <div className="grid gap-5 lg:grid-cols-[17rem_1fr]">
            <ol className="flex lg:flex-col gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 snap-x">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const on = i === activeStep;
                return (
                  <li key={s.title} className="snap-start shrink-0 lg:shrink">
                    <button
                      onClick={() => setActiveStep(i)}
                      aria-current={on ? 'step' : undefined}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl border text-left transition-all ${
                        on ? 'border-blue-500 bg-blue-500/10' : `${isDark ? 'border-zinc-800' : 'border-gray-200'} ${hover}`
                      }`}
                    >
                      <span className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold tabular-nums ${on ? 'bg-blue-600 text-white' : soft}`}>
                        {i < activeStep ? <Check className="w-4 h-4" /> : i + 1}
                      </span>
                      <span className="text-sm font-semibold whitespace-nowrap lg:whitespace-normal">{s.title}</span>
                      <Icon className={`w-4 h-4 ml-auto hidden lg:block ${on ? 'text-blue-500' : muted}`} />
                    </button>
                  </li>
                );
              })}
            </ol>

            <div key={activeStep} className={`p-5 sm:p-7 rounded-3xl border space-y-5 animate-fade-in ${card}`}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center border border-blue-500/25">
                  <StepIcon className="w-6 h-6" />
                </div>
                <div className="space-y-1 min-w-0">
                  <p className={`text-xs font-bold tabular-nums ${muted}`}>Tahap {activeStep + 1} dari {STEPS.length}</p>
                  <h3 className="text-lg sm:text-xl font-bold">{step.title}</h3>
                  <p className={`text-sm ${muted}`}>{step.short}</p>
                </div>
              </div>
              <ul className="space-y-2.5">
                {step.points.map((p) => (
                  <li key={p} className="flex gap-2.5 text-sm leading-relaxed">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex gap-3 text-sm">
                <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                <span>{step.tip}</span>
              </div>
              <div className="flex justify-between gap-2 pt-1">
                <button
                  onClick={() => setActiveStep((i) => Math.max(0, i - 1))}
                  disabled={activeStep === 0}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-semibold disabled:opacity-40 ${isDark ? 'border-zinc-700' : 'border-gray-300'} ${hover}`}
                >
                  <ArrowLeft className="w-4 h-4" /> Sebelumnya
                </button>
                <button
                  onClick={() => setActiveStep((i) => Math.min(STEPS.length - 1, i + 1))}
                  disabled={activeStep === STEPS.length - 1}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-40"
                >
                  Berikutnya <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Tools */}
        <section id="tools" className="space-y-6 scroll-mt-20">
          <SectionTitle eyebrow="Tools" title="Alat yang dipakai" desc="Klik kartu untuk melihat fungsinya di project ini." />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['Semua', 'AI', 'Kode', 'Online'] as const).map((c) => (
              <button key={c} onClick={() => setToolCat(c)} className={pill(toolCat === c)}>
                {c === 'Online' ? 'Online & acuan' : c}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-start">
            {tools.map((t) => {
              const Icon = t.icon;
              const open = openTool === t.name;
              return (
                <button
                  key={t.name}
                  onClick={() => setOpenTool(open ? null : t.name)}
                  aria-expanded={open}
                  className={`p-4 rounded-2xl border text-left transition-all ${open ? 'border-blue-500 ring-1 ring-blue-500/30' : ''} ${card}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${soft}`}>
                      <Icon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm">{t.name}</p>
                      <p className={`text-xs ${muted}`}>{t.role}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${muted}`} />
                  </div>
                  {open && <p className="mt-3 text-sm leading-relaxed animate-fade-in">{t.detail}</p>}
                </button>
              );
            })}
          </div>
        </section>

        {/* Prompt */}
        <section id="prompt" className="space-y-6 scroll-mt-20">
          <SectionTitle
            eyebrow="Contoh prompt"
            title="Cara meminta ke AI"
            desc="Template yang bisa disalin. Ganti bagian dalam [kurung siku] dengan kebutuhanmu, dan lampirkan screenshot-nya."
          />
          <div className={`rounded-3xl border overflow-hidden ${card}`}>
            <div className={`flex gap-2 overflow-x-auto p-3 border-b ${isDark ? 'border-zinc-800' : 'border-gray-200'}`}>
              {PROMPTS.map((p, i) => (
                <button key={p.label} onClick={() => { setPromptIdx(i); setCopied(false); }} className={pill(promptIdx === i)}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <p key={promptIdx} className={`p-4 rounded-2xl font-mono text-[13px] leading-relaxed select-all animate-fade-in ${soft}`}>
                {PROMPTS[promptIdx].text}
              </p>
              <button
                onClick={copyPrompt}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold ${isDark ? 'border-zinc-700' : 'border-gray-300'} ${hover}`}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-blue-500" />}
                {copied ? 'Tersalin' : 'Salin prompt'}
              </button>
            </div>
          </div>
        </section>

        {/* Skill */}
        <section id="skill" className="space-y-6 scroll-mt-20">
          <SectionTitle eyebrow="Skill" title="Cek kesiapanmu" desc="Centang yang sudah kamu kuasai. Yang bertanda Wajib paling penting, sisanya bisa dipelajari sambil jalan." />
          <div className={`p-5 sm:p-6 rounded-3xl border space-y-5 ${card}`}>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span>{wajibDone === wajibTotal ? 'Siap mulai!' : `Skill wajib: ${wajibDone} dari ${wajibTotal}`}</span>
                <span className="tabular-nums">{pct}%</span>
              </div>
              <div className={`h-2.5 rounded-full overflow-hidden ${soft}`}>
                <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {SKILLS.map((s, i) => {
                const on = skills.has(i);
                return (
                  <button
                    key={s.label}
                    onClick={() => toggleSkill(i)}
                    aria-pressed={on}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left text-sm transition-all ${
                      on ? 'border-emerald-500/50 bg-emerald-500/10' : `${isDark ? 'border-zinc-800' : 'border-gray-200'} ${hover}`
                    }`}
                  >
                    <span className={`w-5 h-5 mt-0.5 shrink-0 rounded-md border flex items-center justify-center ${on ? 'bg-emerald-500 border-emerald-500 text-white' : isDark ? 'border-zinc-600' : 'border-gray-400'}`}>
                      {on && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <span className="flex-1">{s.label}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${s.level === 'Wajib' ? 'bg-blue-500/15 text-blue-500' : `${soft} ${muted}`}`}>
                      {s.level}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="space-y-6 scroll-mt-20">
          <SectionTitle eyebrow="FAQ" title="Pertanyaan yang sering muncul" />
          <div className={`rounded-3xl border divide-y ${card} ${isDark ? 'divide-zinc-800' : 'divide-gray-200'}`}>
            {FAQ.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q}>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-sm sm:text-base"
                  >
                    {f.q}
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${muted}`} />
                  </button>
                  {open && <p className={`px-5 pb-5 -mt-1 text-sm leading-relaxed animate-fade-in ${muted}`}>{f.a}</p>}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-extrabold">Lihat hasilnya langsung</h2>
            <p className="text-sm text-blue-100 max-w-md">Coba tulis program assembly Z-80 dan jalankan step-by-step di simulatornya.</p>
          </div>
          <button onClick={onBackToSimulator} className="px-5 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-50 shrink-0">
            Buka Simulator <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      </main>
    </div>
  );
};
