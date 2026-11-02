# Design: Khayamiya tent

A celebration tent from Cairo's Street of the Tentmakers, sent to Saudi. Flat appliqué cloth, visible running stitches, sawtooth trim, an eight-point star tile.

## Color (flat cloth, no gradients on cloth)

| Token | Hex | Role |
|---|---|---|
| `--madder` | #B8232F | hero, gallery, pennant, footer ground |
| `--madder-deep` | #7E1420 | duaa ground, title shadow |
| `--indigo` | #18215C | quilt grounds, banner frame |
| `--indigo-night` | #0D1238 | gate, finale, page ground |
| `--saffron` | #F4B731 | the one lit accent: display names, buttons, thread, love ground |
| `--turq` / `--turq-deep` | #2E9C9A / #0F5A5C | Nile, plate, distance ground |
| `--rose` | #E8798F | bunting, candle stripe |
| `--leaf` | #2F7D4F | Saudi patch, cotton panel accent |
| `--cotton` | #F6EEDC | text on dark cloth |
| `--ink` | #16163A | text on light panels |
| cloth panels | #CDEBE4 · #F8D3DB · #FBE1A0 · #F6EEDC | letter panels (turq, rose, saffron, cotton) |

Each section owns one ground. Tiles are the same star mask in a one-step darker shade of that ground.

## Type

- **Reem Kufi** 600–700: display, section titles, buttons. Max 6rem.
- **Aref Ruqaa** 400–700: the handwritten voice (opener, captions, signature, footer).
- **Noto Naskh Arabic** 400–700: the letter body, line-height 2, panels at most 44rem wide.
- **Noto Color Emoji** is the emoji fallback, so the letter's emoji and flags render on Windows.
- Words are split only at word boundaries. Never split Arabic into characters.

## Components

- **Valance:** a 12px band plus sawtooth teeth from a conic-gradient mask, each tooth a different cloth colour.
- **Bunting:** clip-path triangle flags on a sagging rope, swaying.
- **Panel:** a cloth patch with an SVG running stitch drawn in on scroll, a star appliqué in the corner, a sawtooth hem, and a small rotation.
- **mark.thread:** a 3px underline in the panel accent colour that draws in after the stitch.
- **Banner:** indigo cloth inside a saffron sawtooth frame with a dashed inner stitch.
- **Photo:** cotton mount, a coloured patch behind it, a wooden peg. It swings with scroll velocity.
- **Button:** a saffron pill with an inner dashed stitch. Ghost variant: transparent with a cotton stitch.

## Motion

Cloth settles with a small overshoot (`--ease-cloth`, back.out, and elastic on hanging photos). Stitches draw in as running dashes. The signature moment: blowing out the candle sets off a confetti of cloth scraps, the tent flaps close and part, and the sketch draws itself in with pencil scribbles. After that: a thread scrubbed from Egypt to Saudi, a horizontal photo rope (≥900px), stars rising during the prayer, and the love sentence lit word by word, with the signature written in thread. Under prefers-reduced-motion, the complete static page shows.
