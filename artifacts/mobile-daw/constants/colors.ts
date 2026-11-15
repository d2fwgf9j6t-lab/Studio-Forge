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
  text: '#F0F2EC',
  tint: '#C6F36D',
  background: '#090B0E',
  foreground: '#F0F2EC',
  card: '#14171C',
  cardForeground: '#F0F2EC',
  primary: '#C6F36D',
  primaryForeground: '#10120D',
  secondary: '#1B1F24',
  secondaryForeground: '#E4E8DF',
  muted: '#171A1F',
  mutedForeground: '#89919B',
  accent: '#1B2925',
  accentForeground: '#78DDE2',
  destructive: '#E66D67',
  destructiveForeground: '#170C0B',
  border: '#292E35',
  input: '#232830',
  studio: '#090B0E',
  panel: '#111419',
  panelRaised: '#171B21',
  panelSelected: '#1B241A',
  line: '#292E35',
  lineStrong: '#46505A',
  lime: '#C6F36D',
  limeLow: '#24301A',
  limeLine: '#536C36',
  cyan: '#78DDE2',
  amber: '#E8B870',
  amberLow: '#211C14',
  amberLine: '#59482C',
  coral: '#E66D67',
  violet: '#B99AF5',
  violetLow: '#211B2A',
  disabled: '#59616C',
};

const colors = {
  light: studioPalette,
  dark: studioPalette,
  radius: 10,
};

export default colors;
