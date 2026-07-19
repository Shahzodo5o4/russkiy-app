# -*- coding: utf-8 -*-
"""Kitob PDF'idan sahifalarni OCR qilib matn chiqaradi.

PDF'larning matn qatlami buzuq (kirill mojibake), shuning uchun sahifa
rasmga render qilinadi va Tesseract (rus tili) bilan o'qiladi.

Ishlatish:
    python tools/ocr_book.py "books/Русские падежи.pdf" 28 32
    python tools/ocr_book.py "books/50 текстов.pdf" 14 --dpi 400

Sahifa raqamlari — PDF sahifalari (1-dan boshlab). Diqqat: «Русские падежи»da
PDF sahifa = kitob beti + 1 (masalan, kitobning 27-beti = PDF 28-sahifa).

Natija: content/local/ocr/<kitob-nomi>/pNNN.txt + stdout'ga ham chiqadi.
"""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile

import fitz  # PyMuPDF

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TESSDATA = os.path.join(ROOT, "tools", "tessdata")
TESSERACT_DEFAULT = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def find_tesseract() -> str:
    exe = shutil.which("tesseract")
    if exe:
        return exe
    if os.path.exists(TESSERACT_DEFAULT):
        return TESSERACT_DEFAULT
    sys.exit("XATO: tesseract topilmadi. winget install UB-Mannheim.TesseractOCR")


def ocr_page(doc: "fitz.Document", page_no: int, dpi: int, lang: str, exe: str) -> str:
    page = doc[page_no - 1]
    pix = page.get_pixmap(dpi=dpi)
    with tempfile.TemporaryDirectory() as tmp:
        png = os.path.join(tmp, "page.png")
        pix.save(png)
        out_base = os.path.join(tmp, "out")
        subprocess.run(
            [exe, png, out_base, "--tessdata-dir", TESSDATA, "-l", lang, "--psm", "4"],
            check=True, capture_output=True,
        )
        with open(out_base + ".txt", encoding="utf-8") as f:
            return f.read().strip()


def main() -> None:
    ap = argparse.ArgumentParser(description="PDF sahifalarini OCR qilish (rus)")
    ap.add_argument("pdf", help="PDF fayl yo'li")
    ap.add_argument("start", type=int, help="Boshlang'ich PDF sahifa (1-dan)")
    ap.add_argument("end", type=int, nargs="?", help="Oxirgi sahifa (kiritilmasa = start)")
    ap.add_argument("--dpi", type=int, default=300)
    ap.add_argument("--lang", default="rus")
    ap.add_argument("--out", help="Chiqish papkasi (default: content/local/ocr/<nom>)")
    args = ap.parse_args()

    end = args.end or args.start
    exe = find_tesseract()
    stem = os.path.splitext(os.path.basename(args.pdf))[0]
    out_dir = args.out or os.path.join(ROOT, "content", "local", "ocr", stem)
    os.makedirs(out_dir, exist_ok=True)

    doc = fitz.open(args.pdf)
    if end > len(doc):
        sys.exit(f"XATO: PDF'da {len(doc)} sahifa bor, {end} so'raldi")

    for p in range(args.start, end + 1):
        text = ocr_page(doc, p, args.dpi, args.lang, exe)
        out_file = os.path.join(out_dir, f"p{p:03d}.txt")
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(text + "\n")
        print(f"===== PDF sahifa {p} ({out_file}) =====")
        print(text)
        print()


if __name__ == "__main__":
    main()
