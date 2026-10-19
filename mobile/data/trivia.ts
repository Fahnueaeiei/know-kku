// data/trivia.ts
import { Ionicons } from "@expo/vector-icons";

export type IconName = keyof typeof Ionicons.glyphMap;

export type TriviaItem = {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: IconName;
  sourceUrl: string;
  bg: string;
  accent: string;
};

export const KKU_TRIVIA: TriviaItem[] = [
      {
    id: 'mor-din-daeng',
    category: 'ประวัติ มข.',
    title: 'ทำไมถึงเรียก “มอดินแดง”? เพราะที่ตั้ง มข. เป็นเนินดินสีแดงนี่แหละ',
    description:
      'พื้นที่ราว 5,500 ไร่เป็นเนินดินลูกคลื่นสีแดง ชื่อเล่นสุดคุ้นหูของชาว มข. ก็มาจากตรงนี้เอง',
    icon: 'earth-outline',
    sourceUrl: encodeURI(
      'https://hr.kku.ac.th/hrdkku2014/app/media/files/ระเบียบบุคลากร/พนักงานมหาวิทยาลัย/คู่มือพนักงานมหาวิทยาลัย/บทที่ 1 ประวัติความเป็นมา.pdf'
    ),
    bg: '#E3DBFA',
    accent: '#5B3FB3',
  },   
  {
    id: 'notebook-loan',
    category: 'บริการนักศึกษา',
    title:
      'ไม่มีโน้ตบุ๊กใช้ทำงาน? นักศึกษา มข. ยืมได้ที่สำนักเทคโนโลยีดิจิทัลนะ',
    description:
      'ไปที่ชั้น 5 อาคารศูนย์สารสนเทศ (ข้างหอสมุด) พกบัตรนักศึกษาตัวจริงกับใบเสร็จค่าเทอม (REG) ไปด้วย แล้วเช็กสภาพเครื่องก่อนรับด้วยนะ',
    icon: 'laptop-outline',
    sourceUrl: 'https://digital.kku.ac.th/student-notebook-loan/',
    bg: '#CFF3F7',
    accent: '#0B7285',
  },
  {
    id: 'art-lane',
    category: 'เทศกาล & ศิลปะ',
    title:
      'ทุกปีสะพานขาวจะแปลงร่างเป็นถนนศิลปะ ในงาน “Art Lane” ของเด็กศิลปกรรม',
    description:
      'นักศึกษาจะนำเอาผลงานศิลปะกับการแสดงดนตรีมาโชว์กัน งานจะจัดในช่วงเดือนกุมภาพันธ์ของทุกปี ใครที่รักงานศิลปะ ปีหน้าอย่าพลาดนะ',
    icon: 'color-palette-outline',
    sourceUrl: 'https://www.facebook.com/artlaneKKU',
    bg: '#F7D6E4',
    accent: '#B5336B',
  },
  {
    id: 'seethan-festival',
    category: 'เทศกาล & วัฒนธรรม',
    title: 'บึงสีฐานเนรมิตเป็นเทศกาล “สีฐานเฟสติวัล” จัดมาตั้งแต่ปี 2558',
    description:
      'ลองนึกภาพเรือไฟกับกระทงยักษ์ยาวกว่า 20 เมตร และแสงประทีปกระทงบกกว่า 15,000 ดวงที่บึงสีฐาน จัดเต็ม 3 วัน 3 คืน ใครยังไม่เคยไป มีโอกาสห้ามพลาด!',
    icon: 'sparkles-outline',
    sourceUrl: 'https://www.facebook.com/SithanKKUFestival/?locale=th_TH',
    bg: '#B5EFE3',
    accent: '#0F7A64',
  },
  {
    id: 'founding-day',
    category: 'ประวัติ มข.',
    title:
      'วันเกิด มข. คือ 25 ม.ค. แต่พิธีเปิดมหาวิทยาลัยจัดอีกเกือบ 2 ปีให้หลัง',
    description:
      'พ.ร.บ. ประกาศเมื่อ 25 ม.ค. 2509 ส่วนพิธีเปิดจัดวันที่ 20 ธ.ค. 2510 และ มข. คือสถาบันอุดมศึกษาแห่งแรกของภาคอีสานด้วยนะ',
    icon: 'flag-outline',
    sourceUrl: 'https://gsbooks.gs.kku.ac.th/66/manual/files/info03.pdf',
    bg: '#FDE2C6',
    accent: '#B8480F',
  },
 
   {
    id: 'dormitory',
    category: 'หอพัก',
    title:
      'มข. มีหอพักให้เลือกถึง 4 แบบ แถมจองหอกับแจ้งซ่อมก็ทำออนไลน์ได้',
    description:
      'มีทั้งหอพักส่วนกลาง หอพักในกำกับ หอพักคณะ และหอพักเครือข่าย อยากรู้เพิ่มเติมสอบถามที่พี่ดินแดงได้เลย',
    icon: 'bed-outline',
    sourceUrl: 'https://dorm.kku.ac.th/',
    bg: '#E4F3C8',
    accent: '#4D7C0F',
  },
];

