/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const studioPalette = {
  text: '#F1ECF8',
  tint: '#BE96FF',
  background: '#08060B',
  foreground: '#F1ECF8',
  card: '#15111B',
  cardForeground: '#F1ECF8',
  primary: '#BE96FF',
  primaryForeground: '#140D1D',
  secondary: '#201A28',
  secondaryForeground: '#E6DDF1',
  muted: '#17131D',
  mutedForeground: '#A198AE',
  accent: '#2A1D38',
  accentForeground: '#D7B9FF',
  destructive: '#E66D67',
  destructiveForeground: '#170C0B',
  border: '#30273A',
  input: '#241D2B',
  studio: '#08060B',
  panel: '#110D17',
  panelRaised: '#1A1422',
  panelSelected: '#241832',
  line: '#30273A',
  lineStrong: '#51405F',
  lime: '#BE96FF',
  limeLow: '#291B3C',
  limeLine: '#6B4B90',
  cyan: '#AA8BFA',
  amber: '#BE96FF',
  amberLow: '#23192F',
  amberLine: '#624979',
  coral: '#E66D67',
  violet: '#C09BFF',
  violetLow: '#261A37',
  disabled: '#635D6A',
};

const colors = {
  light: studioPalette,
  dark: studioPalette,
  radius: 10,
};

export default colors;
