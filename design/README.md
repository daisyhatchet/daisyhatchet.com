# Daisy Hatchet design archive

Business card work lives in `business-cards/`, alongside the website source. These files are outside Astro's public and source folders, so the website build does not publish them.

## Open the saved work

From the repository root, run:

```sh
python3 -m http.server 4876 --directory design/business-cards
```

Then open:

- http://127.0.0.1:4876/ — all 22 concepts, front/back lightbox, shortlist, SVG downloads
- http://127.0.0.1:4876/proof/index.html — RGB and CMYK comparisons for the six refined cards
- http://127.0.0.1:4876/print-ready/index.html — final individual front/back PDFs and full print ZIP

The main gallery can also be opened directly from disk. Shortlists are stored in the browser, not in Git.

## What is preserved

- Outlined SVG artwork for all designs, including original and refined versions
- Viewer HTML, CSS, JavaScript, and design generation scripts
- Original logos, selected photographs, fonts, and font licenses in `assets/`
- CMYK proof images, profile metadata, and conversion scripts in `proof/`
- Final print PDFs and instructions in `print-ready/`, with the production originals and preflight results in `../../output/pdf/daisyhatchet-ups/`
- The supplier's PDF template in `print-specs/`
- Earlier visual studies in `visual-studies/`

The committed gallery and PDF downloads work without regenerating anything. The scripts currently use some Mac-specific ICC profile and tool paths; these must be configured if rebuilding on a different computer. `build.py` requires fontTools and qrcode; proof creation also uses Node sharp, Python Pillow and NumPy. Print preparation additionally uses ReportLab and pypdf. See the scripts for the current paths.

Large duplicate archives, generated review screenshots, and temporary build files are ignored by Git. They remain on the current computer. The print-ready ZIP is retained because the download page uses it.

CMYK uses the agreed Apple Generic CMYK estimate, not a profile supplied by UPS. The original screen artwork and the adjusted print files are both preserved.
