import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '../components/Screen';
import { PageHeader, Section } from '../components/PageHeader';
import { Label, T, TextInput } from '../components/Text';
import { Icon } from '../components/Icon';
import { Card, HoldButton, PrimaryButton, Row, Segmented, StatusDot, Toggle } from '../components/ui';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';
import {
  AccountInfo, CloudPrefs, accountInfo, authError, deleteAccount, deleteCloudData, getCloudPrefs, logout, resetPassword,
  saveAccountWithEmail, setCloudPrefs, signInExisting, syncProfile,
} from '../lib/firebase';

/** Compte et sauvegarde : invité au départ, puis compte email si l'utilisateur le souhaite (option A). */
export default function Compte() {
  const [info, setInfo] = useState<AccountInfo | null>(null);
  const [prefs, setPrefs] = useState<CloudPrefs | null>(null);
  const [mode, setMode] = useState(0); // 0 = créer, 1 = déjà un compte
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pseudo, setPseudo] = useState('');
  const [delPass, setDelPass] = useState('');
  const [delMsg, setDelMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setInfo(await accountInfo());
    const p = await getCloudPrefs();
    setPrefs(p);
    setPseudo(p.pseudo);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function update(p: Partial<CloudPrefs>) {
    const n = await setCloudPrefs(p);
    setPrefs(n);
    syncProfile().catch(() => {});
  }
  useEffect(() => {
    if (!prefs || pseudo === prefs.pseudo) return;
    const id = setTimeout(() => update({ pseudo: pseudo.trim().slice(0, 24) }), 800);
    return () => clearTimeout(id);
  }, [pseudo]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit() {
    if (!email.includes('@') || pass.length < 6) return setMsg({ ok: false, text: 'Entre un email valide et un mot de passe de 6 caractères minimum.' });
    setBusy(true); setMsg(null);
    try {
      if (mode === 0) {
        await saveAccountWithEmail(email, pass);
        setMsg({ ok: true, text: 'Compte sauvegardé. Ton historique te suivra sur un nouveau téléphone.' });
      } else {
        const n = await signInExisting(email, pass);
        setMsg({ ok: true, text: n ? `Connecté. ${n} jour${n > 1 ? 's' : ''} d'historique récupéré${n > 1 ? 's' : ''}.` : 'Connecté.' });
      }
      haptic.success();
      setPass('');
      await load();
    } catch (e) {
      haptic.error();
      setMsg({ ok: false, text: authError(e) });
    }
    setBusy(false);
  }

  if (info && !info.configured) {
    return (
      <Screen nav={false}>
        <PageHeader title="Mon compte" subtitle="Sauvegarde" />
        <Card style={{ paddingVertical: 16 }}><T style={{ color: C.soft, lineHeight: 20 }}>La sauvegarde en ligne n'est pas configurée dans cette version : tout reste sur ton téléphone.</T></Card>
      </Screen>
    );
  }

  const isGuest = !info || info.anonymous;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen nav={false}>
        <PageHeader title="Mon compte" subtitle="Sauvegarde et classement" />

        <Card gold={!isGuest} style={{ paddingVertical: 16, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <StatusDot ok={!!prefs?.sync} />
            <View style={{ flex: 1 }}>
              <T style={{ fontSize: 15, fontFamily: F.medium }}>{!prefs?.sync ? 'Sauvegarde coupée' : isGuest ? 'Compte invité' : 'Compte sauvegardé'}</T>
              <T style={{ fontSize: 12, color: C.dim }}>{!prefs?.sync ? 'Tout reste sur ce téléphone' : isGuest ? 'Sauvegardé, mais lié à ce téléphone' : info?.email}</T>
            </View>
          </View>
          {isGuest && prefs?.sync && <T style={{ fontSize: 12, lineHeight: 18, color: C.soft, marginTop: 6 }}>Ajoute un email pour retrouver ta série et ton QR de tapis si tu changes de téléphone.</T>}
        </Card>

        {isGuest && (
          <>
            <Section>Sauvegarder mon compte</Section>
            <Segmented items={['Créer mon compte', "J'ai déjà un compte"]} value={mode} onChange={(i) => { setMode(i); setMsg(null); }} />
            <View style={st.field}>
              <TextInput value={email} onChangeText={setEmail} placeholder="Ton email" placeholderTextColor={C.faint} autoCapitalize="none" autoComplete="email"
                keyboardType="email-address" accessibilityLabel="Email" style={st.input} />
            </View>
            <View style={st.field}>
              <TextInput value={pass} onChangeText={setPass} placeholder="Mot de passe (6 caractères min.)" placeholderTextColor={C.faint} secureTextEntry
                autoComplete={mode === 0 ? 'new-password' : 'current-password'} accessibilityLabel="Mot de passe" style={st.input} />
            </View>
            {msg && <T style={{ fontSize: 13, lineHeight: 19, color: msg.ok ? C.goldBright : C.warn }}>{msg.text}</T>}
            {busy ? <ActivityIndicator color={C.gold} style={{ height: 58 }} /> : (
              <PrimaryButton title={mode === 0 ? 'Sauvegarder mon compte' : 'Me connecter et récupérer'} onPress={submit} />
            )}
            {mode === 1 && (
              <Pressable onPress={async () => { try { await resetPassword(email); setMsg({ ok: true, text: 'Email de réinitialisation envoyé.' }); } catch (e) { setMsg({ ok: false, text: authError(e) }); } }}
                style={{ alignSelf: 'center', padding: 6 }} accessibilityRole="button">
                <T style={{ fontSize: 13, color: C.gold }}>Mot de passe oublié</T>
              </Pressable>
            )}
          </>
        )}
        {!isGuest && msg && <T style={{ fontSize: 13, color: msg.ok ? C.goldBright : C.warn }}>{msg.text}</T>}

        <Section>Classement</Section>
        <Card>
          <View style={[st.row, st.line]}>
            <T style={{ fontSize: 14, flex: 1 }}>Pseudo</T>
            <TextInput value={pseudo} onChangeText={setPseudo} placeholder="Ex. Abdou" placeholderTextColor={C.faint} maxLength={24}
              accessibilityLabel="Pseudo" style={[st.input, { flex: 1.3, textAlign: 'right', height: 44 }]} />
          </View>
          <Row last title="Apparaître dans le classement" sub={pseudo.trim() ? 'Seuls ton pseudo, ton % Noor et ta série sont visibles' : 'Choisis d’abord un pseudo'}
            right={<Toggle value={!!prefs?.leaderboard && !!pseudo.trim()} label="Apparaître dans le classement" onChange={(v) => pseudo.trim() && update({ leaderboard: v, pseudo: pseudo.trim() })} />} />
        </Card>

        <Section>Confidentialité</Section>
        <Card style={{ paddingVertical: 16, gap: 12 }}>
          <Label style={{ fontSize: 10 }}>Envoyé en ligne</Label>
          <T style={{ fontSize: 13, lineHeight: 20, color: C.soft }}>Ton pseudo, la ville choisie, ton % Noor, tes séries et la liste des prières validées chaque jour (sans l'heure).</T>
          <Label style={{ fontSize: 10, color: C.dim }}>Reste sur ton téléphone</Label>
          <T style={{ fontSize: 13, lineHeight: 20, color: C.soft }}>Les heures de scan, ta position GPS, les photos de preuve, tes réglages.</T>
        </Card>
        <Card>
          <Row last={isGuest} title="Sauvegarde en ligne" sub={prefs?.sync ? 'Activée' : 'Coupée : rien n’est envoyé'}
            right={<Toggle value={!!prefs?.sync} label="Sauvegarde en ligne" onChange={(v) => update({ sync: v, ...(v ? {} : { leaderboard: false }) })} />} />
          {!isGuest && <Row last title="Se déconnecter" sub="Tes données restent sur ce téléphone" onPress={async () => { await logout(); await load(); }} right={<Icon name="chevron" size={16} color={C.faint} />} />}
        </Card>

        <View style={{ alignItems: 'center', gap: 8, marginTop: 6 }}>
          <HoldButton label="SUPPRIMER MES DONNÉES EN LIGNE" width={330} duration={2000}
            onDone={async () => { await deleteCloudData(); await load(); setMsg({ ok: true, text: 'Tes données en ligne ont été supprimées.' }); }} />
          <T style={{ fontSize: 11, color: C.faint, textAlign: 'center' }}>Appui long. Ton compte reste, ton téléphone garde son historique.</T>
        </View>

        {/* Réservé aux comptes email : un compte invité est une session, pas un compte créé.
            Pour lui, « Supprimer mes données en ligne » ci-dessus fait déjà le travail. */}
        {!isGuest && (
          <>
            <Section>Supprimer mon compte</Section>
            <Card style={{ paddingVertical: 16, gap: 12 }}>
              <T style={{ fontSize: 13, lineHeight: 20, color: C.soft }}>
                Ton compte, ton email, tes données en ligne et ta place dans le classement sont effacés définitivement. L’historique déjà enregistré sur ce téléphone est conservé.
              </T>
              <View style={st.field}>
                <TextInput value={delPass} onChangeText={setDelPass} placeholder="Ton mot de passe, pour confirmer" placeholderTextColor={C.faint} secureTextEntry
                  autoComplete="current-password" accessibilityLabel="Mot de passe pour supprimer le compte" style={st.input} />
              </View>
              {delMsg && <T style={{ fontSize: 13, lineHeight: 19, color: delMsg.ok ? C.goldBright : C.warn }}>{delMsg.text}</T>}
              <View style={{ alignItems: 'center', gap: 8 }}>
                <HoldButton label="SUPPRIMER MON COMPTE" width={330} duration={2500}
                  onDone={async () => {
                    if (delPass.length < 6) { haptic.error(); setDelMsg({ ok: false, text: 'Entre ton mot de passe pour confirmer la suppression.' }); return; }
                    setDelMsg(null);
                    try {
                      await deleteAccount(delPass);
                      setDelPass('');
                      haptic.success();
                      await load();
                      setDelMsg({ ok: true, text: 'Ton compte et tes données en ligne ont été supprimés.' });
                    } catch (e) {
                      haptic.error();
                      setDelMsg({ ok: false, text: authError(e) });
                    }
                  }} />
                <T style={{ fontSize: 11, color: C.faint, textAlign: 'center' }}>Appui long. Cette action est définitive.</T>
              </View>
            </Card>
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' },
  input: { flex: 1, height: 50, color: C.text, fontFamily: F.regular, fontSize: 15 },
  row: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
});
