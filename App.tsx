import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Switch, Text, View } from 'react-native';
import { C, Gate, PinSetup } from './src/Gate';
import { addStudySecond, AppItem, loadState, saveState, State, todayKey } from './src/store';

type Tab = 'home' | 'history' | 'settings' | 'parents';
const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const mmss = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
const hm = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}min` : `${min}min`);

function lastDays(s: State, n: number) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out.push({ key, dow: DOW[d.getDay()], day: d.getDate(), study: s.days[key]?.studySec ?? 0, earned: s.days[key]?.earnedSec ?? 0 });
  }
  return out;
}

function Stepper({ value, unit, onChange, min, max, step }: { value: number; unit: string; onChange: (v: number) => void; min: number; max: number; step: number }) {
  return (
    <View style={st.stepper}>
      <Pressable style={st.stepBtn} onPress={() => onChange(Math.max(min, value - step))}><Text style={st.stepTxt}>−</Text></Pressable>
      <Text style={st.stepVal}>{value} {unit}</Text>
      <Pressable style={st.stepBtn} onPress={() => onChange(Math.min(max, value + step))}><Text style={st.stepTxt}>+</Text></Pressable>
    </View>
  );
}

function AppList({ title, sub, items, onToggle, tint }: { title: string; sub: string; items: AppItem[]; onToggle: (i: number) => void; tint: string }) {
  return (
    <View style={[st.card, { backgroundColor: tint }]}>
      <Text style={st.cardTitle}>{title} <Text style={st.badge}>{items.filter((a) => a.enabled).length} selecionados</Text></Text>
      <Text style={st.cardSub}>{sub}</Text>
      {items.map((a, i) => (
        <View key={a.name} style={st.appRow}>
          <View style={[st.appIcon, { backgroundColor: a.color }]}><Text style={{ color: '#fff' }}>{a.icon}</Text></View>
          <Text style={st.appName}>{a.name}</Text>
          <Switch value={a.enabled} onValueChange={() => onToggle(i)} trackColor={{ true: C.green, false: '#d7dce7' }} thumbColor="#fff" />
        </View>
      ))}
    </View>
  );
}

export default function App() {
  const [s, setS] = useState<State | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [unlocked, setUnlocked] = useState(false);
  const [studying, setStudying] = useState(false);
  const [changingPin, setChangingPin] = useState(false);
  const [histTab, setHistTab] = useState<'all' | 'day' | 'week'>('all');
  const loaded = useRef(false);

  useEffect(() => { loadState().then((x) => { loaded.current = true; setS(x); }); }, []);
  useEffect(() => { if (s && loaded.current) saveState(s); }, [s]);

  useEffect(() => {
    if (!studying) return;
    const t = setInterval(() => {
      setS((cur) => {
        if (!cur) return cur;
        const next = addStudySecond(cur);
        if (next.balanceSec > cur.balanceSec) setTimeout(() => Alert.alert('Meta concluída! 🎉', 'Você ganhou tempo de jogo.'), 0);
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [studying]);

  if (!s) return <View style={st.root} />;
  const upd = (patch: Partial<State>) => setS((c) => (c ? { ...c, ...patch } : c));
  const toggle = (k: 'studyApps' | 'gameApps', i: number) => upd({ [k]: s[k].map((a, j) => (j === i ? { ...a, enabled: !a.enabled } : a)) });
  const go = (t: Tab) => { if (t === 'home' || t === 'history') { setUnlocked(false); setChangingPin(false); } setTab(t); };

  const goal = s.studyGoalMin * 60;
  const today = s.days[todayKey()] ?? { studySec: 0, earnedSec: 0 };
  const inGoal = today.studySec % goal;
  const goalDone = today.studySec >= goal;
  const pct = goalDone ? 1 : inGoal / goal;
  const days = lastDays(s, 7);
  const weekStudy = Math.round(days.reduce((a, d) => a + d.study, 0) / 60);
  const weekGame = Math.round(days.reduce((a, d) => a + d.earned, 0) / 60);

  const header = (sub: string) => (
    <View style={st.header}><Text style={st.trophy}>🏆</Text><View style={{ flex: 1 }}><Text style={st.brand}>Meu Tempo</Text><Text style={st.brandSub}>{sub}</Text></View><Text style={st.hi}>Olá! 👑{'\n'}<Text style={st.hiSub}>Você consegue!</Text></Text></View>
  );

  const home = (
    <ScrollView contentContainerStyle={st.pad}>
      <View style={st.card}>
        <Text style={st.cardTitle}>📚 Tempo de Estudo</Text>
        <Text style={st.cardSub}>Estude para acumular tempo de jogo.</Text>
        <Text style={st.big}>{mmss(goalDone ? goal : inGoal)}<Text style={st.cardSub}>  de {s.studyGoalMin} minutos</Text></Text>
        <View style={st.track}><View style={[st.fill, { width: `${Math.max(pct * 100, 3)}%` }]} /></View>
        <Text style={st.ok}>{goalDone ? '✓ Meta de hoje atingida!' : `Faltam ${mmss(goal - inGoal)} para liberar o jogo`}</Text>
        <Pressable style={st.primary} onPress={() => setStudying((v) => !v)}><Text style={st.primaryTxt}>{studying ? 'Pausar estudo' : 'Começar a estudar'}</Text></Pressable>
        <Text style={st.hint}>Nesta versão de teste o tempo conta com o app aberto. A medição automática dos apps de estudo vem na próxima etapa.</Text>
      </View>
      <View style={[st.card, { backgroundColor: '#f1edff' }]}>
        <Text style={st.cardTitle}>🎮 Recompensa</Text>
        <Text style={st.cardSub}>Após {s.studyGoalMin} minutos de estudo, você ganha {s.rewardMin} minutos de jogo.</Text>
        <Text style={[st.big, { color: C.purple }]}>{Math.floor(s.balanceSec / 60)} min <Text style={st.cardSub}>de jogo hoje</Text></Text>
        <Text style={st.cardSub}>{s.manualBlock ? '🔒 Jogos bloqueados pelos responsáveis.' : s.balanceSec > 0 ? 'Tempo liberado!' : 'Ainda não liberado. Complete o tempo de estudo.'}</Text>
      </View>
      <View style={st.row}>
        <View style={[st.card, st.half, { backgroundColor: '#e8f8f1' }]}><Text style={st.cardTitle}>Apps de Estudo</Text>{s.studyApps.filter((a) => a.enabled).map((a) => <Text key={a.name} style={st.cardSub}>{a.icon} {a.name}</Text>)}</View>
        <View style={[st.card, st.half, { backgroundColor: '#e8f1fd' }]}><Text style={st.cardTitle}>Apps de Jogos</Text>{s.gameApps.filter((a) => a.enabled).map((a) => <Text key={a.name} style={st.cardSub}>{a.icon} {a.name}</Text>)}</View>
      </View>
    </ScrollView>
  );

  const history = (
    <ScrollView contentContainerStyle={st.pad}>
      <View style={st.seg}>{([['all', 'Resumo Geral'], ['day', 'Por Dia'], ['week', 'Por Semana']] as const).map(([k, l]) => (
        <Pressable key={k} onPress={() => setHistTab(k)} style={[st.segBtn, histTab === k && st.segOn]}><Text style={[st.segTxt, histTab === k && { color: '#fff' }]}>{l}</Text></Pressable>
      ))}</View>
      {histTab === 'all' && (<>
        <View style={st.row}>
          <View style={[st.card, st.half, { backgroundColor: '#e8f8f1' }]}><Text style={st.cardSub}>📚 Estudo (7 dias)</Text><Text style={st.big}>{hm(weekStudy)}</Text><Text style={st.cardSub}>Hoje: {Math.round(today.studySec / 60)}min{goalDone ? ' (meta atingida)' : ''}</Text></View>
          <View style={[st.card, st.half, { backgroundColor: '#f1edff' }]}><Text style={st.cardSub}>🎮 Jogo (7 dias)</Text><Text style={st.big}>{hm(weekGame)}</Text><Text style={st.cardSub}>Hoje: {Math.round(today.earnedSec / 60)}min liberados</Text></View>
        </View>
        <View style={st.card}><Text style={st.cardTitle}>🎯 Metas do Dia</Text>
          <Text style={st.cardSub}>Estudo {Math.min(Math.round(today.studySec / 60), s.studyGoalMin)} / {s.studyGoalMin} min</Text>
          <View style={st.track}><View style={[st.fill, { width: `${Math.min(today.studySec / goal, 1) * 100}%` }]} /></View>
        </View>
      </>)}
      {histTab === 'week' && (
        <View style={st.card}><Text style={st.cardTitle}>Estudo nos últimos 7 dias</Text>
          <View style={st.bars}>{[...days].reverse().map((d) => (
            <View key={d.key} style={st.barCol}><View style={[st.bar, { height: Math.max(4, Math.min(d.study / goal, 1.5) * 80) }]} /><Text style={st.cardSub}>{d.dow}</Text></View>
          ))}</View>
        </View>
      )}
      {histTab !== 'week' && (
        <View style={st.card}><Text style={st.cardTitle}>Histórico de Atividades</Text>
          {days.slice(0, histTab === 'day' ? 7 : 5).map((d) => (
            <View key={d.key} style={st.hRow}>
              <Text style={st.hDay}>{d.day}{'\n'}{d.dow}</Text>
              <Text style={st.hCell}>📖 {Math.round(d.study / 60)} min</Text>
              <Text style={st.hCell}>🎮 {Math.round(d.earned / 60)} min</Text>
              <Text style={[st.hStat, d.study === 0 && { color: C.mute }]}>{d.study >= goal ? '✓ Meta atingida' : d.study > 0 ? '✓ Meta parcial' : 'Sem estudo'}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const settings = (
    <ScrollView contentContainerStyle={st.pad}>
      <View style={st.card}><Text style={st.cardTitle}>⏱️ Regras de Uso</Text><Text style={st.cardSub}>Quanto estudo libera quanto jogo.</Text>
        <Text style={st.label}>Tempo de estudo</Text><Stepper value={s.studyGoalMin} unit="min" min={5} max={120} step={5} onChange={(v) => upd({ studyGoalMin: v })} />
        <Text style={st.label}>Tempo de recompensa</Text><Stepper value={s.rewardMin} unit="min" min={5} max={180} step={5} onChange={(v) => upd({ rewardMin: v })} />
      </View>
      <AppList title="🎓 Apps de Estudo" sub="Contam como tempo de estudo." items={s.studyApps} onToggle={(i) => toggle('studyApps', i)} tint="#eefaf5" />
      <AppList title="🎮 Apps de Jogos" sub="Usam o tempo de recompensa." items={s.gameApps} onToggle={(i) => toggle('gameApps', i)} tint="#f5f2ff" />
      <View style={st.card}><Text style={st.cardTitle}>⏲️ Limite Diário de Jogos</Text><Text style={st.cardSub}>Máximo por dia, mesmo que a criança estude muito.</Text>
        <View style={st.appRow}><View style={{ flex: 1 }}><Stepper value={s.limitMin} unit="min" min={15} max={480} step={15} onChange={(v) => upd({ limitMin: v })} /></View><Switch value={s.limitOn} onValueChange={(v) => upd({ limitOn: v })} trackColor={{ true: C.green, false: '#d7dce7' }} thumbColor="#fff" /></View>
      </View>
    </ScrollView>
  );

  const parents = changingPin ? <ScrollView><PinSetup title="Novo PIN" onDone={() => { setChangingPin(false); Alert.alert('PIN alterado'); }} /></ScrollView> : (
    <ScrollView contentContainerStyle={st.pad}>
      <View style={st.card}><Text style={st.cardTitle}>🛡️ Bloqueio Manual</Text><Text style={st.cardSub}>Bloqueie ou libere os apps de jogos na hora. A criança não consegue desfazer sem o PIN.</Text>
        <Pressable style={[st.primary, s.manualBlock && { backgroundColor: C.green }]} onPress={() => upd({ manualBlock: !s.manualBlock })}><Text style={st.primaryTxt}>{s.manualBlock ? 'Liberar apps de jogos' : 'Bloquear apps de jogos'}</Text></Pressable>
        <Text style={st.hint}>Nesta versão de teste o bloqueio muda o estado do app. O bloqueio real dos apps no Android vem na próxima etapa.</Text>
      </View>
      <View style={st.card}><Text style={st.cardTitle}>🔐 PIN de acesso</Text><Text style={st.cardSub}>PIN ativo. Troque se a criança descobrir.</Text>
        <Pressable style={st.primary} onPress={() => setChangingPin(true)}><Text style={st.primaryTxt}>Alterar PIN</Text></Pressable>
      </View>
      <Pressable style={st.ghostBtn} onPress={() => go('home')}><Text style={{ color: C.purple, fontWeight: '800' }}>Sair da área dos responsáveis</Text></Pressable>
    </ScrollView>
  );

  const locked = (tab === 'settings' || tab === 'parents') && !unlocked;
  const body = locked ? <ScrollView><Gate onOk={() => setUnlocked(true)} /></ScrollView> : tab === 'home' ? home : tab === 'history' ? history : tab === 'settings' ? settings : parents;
  const subs: Record<Tab, string> = { home: 'Estudo hoje, diversão depois!', history: 'Histórico de estudos e jogos', settings: 'Configurações dos Pais/Responsáveis', parents: 'Área dos Pais/Responsáveis' };
  const tabs: [Tab, string, string][] = [['home', '🏠', 'Início'], ['history', '📊', 'Histórico'], ['settings', '⚙️', 'Configurações'], ['parents', '🛡️', 'Pais/Resp.']];

  return (
    <View style={st.root}>
      <StatusBar style="light" />
      {header(subs[tab])}
      <View style={{ flex: 1 }}>{body}</View>
      <View style={st.tabBar}>{tabs.map(([k, i, l]) => (
        <Pressable key={k} style={st.tab} onPress={() => go(k)}><Text style={{ fontSize: 20 }}>{i}</Text><Text style={[st.tabLbl, tab === k && { color: C.blue }]}>{l}</Text></Pressable>
      ))}</View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.navy, paddingTop: (Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 24 : 44) + 12, paddingBottom: 18, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  trophy: { fontSize: 34 }, brand: { color: '#fff', fontSize: 24, fontWeight: '800' }, brandSub: { color: '#c9d6f2', fontSize: 12, marginTop: 2 },
  hi: { color: '#fff', fontWeight: '800', fontSize: 14, textAlign: 'right' }, hiSub: { fontWeight: '400', fontSize: 12, color: '#c9d6f2' },
  pad: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.line, gap: 6 },
  half: { flex: 1 }, row: { flexDirection: 'row', gap: 12 },
  cardTitle: { color: C.ink, fontSize: 16, fontWeight: '800' }, cardSub: { color: C.mute, fontSize: 12, lineHeight: 17 },
  badge: { color: C.green, fontSize: 11, fontWeight: '700' },
  big: { color: C.ink, fontSize: 30, fontWeight: '800', marginVertical: 2 },
  track: { height: 12, backgroundColor: '#e3eaf4', borderRadius: 8, overflow: 'hidden', marginTop: 4 }, fill: { height: 12, backgroundColor: C.green, borderRadius: 8 },
  ok: { color: '#12805a', fontWeight: '700', fontSize: 13, marginTop: 4 },
  primary: { backgroundColor: C.purple, minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10 }, primaryTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  ghostBtn: { alignItems: 'center', padding: 14 },
  hint: { color: C.mute, fontSize: 11, lineHeight: 16, marginTop: 6 },
  seg: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: C.line },
  segBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' }, segOn: { backgroundColor: C.blue }, segTxt: { color: C.mute, fontWeight: '700', fontSize: 12 },
  hRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f0f3f8' },
  hDay: { width: 42, color: C.ink, fontWeight: '800', fontSize: 13 }, hCell: { flex: 1, color: C.ink, fontSize: 12 }, hStat: { color: '#12805a', fontWeight: '700', fontSize: 11, width: 92, textAlign: 'right' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 110, marginTop: 10 }, barCol: { alignItems: 'center', gap: 4 }, bar: { width: 26, backgroundColor: C.blue, borderRadius: 6 },
  label: { color: C.mute, fontSize: 12, marginTop: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.bg, borderRadius: 14, padding: 6 },
  stepBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line }, stepTxt: { fontSize: 22, color: C.purple, fontWeight: '800' }, stepVal: { color: C.ink, fontWeight: '800', fontSize: 16 },
  appRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 }, appIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, appName: { flex: 1, color: C.ink, fontSize: 13, fontWeight: '600' },
  tabBar: { height: 66, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.line, flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }, tabLbl: { color: C.mute, fontSize: 10, fontWeight: '700' },
});
