#!/usr/bin/env python3
"""Original instrumental chiptune for the post video. No samples, no lyrics: every sound is made here.
150 BPM, 16 bars (25.6 s), the same grid as the cuts in post.html (1 beat = 12 frames at 30 fps).
usage: python3 tools/music.py video/music.wav
Sections (bars, 1-based):  1-3 intro (shot 1) | 4-5 full groove (gameplay) | 6-7.5 system | 7.5-12 comparisons | 13-16 finale
"""
import math, random, struct, sys, wave

SR = 44100
BPM = 150
BEAT = 60.0 / BPM
BAR = 4 * BEAT
BARS = 16
N = int(SR * (BARS * BAR + 0.6))
L = [0.0] * N
R = [0.0] * N
rnd = random.Random(7)
NOISE = [rnd.uniform(-1, 1) for _ in range(SR)]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def add(buf_l, buf_r, start, samples, pan=0.0):
    i0 = int(start * SR)
    gl, gr = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
    for k, v in enumerate(samples):
        i = i0 + k
        if 0 <= i < N:
            buf_l[i] += v * gl
            buf_r[i] += v * gr


def env(k, n, a, r):
    """linear attack (a samples) and release (r samples)"""
    if k < a:
        return k / a
    if k > n - r:
        return max(0.0, (n - k) / r)
    return 1.0


def square(m, dur, vol, duty=0.5, vib=0.0, decay=0.0):
    n = int(dur * SR); f = hz(m); out = []; ph = 0.0
    for k in range(n):
        t = k / SR
        ff = f * (1 + vib * math.sin(2 * math.pi * 5.5 * t)) if vib else f
        ph = (ph + ff / SR) % 1.0
        v = 1.0 if ph < duty else -1.0
        e = env(k, n, 60, 400) * (math.exp(-decay * t) if decay else 1.0)
        out.append(v * vol * e)
    return out


def tri(m, dur, vol):
    n = int(dur * SR); f = hz(m); out = []; ph = 0.0
    for k in range(n):
        ph = (ph + f / SR) % 1.0
        v = 4 * abs(ph - 0.5) - 1
        out.append(v * vol * env(k, n, 40, 300))
    return out


def kick(vol=0.9):
    n = int(0.16 * SR); out = []; ph = 0.0
    for k in range(n):
        t = k / SR
        f = 45 + 110 * math.exp(-t * 38)
        ph += 2 * math.pi * f / SR
        out.append(math.sin(ph) * vol * math.exp(-t * 16))
    return out


def snare(vol=0.5):
    n = int(0.14 * SR); out = []; prev = 0.0
    for k in range(n):
        t = k / SR
        x = NOISE[(k * 7) % SR]
        hp = x - prev; prev = x                      # crude high-pass
        tone = math.sin(2 * math.pi * 190 * t) * math.exp(-t * 30)
        out.append((hp * 0.7 + tone * 0.5) * vol * math.exp(-t * 22))
    return out


def hat(vol=0.16, length=0.035):
    n = int(length * SR); out = []; prev = 0.0
    for k in range(n):
        x = NOISE[(k * 13 + 101) % SR]
        hp = x - prev; prev = x
        out.append(hp * vol * math.exp(-(k / SR) * 90))
    return out


def crash(vol=0.35, length=1.1):
    n = int(length * SR); out = []; prev = 0.0
    for k in range(n):
        x = NOISE[(k * 3 + 17) % SR]
        hp = x - prev; prev = x
        out.append(hp * vol * math.exp(-(k / SR) * 3.2))
    return out


def riser(dur, vol=0.22):
    """noise that gets louder and brighter: goes before a cut"""
    n = int(dur * SR); out = []; lp = 0.0
    for k in range(n):
        p = k / n
        x = NOISE[(k * 5 + 31) % SR]
        a = 0.02 + 0.6 * p * p
        lp += a * (x - lp)
        out.append(lp * vol * p * p)
    return out


# ---------- harmony: A minor, bars cycle Am F C G; the last bar lands on C major ----------
CH = {'Am': (45, [57, 60, 64]), 'F': (41, [53, 57, 60]), 'C': (48, [55, 60, 64]), 'G': (43, [55, 59, 62])}
PROG = ['Am', 'F', 'C', 'G'] * 3 + ['Am', 'F', 'G', 'C']
# lead melody, 8 eighth notes for each bar (0 = rest); two phrases of 4 bars
MEL_A = [[76, 0, 81, 0, 79, 76, 0, 72], [81, 0, 77, 0, 84, 0, 81, 0], [79, 0, 76, 79, 0, 84, 0, 79], [74, 0, 79, 0, 83, 81, 79, 0]]
MEL_B = [[88, 84, 81, 84, 88, 0, 86, 84], [89, 0, 84, 81, 84, 0, 89, 0], [91, 88, 84, 88, 91, 0, 88, 84], [86, 0, 83, 86, 91, 89, 86, 0]]
MEL_END = [[88, 84, 81, 84, 88, 0, 86, 84], [89, 0, 84, 81, 84, 0, 89, 0], [86, 0, 83, 86, 91, 0, 95, 0], [96, 0, 0, 0, 0, 0, 0, 0]]

