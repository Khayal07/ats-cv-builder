# Fonts

Noto Sans and Noto Serif (static, SIL Open Font License 1.1, see `OFL.txt`).
Used by the HTML preview (`@font-face` in `globals.css`) and embedded in exported PDFs.

They cover Azerbaijani (ə Ə ı İ ğ ş ç ö ü), the rest of Latin, Cyrillic and common punctuation.

Source: https://github.com/notofonts/notofonts.github.io (`fonts/<Family>/hinted/ttf`).
Subset with fontTools to keep downloads small:

```bash
pyftsubset NotoSans-Regular.ttf \
  --unicodes="U+0000-036F,U+0400-04FF,U+1E00-1EFF,U+2000-206F,U+20A0-20CF,U+2100-214F,U+2190-21FF,U+2212,U+25A0-25FF,U+FB00-FB06" \
  --layout-features='*' --no-hinting --desubroutinize \
  --output-file=public/fonts/NotoSans-Regular.ttf
```
