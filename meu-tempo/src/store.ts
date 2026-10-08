import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppItem = { name: string; icon: string; color: string; enabled: boolean };
export type Day = { date: string; studySec: number; earnedSec: number };
export type State = {
  studyGoalMin: number;
  rewardMin: number;
  limitOn: boolean;
  limitMin: number;
  manualBlock: boolean;
  balanceSec: number;
  lastDate: string;
  studyApps: AppItem[];
  gameApps: AppItem[];
  days: Record<string, Day>;
};

const KEY = 'meu-tempo:v1';
const p = (n: number) => String(n).padStart(2, '0');
export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const initial: State = {
  studyGoalMin: 20,
  rewardMin: 60,
  limitOn: true,
  limitMin: 120,
  manualBlock: false,
  balanceSec: 0,
  lastDate: '',
  studyApps: [
    { name: 'Duolingo', icon: '🦉', color: '#72c238', enabled: true },
    { name: 'Google Classroom', icon: '🏫', color: '#55a342', enabled: true },
    { name: 'Khan Academy', icon: '🎓', color: '#20a4d8', enabled: true },
    { name: 'YouTube (apenas educativo)', icon: '▶', color: '#ef4444', enabled: false },
  ],
  gameApps: [
    { name: 'Roblox', icon: '⬡', color: '#202a3a', enabled: true },
    { name: 'Minecraft', icon: '🧱', color: '#6e9b3a', enabled: true },
    { name: 'Brawl Stars', icon: '⭐', color: '#f2bd2f', enabled: true },
    { name: 'Free Fire', icon: '🔥', color: '#f07a24', enabled: true },
  ],
  days: {},
};

// Cria o registro de hoje e zera o saldo de jogo quando o dia vira.
export function rollover(s: State): State {
  const t = todayKey();
  const days = s.days[t] ? s.days : { ...s.days, [t]: { date: t, studySec: 0, earnedSec: 0 } };
  return s.lastDate === t ? { ...s, days } : { ...s, days, lastDate: t, balanceSec: 0 };
}

export async function loadState(): Promise<State> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return rollover(raw ? { ...initial, ...JSON.parse(raw) } : initial);
  } catch {
    return rollover(initial);
  }
}

export const saveState = (s: State) => AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});

// Soma 1 segundo de estudo. A cada meta completa, credita a recompensa (respeitando o limite diário).
export function addStudySecond(s0: State): State {
  const s = rollover(s0);
  const t = todayKey();
  const d = s.days[t];
  const goal = Math.max(s.studyGoalMin, 1) * 60;
  const studySec = d.studySec + 1;
  let earned = d.earnedSec;
  let balance = s.balanceSec;
  if (studySec % goal === 0) {
    const room = s.limitOn ? s.limitMin * 60 - earned : Infinity;
    const add = Math.max(0, Math.min(s.rewardMin * 60, room));
    earned += add;
    balance += add;
  }
  return { ...s, balanceSec: balance, days: { ...s.days, [t]: { ...d, studySec, earnedSec: earned } } };
}
