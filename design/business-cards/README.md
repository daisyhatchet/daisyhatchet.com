# Daisy Hatchet — cards that flirt back

Open `index.html` to compare seven broad concepts, then expand each to review its executions, both sides, SVG downloads, shortlist buttons, and physical-format illustrations. The twelve original option numbers and shortlist selections are preserved.

The groups are: photography (13–16); flirty analogies (01, 02, 03, 04, 12); invitation to play (06); sharing (07); useful keepsakes (08, 10); the garden’s music (05); and local provenance (11). The counter sign (09) is presented separately as a supporting display format that can carry any chosen concept. It works offline. The eight earlier brand-focused studies are linked at the bottom and saved in `visual-studies/`.

## New photography family

13 — Made you look: edge-to-edge Field note 02 photograph (cream dahlia and pink bouquet) with a short headline.

14 — The keepsake print: a portrait photograph framed like a small art print, using the pale arrangement against a pink backdrop.

15 — The pocket portfolio: three arrangements in consistent frames, showing orange, cream, and burgundy palettes.

16 — The hands behind it: a documentary garden photograph paired with an olive farm-label panel.

All four use existing website photographs, include both sides, and appear first in the main gallery under Photos. The shop QR codes on all four were decoded successfully.

## Close-up viewer

Click a card or its “View larger” button to open the dark lightbox. Use +/− to zoom up to 4× the fitted view, drag or scroll to pan, and use the arrows to move through fronts and backs in gallery order. Fit resets the view; Escape or Close returns you to the card. Keyboard +/−, 0, and left/right arrows also work. Available in both galleries, including offline.

## Logo and layout refinement

The supplied color and grayscale round logos now replace generic daisies in the main collection and earlier visual studies. The original PNG files are preserved in `assets/`; SVG clipping presents them as circular seals without redrawing their lettering. The crossed daisy-and-hatchet emblem now uses full-strength lime linework on 01, 03, 08, 09, and 12, with hot pink on 04 and the bookmark. Quieter treatments remain on 02 and 11 for comparison. The bonus lavender and portrait studies also use hot-pink linework. The garden-radio card uses the round seal as a record label.

The main cards use a consistent 64-unit left margin (about 5.4 mm at standard card size), aligned contact and QR columns, and coordinated footer baselines. Narrow formats use proportional margins. Options 01, 02, 03, 05, 06, 08, 10, and 11 have approximately 3 mm rounded outer corners in both SVG faces. Options 04, 07, 09, and 12 keep square corners for the editorial or folding/perforation treatment. Updated SVGs, PNGs, mockups, and the gallery all reflect these shapes. All ten QR occurrences were decoded again after refinement.

## Recommended starting points

- **01 — Caught looking:** the clearest, most versatile takeaway beside an arrangement.
- **03 — Take me home:** the most direct invitation to shop, with copy clarifying that the display stays at the business.
- **12 — The little reveal:** a folded card whose cover opens to “I have friends.” The most memorable physical idea.
- **09 — The wingman:** a standing companion sign that explicitly invites people to take a card. Pair it with a stack of 01, 02, or 03.

## The sixteen options

| No. | Name | The idea |
|---|---|---|
| 01 | Caught looking | The flowers notice you noticing them. |
| 02 | Mutual attraction | A compliment from the arrangement. |
| 03 | Take me home | Turn attraction into a visit to the shop. |
| 04 | The second date | Suggest flowers for home, a person, or just because. |
| 05 | Garden radio | Take the real garden playlist home with you. |
| 06 | Bloom finder | A cut-out window frames a flower detail for a photo. |
| 07 | Pass it on | A perforated pair makes sharing part of the object. |
| 08 | The flower reminder | Write down a recipient, occasion, and colors. |
| 09 | The wingman | A small folded counter sign invites the pickup. |
| 10 | Pick this up later | A bookmark gives the brand a longer life. |
| 11 | Local character | A square card reveals the flowers’ Pacifica roots. |
| 12 | The little reveal | A folded invitation delivers a punchline and a shop link. |

## Files