for bar in range(BARS):
    t0 = bar * BAR
    name = PROG[bar]; root, tones = CH[name]
    intro = bar < 3
    finale = bar >= 12
    last = bar == BARS - 1
    full = not intro

    # bass: eighth notes, root and octave
    if not last:
        for e in range(8):
            m = root + (12 if e % 2 else 0)
            add(L, R, t0 + e * BEAT / 2, tri(m - 12 if m > 52 else m, BEAT / 2 * 0.9, 0.34 if full else 0.31))
    else:
        add(L, R, t0, tri(root - 12, BAR * 0.95, 0.4))

    # arpeggio: sixteenth notes through the chord, two octaves
    if not last:
        seq = tones + [tones[0] + 12, tones[1] + 12, tones[2] + 12]
        for s in range(16):
            if intro and bar == 0 and s >= 8 and s % 2:
                continue
            m = seq[(s * (1 if bar % 2 == 0 else 5)) % 6] + (12 if finale else 0)
            add(L, R, t0 + s * BEAT / 4, square(m, BEAT / 4 * 0.85, 0.075 if full else 0.085, duty=0.125, decay=9), pan=-0.45 if s % 2 else 0.45)

    # lead
    if full:
        mel = MEL_END[bar - 12] if finale else (MEL_A if (bar // 4) % 2 == 0 else MEL_B)[bar % 4]
        for e, m in enumerate(mel):
            if not m:
                continue
            dur = BEAT / 2 * 0.92
            if last:
                dur = BAR * 0.9
            add(L, R, t0 + e * BEAT / 2, square(m, dur, 0.15, duty=0.25, vib=0.004, decay=1.2 if last else 0), pan=0.1)
            if finale:  # octave below, quieter: a wider finale
                add(L, R, t0 + e * BEAT / 2, square(m - 12, dur, 0.07, duty=0.5, decay=1.2 if last else 0), pan=-0.2)

    # final chord stab
    if last:
        for m in (60, 64, 67, 72, 76):
            add(L, R, t0, square(m, BAR * 0.9, 0.07, duty=0.5, decay=1.6), pan=(m - 68) / 14)
        add(L, R, t0, kick(1.0)); add(L, R, t0, crash(0.45, 1.5))
        continue

    # drums
    for b in range(4):
        tb = t0 + b * BEAT
        if full or bar >= 1 or b % 2 == 0:
            add(L, R, tb, kick(0.9 if full else 0.7))
        if full and b % 2 == 1:
            add(L, R, tb, snare(0.5))
        if bar >= 1:
            for h in range(4 if full else 2):
                add(L, R, tb + h * BEAT / (4 if full else 2), hat(0.15 if h % 2 == 0 else 0.09), pan=0.3)
    if finale or bar in (7, 8, 9, 10, 11):  # extra off-beat kicks for drive
        add(L, R, t0 + 1.5 * BEAT, kick(0.55)); add(L, R, t0 + 3.5 * BEAT, kick(0.55))

# ---------- accents on the cuts (beats from the start; the same grid as post.html) ----------
CUTS = [12, 20, 30, 39, 48]          # 144, 240, 360, 468, 576 frames / 12
for cb in CUTS:
    tc = cb * BEAT
    add(L, R, tc - 2 * BEAT, riser(2 * BEAT, 0.26 if cb in (12, 48) else 0.16))
    add(L, R, tc, crash(0.38 if cb in (12, 48) else 0.24))
    for s in range(4):               # snare fill on the last beat before the cut
        add(L, R, tc - BEAT + s * BEAT / 4, snare(0.22 + 0.07 * s))

# ---------- mix: soft clip, normalise, short fade at the end ----------
peak = max(max(abs(x) for x in L), max(abs(x) for x in R))
g = 1.6 / peak
out = bytearray()
end = int(SR * BARS * BAR)
for i in range(N):
    f = 1.0 if i < end else max(0.0, 1 - (i - end) / (N - end))
    l = math.tanh(L[i] * g) * 0.89 * f
    r = math.tanh(R[i] * g) * 0.89 * f
    out += struct.pack('<hh', int(l * 32767), int(r * 32767))
path = sys.argv[1] if len(sys.argv) > 1 else 'music.wav'
with wave.open(path, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(bytes(out))
print('wrote', path, round(N / SR, 2), 's', 'peak before mix', round(peak, 3))
