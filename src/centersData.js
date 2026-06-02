import { BEAR, WOLF, FOX, CAPULION, CAT } from './sprites.jsx'

/* Shared data for the usage dashboard (used by both the Huaroi page and the
   stats overlay on the World Map). */
const BASE = import.meta.env.BASE_URL || '/'
export const ICON_DIR = `${BASE}assets/Espresso/Espresso/Espresso_icon/opt/`

/* The five centres. `count` = how many times each was used; both the ranking
   list and the running lanes are ranked by it (most-used first), and each
   centre owns one character (sprite for the run, coin icon for the list). */
export const CENTERS = [
  { name: 'ศูนย์พัฒนาเด็กเล็กเทศบาลหัวรอ 1', count: 124, sprite: BEAR,     icon: `${ICON_DIR}Bearte_icon.webp` },
  { name: 'ศูนย์พัฒนาเด็กเล็กเทศบาลหัวรอ 2', count: 201, sprite: CAPULION, icon: `${ICON_DIR}Capulion_icon.webp` },
  { name: 'ศูนย์พัฒนาเด็กเล็กสระโคล่ 1',     count: 156, sprite: CAT,      icon: `${ICON_DIR}Catramel_icon.webp` },
  { name: 'ศูนย์พัฒนาเด็กเล็กสระโคล่ 2',     count: 98,  sprite: FOX,      icon: `${ICON_DIR}Foxca_icon.webp` },
  { name: 'ศูนย์พัฒนาเด็กเล็กวัดมหาวนาราม',  count: 172, sprite: WOLF,     icon: `${ICON_DIR}Wolficano_icon.webp` },
]
