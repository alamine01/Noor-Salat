import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Screen } from '../components/Screen';
import { PageHeader, Section } from '../components/PageHeader';
import { T } from '../components/Text';
import { Icon } from '../components/Icon';
import { C, F } from '../lib/theme';
import { haptic } from '../lib/haptics';

type QA = { q: string; a: string };
const GROUPS: { title: string; items: QA[] }[] = [
  {
    title: 'L’essentiel',
    items: [
      { q: 'Comment fonctionne Noor Salat ?', a: 'À l’heure de chaque prière, tu reçois l’adhan. 5 minutes après, les applis que tu as choisies se mettent en pause. Pour les retrouver, tu fais ta prière, puis tu scannes le QR collé sur ton tapis : la prière est validée et tes applis reviennent.' },
      { q: 'Où trouver mon QR de tapis ?', a: 'Dans Profil (le ن en haut de l’Accueil), onglet « Mon QR ». Imprime-le, ou affiche-le sur un autre écran, et colle-le sur ton tapis de prière. Il est unique : un autre QR ne débloque pas ton téléphone.' },
      { q: 'Je n’ai pas mon tapis avec moi', a: 'Sur l’écran du scan, touche « Pas de tapis ici ? Lire 5 versets ». Une fois les versets lus, la prière est validée et tes applis reviennent. Ça marche aussi sans internet.' },
      { q: 'Ça marche sans internet ?', a: 'Oui : les heures de prière, le scan, la lecture du Coran et les versets fonctionnent hors ligne. Ta sauvegarde en ligne se met à jour dès qu’internet revient.' },
    ],
  },
  {
    title: 'Blocage des applis',
    items: [
      { q: 'Quand mes applis sont-elles bloquées ?', a: 'Pour Dhuhr, Asr, Maghrib et Isha : de 5 minutes après l’adhan jusqu’à 60 minutes plus tard, ou jusqu’à ce que tu valides la prière. Pour le Fajr : dès ton réveil, pendant 90 minutes ou jusqu’au scan.' },
      { q: 'Comment choisir les applis à bloquer ?', a: 'Réglages › Blocage à l’heure de la prière › Applis à bloquer. Sur iPhone, choisis des applis ou des catégories entières dans la liste d’Apple, puis valide avec la coche.' },
      { q: 'J’ai ouvert Noor Salat mais mes applis restent bloquées', a: 'C’est voulu : ouvrir l’appli ne suffit pas. Seuls le scan du tapis, la lecture des versets ou la fin du créneau les libèrent.' },
    ],
  },
  {
    title: 'Réveil du Fajr',
    items: [
      { q: 'Le réveil continue de sonner après « Arrêter »', a: 'Oui, il resonne chaque minute tant que la prière n’est pas validée. Lève-toi, prie, puis scanne ton tapis (ou lis les versets) : tous les réveils de ce matin s’arrêtent.' },
      { q: 'Comment régler l’heure et le son ?', a: 'Réglages › Réveil Fajr : quelques minutes avant ou après l’heure du Fajr, le son, et les squats si tu veux être sûr d’être bien réveillé.' },
    ],
  },
  {
    title: 'Focus et Taqwa',
    items: [
      { q: 'À quoi sert Focus ?', a: 'À mettre tes applis en pause en dehors des prières, pour travailler ou étudier. Tu choisis la durée, puis tu ne peux faire une pause ou arrêter qu’après avoir lu des versets.' },
      { q: 'Comment régler la difficulté de Focus ?', a: 'Réglages › Session Focus : Facile (3 versets), Moyen (5 versets et 30 secondes d’attente) ou Difficile (10 versets et 1 minute d’attente). Le niveau est figé pendant une session.' },
      { q: 'Qu’est-ce qu’un engagement Taqwa ?', a: 'Tu actives le filtre des sites pour adultes pour un nombre de jours au choix. Pendant ce temps, il ne peut pas être coupé depuis l’appli. Pour annuler avant la fin : une page du Coran à lire, puis 3 heures d’attente.' },
    ],
  },
  {
    title: 'Progrès',
    items: [
      { q: 'Que veut dire le % Noor ?', a: 'La part de prières validées sur tes 7 derniers jours : 35 prières possibles. 28 validées donnent 80 %.' },
      { q: 'Comment fonctionne la série ?', a: 'Elle compte les jours d’affilée où tu as validé les 5 prières. Un jour incomplet la remet à zéro ; les jours de dispense, eux, ne la cassent pas.' },
    ],
  },
  {
    title: 'Pour les sœurs',
    items: [
      { q: 'Comment fonctionne la dispense ?', a: 'Pendant tes règles ou après un accouchement, active la dispense (Accueil › Dispense). Plus de blocage, de réveil ni de rappel de prière ; ta série et ton Noor restent intacts. Quand tu reprends, touche « C’est terminé ». C’est toi qui décides quand elle commence et finit.' },
      { q: 'Mes informations sont-elles partagées ?', a: 'Non. Les dates de dispense et le suivi du cycle restent uniquement sur ton téléphone. Ils ne sont jamais envoyés ni sauvegardés en ligne.' },
    ],
  },
];

export default function Aide() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Screen nav={false}>
      <PageHeader title="Comment ça marche" subtitle="Les réponses aux questions fréquentes" />
      {GROUPS.map((g) => (
        <View key={g.title} style={{ gap: 10 }}>
          <Section>{g.title}</Section>
          <View style={st.card}>
            {g.items.map((it, i) => {
              const on = open === it.q;
              return (
                <View key={it.q} style={i < g.items.length - 1 ? st.line : undefined}>
                  <Pressable onPress={() => { haptic.tap(); setOpen(on ? null : it.q); }} accessibilityRole="button" accessibilityState={{ expanded: on }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }}>
                    <T style={{ flex: 1, fontSize: 15, fontFamily: on ? F.medium : F.regular, color: on ? C.goldBright : C.text }}>{it.q}</T>
                    <View style={{ transform: [{ rotate: on ? '90deg' : '0deg' }] }}><Icon name="chevron" size={16} color={C.faint} /></View>
                  </Pressable>
                  {on && <T style={{ fontSize: 14, lineHeight: 22, color: C.soft, paddingBottom: 16 }}>{it.a}</T>}
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const st = StyleSheet.create({
  card: { borderRadius: 24, paddingHorizontal: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  line: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
});
