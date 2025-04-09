/**
 * Creature Names Utility
 * Provides consistent random TTRPG creature names in Russian for users
 */

/**
 * Utility for generating random creature names for bidders
 * This helps maintain privacy while making bids identifiable
 */

const CREATURE_NAMES = [
  'Гоблин', 'Орк', 'Скелет', 'Зомби', 'Вампир',
  'Оборотень', 'Тролль', 'Огр', 'Дракон', 'Элементаль',
  'Грифон', 'Химера', 'Мантикора', 'Циклоп', 'Минотавр',
  'Гарпия', 'Сирена', 'Нимфа', 'Сатир', 'Кентавр',
  'Кобольд', 'Гнолл', 'Дроу', 'Иллитид', 'Бехолдер',
  'Лич', 'Демон', 'Дьявол', 'Ангел', 'Джинн',
  'Медуза', 'Василиск', 'Виверна', 'Феникс', 'Единорог',
  'Гоблин-шаман', 'Орк-вождь', 'Рыцарь смерти', 'Призрак', 'Банши',
  'Энт', 'Дриада', 'Гаргулья', 'Имп', 'Суккуб'
];

/**
 * Simple string hash function to get deterministic index
 * @param str String to hash
 * @param salt Optional salt to get different hash for same string
 * @returns Number hash of the string
 */
function hashString(str: string, salt = 1): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char + salt;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Gets a deterministic creature name for a user based on their ID
 * @param userId User ID to generate a name for
 * @returns A random but consistent creature name
 */
export function getCreatureNameForUser(userId: string): string {
  const creatureIndex = hashString(userId) % CREATURE_NAMES.length;
  return CREATURE_NAMES[creatureIndex];
}

/**
 * Format bidder name with a creature name and \"(Вы)\" indicator if it's the current user
 * @param userId User ID to generate a creature name for
 * @param isCurrentUser Flag indicating if the bid belongs to the currently logged-in user
 * @returns Formatted bidder name string
 */
export function formatBidderCreatureName(userId: string, isCurrentUser = false): string {
  const creatureName = getCreatureNameForUser(userId);
  return isCurrentUser ? `${creatureName} (Вы)` : creatureName;
} 