- `index.html`: self-contained review gallery. The bonus gallery and finishing-guide downloads are separate local files; keep the folder together for those links.
- `overview.png`: all sixteen fronts at a glance. Special sizes are scaled to fit; this is not a true-size comparison.
- `01-…-front.svg` / `01-…-back.svg`: individual artwork. Text is vector outlines; no font installation is required.
- `previews/01.png` through `16.png`: review boards showing both sides and the idea behind each.
- `previews/artwork/`: 300 dpi PNG versions of the main card artwork.
- `*-use-preview.svg`: schematic illustrations of special formats, not print artwork.
- `*-finish-guide.svg`: guides for the perforation or fold. Teal dashed lines are production annotations and must not print on the finished cards.
- `09-the-wingman-outside-fold-sheet.svg`: properly oriented flat outside sheet for the tent. Its separate fold guide marks the score.
- `visual-studies/`: eight earlier two-sided visual explorations, including the existing emblem and gallery sunflower photograph.
- `build.py`, `concepts.py`, `refinements.py`, `mockups.py`, `refine_visual_studies.py`: editable design source. Python dependencies: `fonttools` and `qrcode`. Font files and licenses are in `assets/`.

## Size and production

These are design proofs at finished trim size, in RGB, with no bleed. They are not final press files. Most cards are 3.5 × 2 inches. 07 tears into two 1.75 × 2 inch pieces. 09 is 3.5 × 4 inches flat and folds to a 3.5 × 2 inch tent. 10 is a 2 × 5.5 inch bookmark. 11 is 2.5 inches square. 12 is 7 × 2 inches flat and folds to 3.5 × 2 inches.

For 06, the transparent window is 1 × 1.183 inches with rounded corners; its back position mirrors the front. Have a printer create the cutting die from that geometry and test a physical sample. For 07, test the tear and durability. Use an uncoated reverse for the writable fields in 08. For 09 and 12, score before folding.

Once a direction is chosen, add the printer’s bleed and safe-area requirements, agree on stock and ink, and make a physical proof. The website’s vivid pink and lime will appear less fluorescent with standard CMYK ink. QR codes should be scan-tested again on that printed proof.

## Checks and source

Designed from the website pulled to commit `06d3ec8` on September 21, 2026. Uses its Danfo and DM Sans fonts, exact seven-color palette, Pacifica positioning, Jeneva’s name, email, Instagram, existing emblem, and existing garden playlist.

All sixteen main front/back layouts were rendered and visually inspected. Automated checks found no text outside the card bounds, no gallery script errors, and no horizontal overflow at 390 px. Shortlisting and SVG downloads were checked. macOS Vision decoded all fourteen printed QR occurrences to the intended shop URL or existing Spotify playlist. A physical print proof is still needed for final scanning and color approval.

The live website was not changed or published. No orders or print purchases were made.


Refined flirty set (17–21): five matching two-sided cards based on Mutual Attraction, grouped first in the gallery. Shared plum/pink palette, 400-unit stamp vertically centered on the headline block, contact icons, QR spacing, and typography (smaller on Second Date). Only headline and back reply vary. Original 01–16 artwork is preserved. The two Take Me Home fronts intentionally pair with different back replies.


CMYK screen comparison: `proof/index.html` compares all refined fronts and backs as tagged sRGB images, using an ICC-managed sRGB → Generic CMYK → sRGB round trip with relative colorimetric intent and black-point compensation. This is exploratory, without paper-white simulation. Override DAISY_CMYK_PROFILE with the printer profile and DAISY_PYTHON if needed. Regenerated automatically by build.py; original SVG colors remain untouched.

Adjusted CMYK study: proof view now includes a third column with deliberate process-ink choices: pink C0/M100/Y0/K0, lime C30/M0/Y100/K0. Applied to both logo and layout in CMYK before generating tagged sRGB previews. Plum/cream retain automatic conversion. Generic-profile best guess only; originals are unchanged. Recipes and conversion settings are saved in proof/metadata.json.

Adjusted CMYK watermark: the crossed-emblem source opacity is raised from 10% to 35% only for the adjusted proof. Original SVGs and automatic CMYK previews retain their existing watermark.

## Refined Made You Look — option 22
Field Note 02 front retained, with a matching refined hot-pink back. Original 13 remains. Added to all CMYK comparisons; photo is protected from brand palette substitutions. Individual CMYK front/back PDFs in print-ready/, prepared to the same UPS template. All six refined designs are in the updated print ZIP.
