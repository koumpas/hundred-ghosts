// Name filter for the leaderboard. The word lists are stored in ROT13, so this file does not show them in clear text.
// STRONG words are refused anywhere inside a name. SHORT words are refused only as a whole name or a whole part
// of it (parts are split at "-" and at digits), because they are inside many normal words ("class", "grape").
const rot13 = s => s.replace(/[a-z]/g, c => String.fromCharCode((c.charCodeAt(0) - 84) % 26 + 97));
const STRONG = 'shpx shx spx cuhpx fuvg ovgpu phag avtt arteb snttbg snttvg ergneq juber fyhg chffl nffubyr onfgneq jnax gjng xvxr puvax tbbx jrgonpx genaal qlxr anmv uvgyre urvy encvfg crqb cbea cravf intvan wvmm xxx ornare gbjryurnq enturnq yrfob furznyr obyybpx qbhpur fxnax qvyqb oybjwbo unaqwbo pbpxfhpx qvpxurnq zbgureshpx'.split(' ').map(rot13);
const SHORT = 'nff nefr phz pbpx qvpx fcvp pbba cnxv encr ubzb cevpx gvgf frk nany xlf ubr gubg zvys snt wrj'.split(' ').map(rot13);
const leet = s => s.replace(/[0134578@$!]/g, c => ({ 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', '@': 'a', $: 's', '!': 'i' }[c]));
// each strong word as a pattern that also takes stretched letters: "fuuuck", "niiigger"
const stretch = w => new RegExp(w.replace(/(.)\1*/g, (run, ch) => ch + '{' + run.length + ',}'));
const STRONG_RE = STRONG.map(stretch);
const SHORT_RE = SHORT.map(w => new RegExp('^' + stretch(w).source + '$'));   // whole name or whole part only
const short = t => !!t && SHORT_RE.some(re => re.test(t));
function isBadName(name) {
  const low = String(name).toLowerCase();
  for (const a of [low, low.replace(/1/g, 'l')]) {
    const n = leet(a).replace(/[^a-z]/g, '');
    if (STRONG_RE.some(re => re.test(n)) || short(n)) return true;
    for (const part of leet(a).split(/-+/)) if (short(part.replace(/[^a-z]/g, ''))) return true;
  }
  for (const part of low.split(/[-0-9]+/)) if (short(part)) return true;
  return false;
}
module.exports = { isBadName };
