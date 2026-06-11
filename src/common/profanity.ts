/**
 * Egyszerű trágárság-/sértőszó-szűrő a publikusan megjelenő nevekhez
 * (felhasználónév, webshop- és terméknevek, kategóriák).
 *
 * A bemenet normalizálása (kisbetűsítés, ékezetek eltávolítása, gyakori
 * leet-helyettesítések visszaalakítása, elválasztó karakterek elhagyása)
 * megnehezíti a szűrő kijátszását (pl. "f a s z", "g3ci").
 *
 * Két lista van:
 *  - SUBSTRING_WORDS: a normalizált, egybefűzött szövegben részszóként is
 *    tiltott kifejezések (csak olyan szavak, amelyek ártatlan szavakba
 *    jellemzően nem ágyazódnak be);
 *  - WHOLE_WORDS: csak önálló szóként tiltott kifejezések (pl. az angol
 *    "ass" a "class" miatt nem szűrhető részszóként).
 *
 * A lista szándékosan visszafogott terjedelmű; igény szerint bővíthető.
 */

const SUBSTRING_WORDS: string[] = [
  // magyar
  'geci',
  'kurva',
  'picsa',
  'csicska',
  'buzi',
  'fasz',
  'ribanc',
  'segg',
  'basz',
  'bazmeg',
  'bazdmeg',
  'kocsog',
  'punci',
  // angol
  'fuck',
  'shit',
  'bitch',
  'cunt',
  'asshole',
  'faggot',
  'nigger',
  'nigga',
  'whore',
  'slut',
  'wanker',
  'retard',
  'pussy',
  'dildo',
  'penis',
  'hitler',
];

const WHOLE_WORDS: string[] = [
  // magyar
  'fos',
  'pina',
  'szex',
  // angol
  'ass',
  'dick',
  'cock',
  'cum',
  'tit',
  'sex',
  'nazi',
  'porn',
];

const LEET_MAP: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  $: 's',
  '!': 'i',
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[013457@$!]/g, (ch) => LEET_MAP[ch] ?? ch);
}

export function containsProfanity(text: string): boolean {
  if (!text) {
    return false;
  }

  const normalized = normalize(text);
  const compact = normalized.replace(/[^a-z]/g, '');
  const tokens = normalized.split(/[^a-z]+/).filter(Boolean);

  if (SUBSTRING_WORDS.some((word) => compact.includes(word))) {
    return true;
  }

  return WHOLE_WORDS.some((word) => tokens.includes(word));
}
