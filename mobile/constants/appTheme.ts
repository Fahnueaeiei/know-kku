// วางที่: constants/appTheme.ts  (โฟลเดอร์ constants ที่อยู่ระดับเดียวกับ app / api / components)
//
// ชุดสีเดียวกับหน้า Home และ Checklist  →  ใช้ร่วมกันใน Place, PlaceCard, Place Detail
// ถ้าต่อไปอยากให้ Home / Checklist ใช้ไฟล์นี้ด้วย ก็ import จากที่นี่ได้เลย

export const COLORS = {
  ink: '#1A1A1A',
  inkSoft: '#4A4644',
  textLight: '#8E8985',

  background: '#FCF9F7',
  white: '#FFFFFF',

  orange: '#E8692B',
  brick: '#B8480F', // ส้มอิฐ
  overdue: '#C62828',

  cream: '#fbf6f2',
  creamBorder: '#F4DCCB',
  accentSoft: '#FBD9C2', // วงกลมไอคอนบนพื้นครีม
  border: '#EFE8E4',
  skeleton: '#F3E9E1',

  favorite: '#E63946',
  green: '#55A76A',
  blue: '#4BA6D8',
};

// สีการ์ดชุดเดียวกับ Checklist / Home: ชมพู, มิ้นต์, ม่วง, พีช, ฟ้า
export const CARD_COLORS = ['#F7D6E4', '#B5EFE3', '#E3DBFA', '#FDE2C6', '#D2E7FB'];

export type CategoryMeta = {
  icon: string; // ชื่อไอคอนของ Ionicons
  color: string;
};

/**
 * ไอคอน + สีประจำประเภทสถานที่ (จับคู่จากชื่อ category ที่ backend ส่งมา ไม่สนตัวพิมพ์เล็กใหญ่)
 * ประเภทที่ไม่รู้จักจะได้ไอคอนหมุดแผนที่ธรรมดา
 */
export function getCategoryMeta(category?: string | null): CategoryMeta {
  const key = String(category ?? '').trim().toLowerCase();

  if (key.includes('restaurant') || key.includes('food')) {
    return { icon: 'restaurant-outline', color: '#C2410C' };
  }
  if (key.includes('cafe') || key.includes('coffee')) {
    return { icon: 'cafe-outline', color: '#8A5A2B' };
  }
  if (key.includes('library')) {
    return { icon: 'library-outline', color: '#6B4FBF' };
  }
  if (key.includes('study')) {
    return { icon: 'book-outline', color: '#6B4FBF' };
  }
  if (key.includes('market') || key.includes('shop') || key.includes('store')) {
    return { icon: 'storefront-outline', color: '#1F8A5B' };
  }
  if (key.includes('building') || key.includes('faculty') || key.includes('office')) {
    return { icon: 'business-outline', color: '#1E6FB8' };
  }

  if (key.includes('relax') || key.includes('park') || key.includes('garden')) {
    return { icon: 'leaf-outline', color: '#2F8F5B' };
  }

  return { icon: 'location-outline', color: COLORS.brick };
}