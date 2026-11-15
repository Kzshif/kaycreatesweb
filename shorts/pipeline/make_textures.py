#!/usr/bin/env python3
"""Makes the paper textures the animation uses, from code (nothing downloaded).

  python pipeline/make_textures.py

  public/paper/grain.png       seamless paper tooth for light papers (multiplied onto the colour)
  public/paper/grain-dark.png  the same for the ink desk of the inverted version (screened on)
  public/paper/wear.png        where a rubber stamp's ink took and where it did not (a mask)

All three tile without a seam: the noise is built in the frequency domain, which wraps round.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public" / "paper"
N = 512


def noise(sigma, seed):
    """Seamless noise with features about `sigma` pixels across, mean 0, std 1."""
    rng = np.random.default_rng(seed)
    f = np.fft.fft2(rng.standard_normal((N, N)))
    fy = np.fft.fftfreq(N)[:, None]
    fx = np.fft.fftfreq(N)[None, :]
    f *= np.exp(-2 * (np.pi * sigma) ** 2 * (fx**2 + fy**2))
    x = np.real(np.fft.ifft2(f))
    return (x - x.mean()) / (x.std() + 1e-9)


def fibres(count, seed, lo, hi):
    """Short paper fibres as a signed layer (+ lighter, - darker), drawn so they wrap at the edges."""
    rng = np.random.default_rng(seed)
    s = 3  # supersampling
    layers = []
    for sign in (1, -1):
        img = Image.new("L", (N * s, N * s), 0)
        d = ImageDraw.Draw(img)
        for _ in range(count // 2):
            x, y = rng.uniform(0, N), rng.uniform(0, N)
            length, ang = rng.uniform(lo, hi), rng.uniform(0, np.pi)
            bend = rng.uniform(-0.5, 0.5)
            pts = []
            for k in range(7):
                t = k / 6 - 0.5
                a = ang + bend * t
                pts.append((x + np.cos(a) * length * t, y + np.sin(a) * length * t))
            level = int(rng.uniform(90, 255))
            for ox in (-N, 0, N):
                for oy in (-N, 0, N):
                    d.line([((px + ox) * s, (py + oy) * s) for px, py in pts], fill=level, width=s)
        layers.append(sign * np.asarray(img.resize((N, N), Image.LANCZOS), dtype=np.float32) / 255)
    return layers[0] + layers[1]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    fine, mid, big, huge = noise(0.7, 1), noise(3.2, 2), noise(14, 3), noise(60, 4)
    fib = fibres(520, 5, 5, 22)

    # light papers: sits just under white so multiplying it only ever adds tooth
    g = 243 + 4.2 * fine + 3.6 * mid + 3.0 * big + 2.4 * huge + 9.0 * fib
    Image.fromarray(np.clip(g, 205, 255).astype(np.uint8)).save(OUT / "grain.png", optimize=True)

    # the ink desk: faint light tooth on black, to be screened on
    gd = 10 + 3.6 * fine + 3.2 * mid + 2.8 * big + 2.2 * huge + 13.0 * np.clip(fib, 0, None) + 4.0 * fib
    Image.fromarray(np.clip(gd, 0, 60).astype(np.uint8)).save(OUT / "grain-dark.png", optimize=True)

    # stamp ink: mostly there, with worn patches and pin-holes where the rubber did not touch
    patch = noise(9, 11) * 0.75 + noise(28, 12) * 0.6
    speck = noise(1.1, 13)
    a = np.clip((patch + 1.75) / 0.55, 0.16, 1.0)  # worn patches: about a tenth of the area
    a *= np.clip((speck + 2.25) / 0.5, 0.3, 1.0)  # pin-holes
    a *= 0.9 + 0.1 * np.clip(noise(4, 14), -1, 1)  # uneven pressure
    rgba = np.zeros((N, N, 4), dtype=np.uint8)
    rgba[..., :3] = 255
    rgba[..., 3] = np.clip(a * 255, 0, 255).astype(np.uint8)
    Image.fromarray(rgba).save(OUT / "wear.png", optimize=True)
    for f in sorted(OUT.glob("*.png")):
        print(f"{f.name}: {f.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
