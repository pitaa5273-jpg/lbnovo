"""
Gera os assets visuais para o APK:
  - frontend/resources/icon.png  (1024x1024) — ícone do app
  - frontend/resources/icon-foreground.png (1024x1024 transparente, "LB")
  - frontend/resources/splash.png (2732x2732) — splash screen

Roda local com PIL. O GitHub Actions também executa esse script no build,
mas como já comitamos os PNGs, ele apenas garante que existem.
"""
import os
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "resources"))
os.makedirs(OUT, exist_ok=True)

BLACK = (15, 15, 15)
ORANGE = (255, 102, 0)
GOLD = (212, 175, 55)
WHITE = (255, 255, 255)


def gradient_disc(size, c1, c2):
    """Cria uma imagem com gradiente diagonal de c1 -> c2."""
    img = Image.new("RGB", (size, size), c1)
    top = Image.new("RGB", (size, size), c2)
    mask = Image.new("L", (size, size))
    md = ImageDraw.Draw(mask)
    for y in range(size):
        v = int(255 * (y / size))
        md.line([(0, y), (size, y)], fill=v)
    img.paste(top, (0, 0), mask)
    return img


def draw_lb_text(draw, x, y, w, h, color):
    """Desenha o texto 'LB' em estilo blocado simples (independente de fontes)."""
    # Letras geometricamente. Cada letra ocupa (w/2 - gap) x h.
    gap = w // 12
    letter_w = (w - gap) // 2
    s = max(2, h // 11)  # stroke

    # ---- L ----
    lx, ly = x, y
    # vertical bar
    draw.rectangle([lx, ly, lx + s * 2, ly + h], fill=color)
    # horizontal bottom
    draw.rectangle([lx, ly + h - s * 2, lx + letter_w, ly + h], fill=color)

    # ---- B ----
    bx = x + letter_w + gap
    by = y
    bw = letter_w
    # vertical bar
    draw.rectangle([bx, by, bx + s * 2, by + h], fill=color)
    # top half
    half = h // 2
    draw.rectangle([bx, by, bx + bw, by + s * 2], fill=color)
    draw.rectangle([bx + bw - s * 2, by, bx + bw, by + half], fill=color)
    draw.rectangle([bx, by + half - s, bx + bw, by + half + s], fill=color)
    # bottom half
    draw.rectangle([bx + bw - s * 2, by + half, bx + bw, by + h], fill=color)
    draw.rectangle([bx, by + h - s * 2, bx + bw, by + h], fill=color)


def make_icon(size=1024):
    bg = gradient_disc(size, ORANGE, GOLD)
    # rounded mask (Android adaptive uses square; rounded for legacy)
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    icon.paste(bg, (0, 0))

    draw = ImageDraw.Draw(icon)
    # central LB
    pad = size // 5
    box_w = size - pad * 2
    box_h = int(box_w * 0.62)
    bx = pad
    by = (size - box_h) // 2
    draw_lb_text(draw, bx, by, box_w, box_h, BLACK)

    icon.save(os.path.join(OUT, "icon.png"))

    # foreground for adaptive icon (transparent bg + LB)
    fg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(fg)
    pad2 = size // 4
    bw2 = size - pad2 * 2
    bh2 = int(bw2 * 0.62)
    draw_lb_text(fdraw, pad2, (size - bh2) // 2, bw2, bh2, ORANGE)
    fg.save(os.path.join(OUT, "icon-foreground.png"))


def make_splash(size=2732):
    img = Image.new("RGB", (size, size), BLACK)
    draw = ImageDraw.Draw(img)

    # subtle radial vignette via concentric rectangles
    for r in range(0, size // 2, 8):
        alpha = max(0, 30 - r // 30)
        color = (
            min(255, BLACK[0] + alpha // 3),
            min(255, BLACK[1] + alpha // 6),
            BLACK[2],
        )
        draw.rectangle([r, r, size - r, size - r], outline=color)

    # Logo LB with golden border
    logo_size = 760
    lx = (size - logo_size) // 2
    ly = (size - logo_size) // 2 - 80

    bg = gradient_disc(logo_size, ORANGE, GOLD)
    img.paste(bg, (lx, ly))

    box_w = int(logo_size * 0.62)
    box_h = int(box_w * 0.62)
    draw_lb_text(
        draw,
        lx + (logo_size - box_w) // 2,
        ly + (logo_size - box_h) // 2,
        box_w, box_h, BLACK
    )

    # title text below logo (block based, no fonts dep)
    title_y = ly + logo_size + 90
    tw = 1200
    th = 130
    tx = (size - tw) // 2
    # "LB MECÂNICA" simples: barra dourada
    draw.rectangle([tx, title_y, tx + tw, title_y + 6], fill=GOLD)
    draw.rectangle([tx, title_y + th, tx + tw, title_y + th + 6], fill=GOLD)

    img.save(os.path.join(OUT, "splash.png"))


if __name__ == "__main__":
    make_icon()
    make_splash()
    print("✓ assets gerados em", OUT)
