import { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { Screen } from '../components/Screen';
import { PageHeader, Section } from '../components/PageHeader';
import { Ar, T } from '../components/Text';
import { Icon, IconName } from '../components/Icon';
import { Card, GhostButton, PrimaryButton, Rise } from '../components/ui';
import { C, F } from '../lib/theme';
import { HOPE_NOUR_DEFAUT, HopeNourConfig, hopeNourCache, loadHopeNour } from '../lib/hopenour';

// TEXTES À COMPLÉTER par l'équipe Hope Nour (présentation, actions, chiffres).
const PRESENTATION =
  'Hope Nour est l’association à l’origine de Noor Salat. Nous menons des actions sociales au Sénégal, au service de ceux qui en ont le plus besoin.';

const ACTIONS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'drop', title: 'Creuser des puits', text: 'Apporter l’eau potable aux villages qui en manquent, pour boire, cultiver et faire les ablutions.' },
  { icon: 'heart', title: 'Actions sociales', text: 'Aide aux familles, aux daaras et aux plus démunis, notamment pendant le Ramadan et la Tabaski.' },
];

export default function HopeNour() {
  const [cfg, setCfg] = useState<HopeNourConfig>(HOPE_NOUR_DEFAUT);
  useEffect(() => {
    let alive = true;
    hopeNourCache().then((c) => alive && setCfg(c));
    loadHopeNour().then((c) => alive && setCfg(c));
    return () => { alive = false; };
  }, []);

  const open = (url: string) => Linking.openURL(url).catch(() => {});
  const whatsapp = () => open(`https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent('Salam, je voudrais en savoir plus sur Hope Nour.')}`);

  return (
    <Screen nav={false}>
      <PageHeader title="Hope Nour" subtitle="L’association derrière Noor Salat" />

      <Rise delay={60}>
        <Card gold style={{ paddingVertical: 22, alignItems: 'center', gap: 10 }}>
          <Ar style={{ fontSize: 24, lineHeight: 40, textAlign: 'center', color: C.goldBright }}>وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ</Ar>
          <T style={{ fontSize: 14, lineHeight: 21, color: C.soft, textAlign: 'center', fontFamily: F.serifItalic }}>
            « Et Nous avons fait de l’eau toute chose vivante. »
          </T>
          <T style={{ fontSize: 11, color: C.faint, letterSpacing: 1 }}>SOURATE AL-ANBIYA · 21:30</T>
        </Card>
      </Rise>

      <Section>Qui sommes-nous</Section>
      <Card style={{ paddingVertical: 16 }}>
        <T style={{ fontSize: 14, lineHeight: 22, color: C.soft }}>{PRESENTATION}</T>
      </Card>

      <Section>Nos actions</Section>
      <Card style={{ paddingVertical: 6 }}>
        {ACTIONS.map((a, i) => (
          <View key={a.title} style={{ flexDirection: 'row', gap: 14, paddingVertical: 14, borderBottomWidth: i < ACTIONS.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={a.icon} size={20} color={C.gold} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <T style={{ fontSize: 15, fontFamily: F.medium }}>{a.title}</T>
              <T style={{ fontSize: 13, lineHeight: 19, color: C.dim }}>{a.text}</T>
            </View>
          </View>
        ))}
      </Card>

      <Section>Soutenir Hope Nour</Section>
      {cfg.donsActifs ? (
        <Card style={{ paddingVertical: 18, gap: 12 }}>
          <T style={{ fontSize: 14, lineHeight: 21, color: C.soft }}>
            Chaque don va directement à l’association et à ses projets. Le paiement se fait sur le site de Hope Nour (Wave, Orange Money ou carte).
          </T>
          <PrimaryButton gold icon="heart" title="Faire un don" onPress={() => open(cfg.lienDon)} />
        </Card>
      ) : (
        <Card style={{ paddingVertical: 18, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="clock" size={18} color={C.gold} />
            <T style={{ fontSize: 15, fontFamily: F.medium, color: C.goldBright }}>Dons bientôt disponibles</T>
          </View>
          <T style={{ fontSize: 14, lineHeight: 21, color: C.soft }}>
            Hope Nour est en cours de légalisation. Dès que ce sera fait, vous pourrez donner ici, en toute transparence.
          </T>
        </Card>
      )}

      {(cfg.whatsapp || cfg.email || cfg.site) ? (
        <View style={{ gap: 10 }}>
          {cfg.whatsapp ? <GhostButton icon="phone" title="Nous écrire sur WhatsApp" onPress={whatsapp} /> : null}
          {cfg.email ? <GhostButton icon="mail" title="Nous écrire par e-mail" onPress={() => open(`mailto:${cfg.email}`)} /> : null}
          {cfg.site ? <GhostButton icon="share" title="Voir le site de Hope Nour" onPress={() => open(cfg.site)} /> : null}
        </View>
      ) : null}

      <T style={{ fontSize: 12, lineHeight: 18, color: C.faint, textAlign: 'center', marginTop: 4, marginBottom: 12 }}>
        Noor Salat est et restera gratuite. Les dons servent uniquement aux projets de Hope Nour.
      </T>
    </Screen>
  );
}
