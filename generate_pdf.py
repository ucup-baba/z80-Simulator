#!/usr/bin/env python3
"""
Generate a professional PDF Manual Book for Z-80 Simulator Core Logic.
Uses Python markdown -> styled HTML -> Chrome Headless print-to-pdf.
"""

import markdown
import subprocess
import os
import sys

MD_PATH = "MANUAL_BOOK_Z80_SIMULATOR.md"
HTML_PATH = "temp_manual.html"
PDF_PATH = "public/MANUAL_BOOK_Z80_SIMULATOR.pdf"

# Read markdown
with open(MD_PATH, "r", encoding="utf-8") as f:
    md_text = f.read()

# Strip emoji from headings for cleaner PDF presentation
import re
md_text = re.sub(r'^(#{1,6})\s*[^\w\s*#]*\s*', r'\1 ', md_text, flags=re.MULTILINE)

# Convert markdown to HTML
html_body = markdown.markdown(md_text, extensions=["tables", "fenced_code", "toc"])

# Build full HTML with professional styling
full_html = f'''<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>Manual Book — Z-80 Simulator Core Logic</title>
<style>
  /* ===== PAGE SETUP ===== */
  @page {{
    size: A4;
    margin: 22mm 18mm 28mm 18mm;

    @bottom-center {{
      content: counter(page);
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 9pt;
      color: #64748b;
    }}
  }}

  @page :first {{
    margin: 0;
    @bottom-center {{ content: none; }}
  }}

  /* ===== COVER PAGE ===== */
  .cover-page {{
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(160deg, #0f172a 0%, #1e3a5f 40%, #1e40af 100%);
    color: white;
    page-break-after: always;
    padding: 40px;
    box-sizing: border-box;
  }}

  .cover-page .cover-badge {{
    display: inline-block;
    padding: 6px 20px;
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 50px;
    font-size: 11pt;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #93c5fd;
    margin-bottom: 24px;
  }}

  .cover-page .cover-title {{
    font-size: 32pt;
    font-weight: 800;
    line-height: 1.15;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
  }}

  .cover-page .cover-subtitle {{
    font-size: 14pt;
    font-weight: 400;
    color: #bfdbfe;
    margin: 0 0 36px 0;
    font-style: italic;
    max-width: 420px;
  }}

  .cover-page .cover-divider {{
    width: 80px;
    height: 3px;
    background: #3b82f6;
    border-radius: 4px;
    margin: 0 auto 32px auto;
  }}

  .cover-page .cover-info {{
    font-size: 10.5pt;
    color: #cbd5e1;
    line-height: 2;
  }}

  .cover-page .cover-info strong {{
    color: white;
  }}

  .cover-page .cover-url {{
    display: inline-block;
    margin-top: 28px;
    padding: 10px 28px;
    border: 2px solid #3b82f6;
    border-radius: 10px;
    font-size: 12pt;
    font-weight: 700;
    color: #60a5fa;
    text-decoration: none;
    letter-spacing: 0.3px;
  }}

  /* ===== BODY TYPOGRAPHY ===== */
  body {{
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.65;
    color: #1e293b;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}

  /* ===== HEADINGS ===== */
  h1 {{
    font-size: 20pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 3px solid #2563eb;
    padding-bottom: 8px;
    margin: 30px 0 14px 0;
    letter-spacing: -0.3px;
    page-break-after: avoid;
  }}

  h2 {{
    font-size: 15pt;
    font-weight: 700;
    color: #1e3a8a;
    border-bottom: 1.5px solid #cbd5e1;
    padding-bottom: 6px;
    margin: 28px 0 12px 0;
    page-break-after: avoid;
  }}

  h3 {{
    font-size: 12pt;
    font-weight: 700;
    color: #1d4ed8;
    margin: 20px 0 8px 0;
    page-break-after: avoid;
  }}

  h4 {{
    font-size: 11pt;
    font-weight: 600;
    color: #334155;
    margin: 14px 0 6px 0;
    page-break-after: avoid;
  }}

  /* ===== PARAGRAPHS & LISTS ===== */
  p {{
    margin: 6px 0 10px 0;
    text-align: justify;
    orphans: 3;
    widows: 3;
  }}

  ul, ol {{
    padding-left: 22px;
    margin: 6px 0 12px 0;
  }}

  li {{
    margin-bottom: 4px;
  }}

  li > ul, li > ol {{
    margin-top: 3px;
    margin-bottom: 3px;
  }}

  /* ===== BLOCKQUOTE (Info Boxes) ===== */
  blockquote {{
    background: #f0f9ff;
    border-left: 4px solid #2563eb;
    margin: 14px 0;
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;
    font-size: 10pt;
    color: #1e40af;
    page-break-inside: avoid;
  }}

  blockquote strong {{
    color: #0f172a;
  }}

  blockquote p {{
    margin: 4px 0;
    text-align: left;
  }}

  /* ===== CODE ===== */
  code {{
    font-family: 'Consolas', 'Fira Code', 'Courier New', monospace;
    background: #f1f5f9;
    color: #0f172a;
    padding: 1.5px 5px;
    border-radius: 4px;
    font-size: 9.5pt;
    border: 1px solid #e2e8f0;
  }}

  pre {{
    background: #0f172a;
    color: #86efac;
    padding: 16px 18px;
    border-radius: 10px;
    overflow-x: auto;
    font-size: 9.5pt;
    line-height: 1.5;
    margin: 12px 0 16px 0;
    border: 1px solid #1e293b;
    page-break-inside: avoid;
  }}

  pre code {{
    background: transparent;
    color: inherit;
    padding: 0;
    border: none;
    font-size: inherit;
  }}

  /* ===== TABLES ===== */
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }}

  th {{
    background: #1e40af;
    color: white;
    font-weight: 700;
    padding: 9px 12px;
    text-align: left;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}

  td {{
    padding: 8px 12px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
  }}

  tr:nth-child(even) td {{
    background: #f8fafc;
  }}

  /* ===== HORIZONTAL RULES ===== */
  hr {{
    border: none;
    border-top: 1.5px solid #e2e8f0;
    margin: 24px 0;
  }}

  /* ===== LINKS ===== */
  a {{
    color: #2563eb;
    text-decoration: none;
    font-weight: 500;
  }}

  /* ===== STRONG / EM ===== */
  strong {{
    font-weight: 700;
    color: #0f172a;
  }}

  em {{
    font-style: italic;
    color: #475569;
  }}

  /* ===== HEADER BAR ON CONTENT PAGES ===== */
  .page-header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0 8px 0;
    border-bottom: 1.5px solid #e2e8f0;
    margin-bottom: 20px;
    font-size: 8.5pt;
    color: #94a3b8;
  }}

  .page-header .doc-title {{
    font-weight: 600;
    color: #64748b;
  }}

  /* ===== FOOTER NOTE ===== */
  .footer-note {{
    margin-top: 40px;
    padding-top: 14px;
    border-top: 1px solid #e2e8f0;
    font-size: 9pt;
    color: #94a3b8;
    text-align: center;
    font-style: italic;
  }}
</style>
</head>
<body>

<!-- ===== COVER PAGE ===== -->
<div class="cover-page">
  <div class="cover-badge">Manual Book</div>
  <h1 class="cover-title" style="border:none; color:white; padding:0; margin:0 0 12px 0;">
    BUKU PANDUAN<br>PENGGUNAAN
  </h1>
  <div class="cover-divider"></div>
  <p class="cover-subtitle">
    Z-80 Simulator Core Logic<br>
    Media Pembelajaran Interaktif Mikroprosesor Zilog Z-80 Berbasis Web &amp; AI
  </p>

  <div class="cover-info">
    <strong>Nama Aplikasi</strong>: Z-80 Simulator Core Logic (Z80 Sim)<br>
    <strong>Jenis Produk</strong>: Media Pembelajaran Interaktif / Simulator Mikroprosesor (PWA)<br>
    <strong>Sasaran</strong>: Mahasiswa Pend. Teknik Elektro / Informatika<br>
    <strong>Mata Kuliah</strong>: Sistem Mikroprosesor<br>
    <strong>Model Pengembangan</strong>: R&amp;D (Research and Development)
  </div>

  <div class="cover-url">https://z80-simulation.web.app</div>
</div>

<!-- ===== CONTENT ===== -->
<div class="page-header">
  <span class="doc-title">Manual Book — Z-80 Simulator Core Logic</span>
  <span>z80-simulation.web.app</span>
</div>

{html_body}

<div class="footer-note">
  Manual Book ini disusun sebagai bagian dari Dokumentasi &amp; Panduan Penggunaan Skripsi<br>
  Z-80 Simulator Core Logic &mdash; Media Pembelajaran Interaktif Mikroprosesor Z-80 Berbasis Web &amp; AI.
</div>

</body>
</html>'''

# Write HTML
with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(full_html)

# Ensure output directory exists
os.makedirs("public", exist_ok=True)

# Generate PDF via Chrome Headless
cmd = [
    "/usr/bin/google-chrome",
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-software-rasterizer",
    f"--print-to-pdf={PDF_PATH}",
    "--print-to-pdf-no-header",
    HTML_PATH
]

result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode != 0:
    print(f"Chrome stderr: {result.stderr}", file=sys.stderr)

file_size = os.path.getsize(PDF_PATH)
print(f"PDF generated: {PDF_PATH} ({file_size:,} bytes)")

# Cleanup temp HTML
os.remove(HTML_PATH)
print("Done! Temp HTML cleaned up.")
