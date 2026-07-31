"""
One-off generator for static/og-image.png — not part of the build pipeline,
since the copy it renders (headline, subtitle) is source content that only
changes by hand, same as tvos.png. Re-run manually if that copy changes.

Mirrors Hero.svelte's layout: the ShiroMark wordmark, the two-line headline
(second line muted), the subtitle below. Paper/ink colours only — a social
preview can't switch with the visitor's theme, so it renders the light one.
"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
PAPER = (250, 250, 249)
INK = (11, 11, 12)
MUTED = (107, 107, 112)
ACCENT = (239, 68, 68)

img = Image.new("RGB", (W, H), PAPER)
draw = ImageDraw.Draw(img)

FONT_DIR = "/c/Windows/Fonts".replace("/c/", "C:/")
bold = lambda size: ImageFont.truetype(f"{FONT_DIR}/segoeuib.ttf", size)
regular = lambda size: ImageFont.truetype(f"{FONT_DIR}/segoeui.ttf", size)

# --- ShiroMark, traced from ShiroMark.svelte's own path data (1024x1024 box) ---
MARK_SIZE = 132
scale = MARK_SIZE / 1024
mark_x, mark_y = 90, 84


def pt(x, y):
    return (mark_x + x * scale, mark_y + y * scale)


draw.polygon(
    [pt(447, 106), pt(537, 122), pt(505, 245), pt(406, 245)], fill=INK
)
for rx, ry, rw, rh in [
    (200, 245, 625, 75),
    (200, 245, 85, 670),
    (740, 245, 85, 670),
    (285, 500, 455, 75),
    (285, 775, 455, 80),
]:
    draw.rectangle(
        [pt(rx, ry), pt(rx + rw, ry + rh)], fill=INK
    )

# --- Headline, two lines like the hero ---
headline_y = 260
draw.text((90, headline_y), "Your anime library,", font=bold(64), fill=INK)
draw.text((90, headline_y + 74), "entirely yours.", font=bold(64), fill=MUTED)

# --- Subtitle ---
subtitle = "A free, source-available library manager for anime and manga on iOS."
draw.text((90, headline_y + 172), subtitle, font=regular(28), fill=MUTED)

# --- Small accent rule, echoing the install CTA's colour ---
draw.rectangle([(90, headline_y + 222), (166, headline_y + 228)], fill=ACCENT)

img.save("static/og-image.png")
print(f"wrote static/og-image.png ({W}x{H})")
