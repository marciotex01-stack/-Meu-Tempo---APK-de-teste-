import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { getQuestion, hasPin, isValidPin, setPin, verifyAnswer, verifyPin, VerifyResult } from './pin';

export const C = { navy: '#0f2a5c', blue: '#1565c0', purple: '#6c4bd8', green: '#1db37f', ink: '#1b2d55', mute: '#6f7d96', bg: '#f4f8fd', line: '#e4eaf3' };

const msgFor = (r: VerifyResult, what: string) =>
  r.lockedSeconds > 0
    ? `Muitas tentativas. Aguarde ${Math.ceil(r.lockedSeconds / 60)} min e tente de novo.`
    : `${what} incorreto. Restam ${r.triesLeft} tentativas.`;

function Btn({ label, onPress, ghost }: { label: string; onPress: () => void; ghost?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[s.btn, ghost && s.ghost]}>
      <Text style={[s.btnText, ghost && { color: C.purple }]}>{label}</Text>
    </Pressable>
  );
}

// Criar ou trocar o PIN, com pergunta de segurança para recuperação.
export function PinSetup({ onDone, title = 'Crie o PIN dos responsáveis' }: { onDone: () => void; title?: string }) {
  const [pin, setP] = useState('');
  const [pin2, setP2] = useState('');
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const [err, setErr] = useState('');
  const save = async () => {
    if (!isValidPin(pin)) return setErr('O PIN precisa ter de 4 a 6 números.');
    if (pin !== pin2) return setErr('Os dois PINs não são iguais.');
    if (q.trim().length < 3 || a.trim().length < 2) return setErr('Preencha a pergunta e a resposta de segurança.');
    await setPin(pin, q, a);
    onDone();
  };
  return (
    <View style={s.box}>
      <Text style={s.title}>🔐 {title}</Text>
      <Text style={s.sub}>Só quem sabe o PIN muda regras e bloqueios. Não compartilhe com a criança.</Text>
      <TextInput style={s.input} value={pin} onChangeText={setP} keyboardType="number-pad" secureTextEntry maxLength={6} placeholder="Novo PIN (4 a 6 números)" />
      <TextInput style={s.input} value={pin2} onChangeText={setP2} keyboardType="number-pad" secureTextEntry maxLength={6} placeholder="Repita o PIN" />
      <TextInput style={s.input} value={q} onChangeText={setQ} placeholder="Pergunta de segurança (só você sabe a resposta)" />
      <TextInput style={s.input} value={a} onChangeText={setA} placeholder="Resposta" autoCapitalize="none" />
      {!!err && <Text style={s.err}>{err}</Text>}
      <Btn label="Salvar PIN" onPress={save} />
    </View>
  );
}

export function Gate({ onOk }: { onOk: () => void }) {
  const [mode, setMode] = useState<'load' | 'setup' | 'verify' | 'forgot' | 'reset'>('load');
  const [pin, setP] = useState('');
  const [a, setA] = useState('');
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    hasPin().then((h) => setMode(h ? 'verify' : 'setup'));
  }, []);

  const enter = async () => {
    const r = await verifyPin(pin);
    setP('');
    r.ok ? onOk() : setErr(msgFor(r, 'PIN'));
  };
  const forgot = async () => {
    setQ(await getQuestion());
    setErr('');
    setMode('forgot');
  };
  const checkAnswer = async () => {
    const r = await verifyAnswer(a);
    r.ok ? setMode('reset') : setErr(msgFor(r, 'Resposta'));
  };

  if (mode === 'load') return null;
  if (mode === 'setup') return <PinSetup onDone={onOk} />;
  if (mode === 'reset') return <PinSetup title="Crie um novo PIN" onDone={onOk} />;
  if (mode === 'forgot')
    return (
      <View style={s.box}>
        <Text style={s.title}>Recuperar PIN</Text>
        <Text style={s.sub}>{q}</Text>
        <TextInput style={s.input} value={a} onChangeText={setA} placeholder="Sua resposta" autoCapitalize="none" />
        {!!err && <Text style={s.err}>{err}</Text>}
        <Btn label="Confirmar resposta" onPress={checkAnswer} />
        <Btn ghost label="Voltar" onPress={() => setMode('verify')} />
      </View>
    );
  return (
    <View style={s.box}>
      <Text style={s.title}>🔒 Área dos responsáveis</Text>
      <Text style={s.sub}>Digite o PIN para continuar.</Text>
      <TextInput style={[s.input, s.pinInput]} value={pin} onChangeText={setP} keyboardType="number-pad" secureTextEntry maxLength={6} placeholder="••••" onSubmitEditing={enter} />
      {!!err && <Text style={s.err}>{err}</Text>}
      <Btn label="Entrar" onPress={enter} />
      <Btn ghost label="Esqueci o PIN" onPress={forgot} />
    </View>
  );
}

const s = StyleSheet.create({
  box: { margin: 20, padding: 20, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: C.line, gap: 12 },
  title: { color: C.ink, fontSize: 19, fontWeight: '800' },
  sub: { color: C.mute, fontSize: 13, lineHeight: 19 },
  input: { backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 14, height: 48, color: C.ink, fontSize: 15 },
  pinInput: { fontSize: 24, letterSpacing: 10, textAlign: 'center', fontWeight: '800' },
  err: { color: '#c0392b', fontSize: 13 },
  btn: { backgroundColor: C.purple, borderRadius: 14, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  ghost: { backgroundColor: 'transparent' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
