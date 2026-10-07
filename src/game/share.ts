import type { GameMode } from '../types/game';

export interface ToupeeChallenge {
  mode: GameMode;
  score: number;
  hops: number;
  accuracy: number;
  stage: number;
}

function validMode(value: string | null): value is GameMode {
  return value === 'stage' || value === 'endless' || value === 'boss';
}

export function readToupeeChallenge(): ToupeeChallenge | null {
  const params = new URLSearchParams(window.location.search);
  const type = window.PokiSDK?.getURLParam?.('type') || params.get('type') || params.get('gdtype');
  if (type !== 'toupee_challenge') return null;
  const modeValue = window.PokiSDK?.getURLParam?.('mode') || params.get('mode') || params.get('gdmode');
  const mode = validMode(modeValue) ? modeValue : 'stage';
  const numeric = (key: string) => Number(window.PokiSDK?.getURLParam?.(key) || params.get(key) || params.get(`gd${key}`) || 0);
  return { mode, score: numeric('score'), hops: numeric('hops'), accuracy: numeric('accuracy'), stage: numeric('stage') };
}

export async function createToupeeShareUrl(challenge: ToupeeChallenge): Promise<string> {
  const params = {
    type: 'toupee_challenge',
    mode: challenge.mode,
    score: String(challenge.score),
    hops: String(challenge.hops),
    accuracy: String(challenge.accuracy),
    stage: String(challenge.stage),
  };
  try {
    const pokiUrl = await window.PokiSDK?.shareableURL?.(params);
    if (pokiUrl) return pokiUrl;
  } catch {
    // Keep the challenge shareable outside the Poki SDK environment.
  }
  const url = new URL(window.location.href);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}
