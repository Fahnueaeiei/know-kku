import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Animated,
  Pressable,
  Linking,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import ChatbotButton from '../components/ChatbotButton';
import ChatbotSheet from '../components/ChatbotSheet';

import {
  API_URL,
  ChecklistItem,
  ChecklistTask,
  GetToken,
  fetchTasks,
} from '../api/api';
import {
  KKU_EVENTS_PAGE_URL,
  KkuEvent,
  fetchKkuEvents,
} from '../api/events';

/* =========================================================
   DESIGN TOKENS
   ใช้ชุดเดียวกับหน้า Checklist (INK / ORANGE / CARD_COLORS)
   เพิ่มโทน "ส้มอิฐ" (brick) และครีม สำหรับหน้า Home
========================================================= */

type IconName = keyof typeof Ionicons.glyphMap;

const COLORS = {
  ink: '#1A1A1A',
  inkSoft: '#4A4644',
  textLight: '#8E8985',

  background: '#FCF9F7', // PAGE_BG ของ Checklist
  white: '#FFFFFF',

  orange: '#E8692B', // ORANGE ของ Checklist
  brick: '#B8480F', // ส้มอิฐ (TODAY ของ Checklist)
  overdue: '#C62828',

  cream: '#FFF4EA',
  creamBorder: '#F4DCCB',
  border: '#EFE8E4',
  skeleton: '#F3E9E1',
};

// สีการ์ดชุดเดียวกับ Checklist: ชมพู, มิ้นต์, ม่วง, พีช, ฟ้า
const CARD_COLORS = ['#F7D6E4', '#B5EFE3', '#E3DBFA', '#FDE2C6', '#D2E7FB'];

/* =========================================================
   SETTINGS (ปรับตรงนี้ได้)
========================================================= */

const SCREEN_PADDING = 16;
const HERO_HEIGHT = 270;
const AUTO_ADVANCE_MS = 6000; // เลื่อน Did You Know อัตโนมัติทุกกี่ ms
const UPCOMING_WINDOW_DAYS = 3; // "ใกล้ถึงกำหนด" = เลยกำหนด หรือ ภายในกี่วันข้างหน้า
const MAX_REMINDERS = 3; // แสดง Checklist บนหน้า Home สูงสุดกี่รายการ
const NEWS_LIMIT = 6; // 2 คอลัมน์ x 3 แถว

/* =========================================================
   TYPES
========================================================= */

type HomeFact = {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: IconName;
  sourceUrl?: string;
  imageUrl?: string;
};

type UpcomingItem = {
  key: string;
  taskTitle: string;
  color: string;
  item: ChecklistItem;
  overdue: boolean;
  daysLeft: number;
  dueAt: number;
};

type LoadStatus = 'loading' | 'ok' | 'error';

/* =========================================================
   DATE HELPERS (เก็บวันที่เป็น "YYYY-MM-DD" เหมือนหน้า Checklist)
========================================================= */

const TH_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

const pad = (n: number) => String(n).padStart(2, '0');

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const fromISODate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/* =========================================================
   CHECKLIST → รายการใกล้ถึงกำหนด
   - ไม่นับรายการที่ติ๊กเสร็จแล้ว / ไม่มีวันกำหนด
   - นับรายการที่เลยกำหนด หรือกำหนดภายใน UPCOMING_WINDOW_DAYS วัน
   - สีของแถวใช้ลำดับเดียวกับหน้า Checklist (ตามลำดับของเช็คลิสต์)
========================================================= */

function buildUpcoming(tasks: ChecklistTask[]): UpcomingItem[] {
  const now = new Date();
  const todayISO = toISODate(now);
  const nowHHmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const today0 = startOfToday().getTime();

  const result: UpcomingItem[] = [];

  tasks.forEach((task, index) => {
    const color = CARD_COLORS[index % CARD_COLORS.length];

    task.items.forEach((item) => {
      if (item.completed || !item.dueDate) return;

      const dueDay = fromISODate(item.dueDate);
      const daysLeft = Math.round((dueDay.getTime() - today0) / 86400000);

      const overdue =
        item.dueDate < todayISO ||
        (item.dueDate === todayISO && !!item.dueTime && item.dueTime < nowHHmm);

      if (!overdue && daysLeft > UPCOMING_WINDOW_DAYS) return;

      const [h, m] = (item.dueTime ?? '23:59').split(':').map(Number);
      const dueAt = new Date(
        dueDay.getFullYear(),
        dueDay.getMonth(),
        dueDay.getDate(),
        h,
        m
      ).getTime();

      result.push({
        key: `${task.taskId}-${item.itemId}`,
        taskTitle: task.title,
        color,
        item,
        overdue,
        daysLeft,
        dueAt,
      });
    });
  });

  return result.sort((a, b) => a.dueAt - b.dueAt);
}

function dueLabel(u: UpcomingItem) {
  const time = u.item.dueTime ? ` • ${u.item.dueTime} น.` : '';

  if (u.overdue) {
    return u.daysLeft < 0
      ? `เลยกำหนด ${Math.abs(u.daysLeft)} วัน`
      : 'เลยเวลาแล้ว';
  }
  if (u.daysLeft === 0) return `วันนี้${time}`;
  if (u.daysLeft === 1) return `พรุ่งนี้${time}`;

  const d = fromISODate(u.item.dueDate as string);
  return `อีก ${u.daysLeft} วัน (${d.getDate()} ${TH_MONTHS[d.getMonth()]})`;
}

function toneOf(u: UpcomingItem): { color: string; icon: IconName } {
  if (u.overdue) return { color: COLORS.overdue, icon: 'alert-circle' };
  if (u.daysLeft === 0) return { color: COLORS.brick, icon: 'time' };
  return { color: COLORS.inkSoft, icon: 'calendar-outline' };
}

/* =========================================================
   OPEN EXTERNAL LINK
========================================================= */

const openExternalLink = (url?: string) => {
  if (!url) return;
  Linking.openURL(url).catch((err) =>
    console.log('Unable to open URL:', err)
  );
};

/* =========================================================
   HOME SCREEN
========================================================= */

export default function HomeScreen() {
  const router = useRouter();

  // ตอนต่อ Clerk: const { getToken } = useAuth();  (เหมือนหน้า Checklist)
  const getToken: GetToken | undefined = undefined;

  const [searchText, setSearchText] = useState('');
  const [chatbotVisible, setChatbotVisible] = useState(false);
  const [focused, setFocused] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Did You Know (backend: GET /news?featured=true)
  const [facts, setFacts] = useState<HomeFact[]>([]);
  const [factsStatus, setFactsStatus] = useState<LoadStatus>('loading');

  // Checklist (backend เดียวกับหน้า Checklist)
  const [tasks, setTasks] = useState<ChecklistTask[] | null>(null);
  const [checklistError, setChecklistError] = useState(false);

  // ข่าวสาร/กิจกรรม (kku.ac.th/th/events)
  const [events, setEvents] = useState<KkuEvent[] | null>(null);
  const [eventsError, setEventsError] = useState(false);

  /* ---------- LOADERS ---------- */

  const loadFacts = useCallback(async () => {
    try {
      setFactsStatus((s) => (s === 'ok' ? s : 'loading'));

      const res = await fetch(`${API_URL}/news?featured=true`);

      if (!res.ok) {
        throw new Error(`Featured news request failed: ${res.status}`);
      }

      const raw = await res.json();

      setFacts(
        raw.map((item: any) => ({
          id: String(item.newsId),
          category: item.category ?? 'NEWS',
          title: item.title,
          description: item.description ?? '',
          icon: (item.icon as IconName) || 'bulb-outline',
          sourceUrl: item.externalLink,
          imageUrl: item.imageUrl,
        }))
      );
      setFactsStatus('ok');
    } catch (err) {
      console.error('loadFacts error:', err);
      setFactsStatus('error');
    }
  }, []);

  const loadChecklist = useCallback(async () => {
    try {
      setChecklistError(false);
      setTasks(await fetchTasks(getToken));
    } catch (err) {
      console.error('loadChecklist error:', err);
      setChecklistError(true);
    }
  }, [getToken]);


const loadEvents = useCallback(async () => {
  try {
    setEventsError(false);

    const result = await fetchKkuEvents(NEWS_LIMIT);
    setEvents(result);
  } catch (err) {
    console.error('loadEvents error:', err);
    setEventsError(true);
  }
}, []);


  useEffect(() => {
    loadFacts();
    loadEvents();
  }, [loadFacts, loadEvents]);

  // โหลด Checklist ใหม่ทุกครั้งที่กลับมาหน้า Home
  // (ติ๊กเสร็จ/แก้วันที่ในหน้า Checklist แล้วกลับมา ข้อมูลจะตรงกันทันที)
  // และหยุดเลื่อน Did You Know อัตโนมัติตอนที่ไม่ได้อยู่หน้านี้
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      loadChecklist();
      return () => setFocused(false);
    }, [loadChecklist])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadFacts(), loadChecklist(), loadEvents()]);
    setRefreshing(false);
  };

  /* ---------- HANDLERS ---------- */

  const handleSearch = () => {
    const query = searchText.trim();
    if (!query) return;

    router.push({ pathname: '/search', params: { q: query } });
  };

  const openChecklist = () => router.push('/checklist');

  /* ---------- RENDER ---------- */

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.screen}>
        {/* HeadBar / BottomNav render จาก root _layout.tsx แล้ว ไม่ต้อง render ซ้ำที่นี่ */}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={COLORS.orange}
              onRefresh={onRefresh}
            />
          }
        >
          {/* SEARCH */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color={COLORS.textLight} />

            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              style={styles.searchInput}
              placeholder="Search all..."
              placeholderTextColor="#99928E"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />

            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchText('')}
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            )}
          </View>

          {/* DID YOU KNOW */}
          {factsStatus === 'loading' && (
            <View style={styles.heroState}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.heroStateText}>กำลังโหลด...</Text>
            </View>
          )}

          {factsStatus === 'error' && facts.length === 0 && (
            <Pressable style={styles.heroState} onPress={loadFacts}>
              <Ionicons name="refresh" size={22} color="#FFFFFF" />
              <Text style={styles.heroStateText}>
                โหลดข่าวสารไม่สำเร็จ แตะเพื่อลองใหม่
              </Text>
            </Pressable>
          )}

          {facts.length > 0 && <FactCarousel facts={facts} paused={!focused} />}

          {/* CHECKLIST ใกล้ถึงกำหนด */}
          <ChecklistReminder
            tasks={tasks}
            error={checklistError}
            onRetry={loadChecklist}
            onOpen={openChecklist}
          />

          {/* ข่าวสารและกิจกรรม */}
          <EventsSection
            events={events}
            error={eventsError}
            onRetry={loadEvents}
          />

          <View style={styles.bottomSpace} />
        </ScrollView>

        {/* P'DIN-DANG CHATBOT */}
        <ChatbotButton onPress={() => setChatbotVisible(true)} />

        <ChatbotSheet
          visible={chatbotVisible}
          onClose={() => setChatbotVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

/* =========================================================
   DID YOU KNOW — CAROUSEL
   - ปัดซ้าย/ขวาได้ (paging)
   - ปุ่ม ‹ › + จุดบอกตำแหน่ง (กดจุดเพื่อข้ามไปสไลด์นั้นได้)
   - เลื่อนอัตโนมัติทุก AUTO_ADVANCE_MS แต่นับเวลาใหม่ทุกครั้งที่ผู้ใช้เลื่อนเอง
========================================================= */

function FactCarousel({
  facts,
  paused,
}: {
  facts: HomeFact[];
  paused: boolean;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const [width, setWidth] = useState(
    Dimensions.get('window').width - SCREEN_PADDING * 2
  );
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const count = facts.length;

  /* float animation (เหมือนของเดิม) */
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -3, duration: 1800, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [float]);

  const goTo = useCallback(
    (next: number) => {
      const target = (next + count) % count;
      setIndex(target);
      scrollRef.current?.scrollTo({ x: target * width, animated: true });
    },
    [count, width]
  );

  /* จำนวนข่าวเปลี่ยน (เช่น รีเฟรช) → กัน index เกิน */
  useEffect(() => {
    if (index >= count) {
      setIndex(0);
      scrollRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [count, index]);

  /* ความกว้างเปลี่ยน (หมุนจอ) → คงตำแหน่งสไลด์เดิม */
  useEffect(() => {
    scrollRef.current?.scrollTo({ x: index * width, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  /* เลื่อนอัตโนมัติ — setTimeout ผูกกับ index จึงนับใหม่ทุกครั้งที่เลื่อน (ไม่ว่าด้วยมือหรืออัตโนมัติ) */
  useEffect(() => {
    if (count <= 1 || paused || dragging) return;

    const timer = setTimeout(() => goTo(index + 1), AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [index, count, paused, dragging, goTo]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setDragging(false);
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(Math.max(0, Math.min(count - 1, next)));
  };

  const current = facts[Math.min(index, count - 1)];
  const useCounter = count > 6; // ข่าวเยอะเกินจะใช้จุด → แสดงเป็น "3 / 9"

  return (
    <Animated.View
      style={[styles.heroShadow, { transform: [{ translateY: float }] }]}
    >
      <View
        style={styles.heroCard}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => setDragging(true)}
          onScrollEndDrag={() => setDragging(false)}
          onMomentumScrollEnd={onMomentumEnd}
        >
          {facts.map((fact) => (
            <FactSlide key={fact.id} fact={fact} width={width} />
          ))}
        </ScrollView>

        {/* ตัวควบคุมด้านล่าง: ‹ จุด › และปุ่มดูรายละเอียด */}
        <View style={styles.heroControls} pointerEvents="box-none">
          {count > 1 ? (
            <View style={styles.heroNav}>
              <ArrowButton
                icon="chevron-back"
                label="ข่าวก่อนหน้า"
                onPress={() => goTo(index - 1)}
              />

              {useCounter ? (
                <Text style={styles.counterText}>
                  {index + 1} / {count}
                </Text>
              ) : (
                <View style={styles.dots}>
                  {facts.map((f, i) => (
                    <Pressable
                      key={f.id}
                      hitSlop={8}
                      onPress={() => goTo(i)}
                      accessibilityLabel={`ไปที่ข่าวที่ ${i + 1}`}
                    >
                      <View
                        style={[styles.dot, i === index && styles.dotActive]}
                      />
                    </Pressable>
                  ))}
                </View>
              )}

              <ArrowButton
                icon="chevron-forward"
                label="ข่าวถัดไป"
                onPress={() => goTo(index + 1)}
              />
            </View>
          ) : (
            <View />
          )}

          {!!current?.sourceUrl && (
            <Pressable
              style={({ pressed }) => [
                styles.heroReadMore,
                pressed && styles.pressedSoft,
              ]}
              onPress={() => openExternalLink(current.sourceUrl)}
            >
              <Text style={styles.heroReadText}>ดูรายละเอียด</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.brick} />
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

function ArrowButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.arrowBtn, pressed && styles.pressedSoft]}
    >
      <Ionicons name={icon} size={18} color={COLORS.brick} />
    </Pressable>
  );
}

function FactSlide({ fact, width }: { fact: HomeFact; width: number }) {
  return (
    <Pressable
      style={[styles.heroSlide, { width }]}
      onPress={() => openExternalLink(fact.sourceUrl)}
    >
      {fact.imageUrl ? (
        <Image source={{ uri: fact.imageUrl }} style={styles.heroImage} />
      ) : (
        <>
          <View style={styles.heroDecorLarge} />
          <View style={styles.heroDecorSmall} />
          <Ionicons
            name={fact.icon}
            size={120}
            color="rgba(255,255,255,0.16)"
            style={styles.heroWatermark}
          />
        </>
      )}

      {/* โทนส้มอิฐทับรูป + เงาด้านล่างให้ตัวหนังสืออ่านง่าย */}
      <View style={styles.heroTint} />
      <View style={styles.heroTintBottom} />

      <View style={styles.heroContent}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <Ionicons name="bulb-outline" size={14} color={COLORS.orange} />
            <Text style={styles.heroBadgeText}>DID YOU KNOW?</Text>
          </View>

          <View style={styles.heroCategoryBadge}>
            <Text style={styles.heroCategoryText} numberOfLines={1}>
              {fact.category}
            </Text>
          </View>
        </View>

        <View>
          <Text style={styles.heroTitle} numberOfLines={3}>
            {fact.title}
          </Text>
          <Text style={styles.heroDescription} numberOfLines={2}>
            {fact.description}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/* =========================================================
   CHECKLIST ใกล้ถึงกำหนด
   ข้อมูลจริงจาก fetchTasks (ตัวเดียวกับหน้า Checklist)
   แตะแถวใดก็ได้ / "ดู Checklist" → ไปหน้า Checklist
========================================================= */

function ChecklistReminder({
  tasks,
  error,
  onRetry,
  onOpen,
}: {
  tasks: ChecklistTask[] | null;
  error: boolean;
  onRetry: () => void;
  onOpen: () => void;
}) {
  const upcoming = useMemo(() => (tasks ? buildUpcoming(tasks) : []), [tasks]);

  const pendingCount = useMemo(
    () =>
      tasks
        ? tasks.reduce((n, t) => n + t.items.filter((i) => !i.completed).length, 0)
        : 0,
    [tasks]
  );

  const shown = upcoming.slice(0, MAX_REMINDERS);
  const extra = upcoming.length - shown.length;
  const overdueCount = upcoming.filter((u) => u.overdue).length;

  const subtitle =
    upcoming.length === 0
      ? 'ไม่มีรายการเร่งด่วน'
      : `${upcoming.length} รายการที่ต้องรีบทำ${
          overdueCount > 0 ? ` (เลยกำหนด ${overdueCount})` : ''
        }`;

  return (
    <View style={styles.reminderPanel}>
      <View style={styles.reminderHeader}>
        <View style={styles.reminderHeaderIcon}>
          <Ionicons
            name={overdueCount > 0 ? 'alarm' : 'checkbox-outline'}
            size={20}
            color={overdueCount > 0 ? COLORS.overdue : COLORS.brick}
          />
        </View>

        <View style={styles.reminderHeaderText}>
          <Text style={styles.panelTitle}>ใกล้ถึงกำหนด</Text>
          <Text style={styles.panelSubtitle}>{subtitle}</Text>
        </View>

        <TouchableOpacity
          style={styles.seeAll}
          activeOpacity={0.7}
          onPress={onOpen}
        >
          <Text style={styles.seeAllText}>ดู Checklist</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.orange} />
        </TouchableOpacity>
      </View>

      {/* กำลังโหลด */}
      {tasks === null && !error && (
        <View style={styles.reminderMessage}>
          <ActivityIndicator color={COLORS.orange} />
        </View>
      )}

      {/* โหลดไม่สำเร็จ */}
      {error && tasks === null && (
        <TouchableOpacity
          style={styles.reminderMessage}
          activeOpacity={0.7}
          onPress={onRetry}
        >
          <Text style={styles.messageText}>
            โหลด Checklist ไม่สำเร็จ แตะเพื่อลองใหม่
          </Text>
        </TouchableOpacity>
      )}

      {/* ยังไม่มี Checklist เลย */}
      {tasks !== null && tasks.length === 0 && (
        <TouchableOpacity
          style={styles.reminderMessage}
          activeOpacity={0.7}
          onPress={onOpen}
        >
          <Text style={styles.messageText}>
            ยังไม่มี Checklist — แตะเพื่อสร้างรายการแรก
          </Text>
        </TouchableOpacity>
      )}

      {/* มี Checklist แต่ไม่มีอะไรใกล้ถึงกำหนด */}
      {tasks !== null && tasks.length > 0 && upcoming.length === 0 && (
        <TouchableOpacity
          style={styles.reminderMessage}
          activeOpacity={0.7}
          onPress={onOpen}
        >
          <Text style={styles.messageTitle}>
            ยังไม่มีรายการที่ใกล้ถึงกำหนด ✨
          </Text>
          <Text style={styles.messageText}>
            {pendingCount > 0
              ? `ยังมี ${pendingCount} รายการที่ยังไม่เสร็จ`
              : 'ทำครบทุกรายการแล้ว เยี่ยมมาก!'}
          </Text>
        </TouchableOpacity>
      )}

      {/* รายการใกล้ถึงกำหนด */}
      {shown.map((u) => {
        const tone = toneOf(u);

        return (
          <TouchableOpacity
            key={u.key}
            activeOpacity={0.85}
            style={[styles.reminderRow, { backgroundColor: u.color }]}
            onPress={onOpen}
          >
            <View style={styles.urgencyIcon}>
              <Ionicons name={tone.icon} size={18} color={tone.color} />
            </View>

            <View style={styles.reminderRowText}>
              <Text style={styles.reminderItemTitle} numberOfLines={2}>
                {u.item.title}
              </Text>

              <View style={styles.reminderMeta}>
                <View style={styles.dueChip}>
                  <Text style={[styles.dueChipText, { color: tone.color }]}>
                    {dueLabel(u)}
                  </Text>
                </View>
                <Text style={styles.reminderTaskTitle} numberOfLines={1}>
                  {u.taskTitle}
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={16} color={COLORS.inkSoft} />
          </TouchableOpacity>
        );
      })}

      {extra > 0 && (
        <TouchableOpacity activeOpacity={0.7} onPress={onOpen}>
          <Text style={styles.reminderMore}>และอีก {extra} รายการ ›</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* =========================================================
   ข่าวสารและกิจกรรม (จาก https://www.kku.ac.th/th/events/)
   กรอบใหญ่ → หัวข้อ → กริด 2 คอลัมน์ x 3 แถว → ปุ่ม "ดูข่าวทั้งหมด"
========================================================= */

function EventsSection({
  events,
  error,
  onRetry,
}: {
  events: KkuEvent[] | null;
  error: boolean;
  onRetry: () => void;
}) {

  const rows: KkuEvent[][] = [];

  (events ?? []).forEach((ev, i) => {
    if (i % 2 === 0) rows.push([ev]);
    else rows[rows.length - 1].push(ev);
  });


  return (
    <View style={styles.eventsFrame}>
      <View style={styles.eventsHeader}>
        <View style={styles.reminderHeaderIcon}>
          <Ionicons name="newspaper-outline" size={20} color={COLORS.brick} />
        </View>
        <View style={styles.reminderHeaderText}>
          <Text style={styles.panelTitle}>ข่าวสารและกิจกรรม</Text>
          <Text style={styles.panelSubtitle}>
            จากปฏิทินกิจกรรม มหาวิทยาลัยขอนแก่น
          </Text>
        </View>
      </View>

      {/* กำลังโหลด → โครงการ์ด */}
      {events === null && !error && (
        <>
          {[0, 1, 2].map((r) => (
            <View key={r} style={styles.eventRow}>
              <View style={styles.eventSkeleton} />
              <View style={styles.eventSkeleton} />
            </View>
          ))}
        </>
      )}

      {/* โหลดไม่สำเร็จ */}
      {error && events === null && (
        <TouchableOpacity
          style={styles.eventsMessage}
          activeOpacity={0.7}
          onPress={onRetry}
        >
          <Ionicons name="refresh" size={22} color={COLORS.textLight} />
          <Text style={styles.messageText}>
            โหลดกิจกรรมไม่สำเร็จ แตะเพื่อลองใหม่
          </Text>
        </TouchableOpacity>
      )}

      {/* ไม่มีกิจกรรม */}
      {events !== null && events.length === 0 && (
        <View style={styles.eventsMessage}>
          <Ionicons name="calendar-outline" size={22} color={COLORS.textLight} />
          <Text style={styles.messageText}>
            ยังไม่มีกิจกรรมที่กำลังจะมาถึง
          </Text>
        </View>
      )}

      {/* กริดกิจกรรม */}
      {rows.map((row, r) => (
        <View key={r} style={styles.eventRow}>
          {row.map((ev, c) => (
            <EventCard
              key={ev.id}
              event={ev}
              color={
                CARD_COLORS[(r * 3 + c) % CARD_COLORS.length]
              }
              onPress={() => openExternalLink(ev.url)}
            />
          ))}

          {row.length < 2 &&
            Array.from({ length: 3 - row.length }).map((_, i) => (
              <View key={`spacer-${i}`} style={styles.eventSpacer} />
            ))}
        </View>
      ))}

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.allButton}
        onPress={() => openExternalLink(KKU_EVENTS_PAGE_URL)}
      >
        <Text style={styles.allButtonText}>ดูข่าวทั้งหมด</Text>
        <Ionicons name="open-outline" size={17} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

function EventCard({
  event,
  color,
  onPress,
}: {
  event: KkuEvent;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.eventCard, { backgroundColor: color }]}
      onPress={onPress}
    >
      {event.imageUrl ? (
        <Image source={{ uri: event.imageUrl }} style={styles.eventImage} />
      ) : (
        <View style={[styles.eventImage, styles.eventImagePlaceholder]}>
          <Ionicons name="calendar-outline" size={30} color={COLORS.brick} />
        </View>
      )}

      <View style={styles.eventBody}>
        <View style={styles.eventDateChip}>
          <Ionicons name="calendar-outline" size={11} color={COLORS.brick} />
          <Text style={styles.eventDateText} numberOfLines={1}>
            {event.dateLabel}
          </Text>
        </View>

        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>

        {!!event.venue && (
          <View style={styles.eventVenueRow}>
            <Ionicons name="location-outline" size={12} color={COLORS.inkSoft} />
            <Text style={styles.eventVenueText} numberOfLines={1}>
              {event.venue}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 12,
    paddingBottom: 24,
  },

  pressedSoft: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },

/* SEARCH */

searchContainer: {
  height: 46,
  width: '100%',
  borderRadius: 23,
  backgroundColor: COLORS.white,
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  marginBottom: 10,
  borderWidth: 0.5,
  borderColor: '#F0EBE8',
  shadowColor: '#AFA7A2',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 5,
  elevation: 1,
},

searchInput: {
  flex: 1,
  height: 46,
  marginLeft: 8,
  paddingVertical: 0,
  fontSize: 14,
  color: COLORS.ink,
},

clearButton: {
  width: 26,
  height: 26,
  alignItems: 'center',
  justifyContent: 'center',
},

/* HERO / DID YOU KNOW */

heroShadow: {
  width: '100%',
  marginTop: 0,
  marginBottom: 16,
  borderRadius: 24,
  backgroundColor: COLORS.orange,
  shadowColor: COLORS.brick,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.18,
  shadowRadius: 10,
  elevation: 4,
},

heroCard: {
  width: '100%',
  height: 195,
  borderRadius: 15,
  overflow: 'hidden',
  backgroundColor: COLORS.orange,
},

heroSlide: {
  height: 195,
  backgroundColor: COLORS.orange,
},

heroImage: {
  ...StyleSheet.absoluteFillObject,
  width: '100%',
  height: '100%',
  resizeMode: 'cover',
},

heroDecorLarge: {
  position: 'absolute',
  width: 210,
  height: 210,
  borderRadius: 105,
  right: -60,
  top: -70,
  backgroundColor: 'rgba(255,255,255,0.10)',
},

  heroDecorSmall: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    left: -45,
    bottom: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  heroWatermark: {
    position: 'absolute',
    right: 14,
    top: 70,
  },

  heroTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(110,40,8,0.30)',
  },

  heroTintBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '58%',
    backgroundColor: 'rgba(40,14,4,0.30)',
  },

  heroContent: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 66, // เว้นที่ให้แถวปุ่มควบคุมด้านล่าง
    justifyContent: 'space-between',
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  heroBadge: {
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  heroBadgeText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: COLORS.orange,
    letterSpacing: 0.5,
  },

  heroCategoryBadge: {
    maxWidth: 140,
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  heroTitle: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '800',
    color: COLORS.white,
  },

  heroDescription: {
    marginTop: 5,
    fontSize: 12.5,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.92)',
  },

  heroControls: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  arrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  dotActive: {
    width: 18,
    backgroundColor: COLORS.white,
  },

  counterText: {
    minWidth: 44,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },

  heroReadMore: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  heroReadText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.brick,
  },

  heroState: {
    height: 200,
    borderRadius: 28,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 18,
  },

  heroStateText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

/* CHECKLIST REMINDER */

reminderPanel: {
  backgroundColor: COLORS.cream,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: COLORS.creamBorder,
  padding: 12,
  marginBottom: 16,
},

reminderHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
},

reminderHeaderIcon: {
  width: 34,
  height: 34,
  borderRadius: 17,
  backgroundColor: '#FBD9C2',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 8,
},

reminderHeaderText: {
  flex: 1,
  paddingRight: 4,
},

panelTitle: {
  fontSize: 15,
  fontWeight: '800',
  color: COLORS.ink,
},

panelSubtitle: {
  marginTop: 2,
  fontSize: 11,
  color: COLORS.inkSoft,
},

seeAll: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 1,
},

seeAllText: {
  fontSize: 11,
  fontWeight: '700',
  color: COLORS.orange,
},

reminderMessage: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 12,
  gap: 4,
},

messageTitle: {
  fontSize: 13,
  fontWeight: '700',
  color: COLORS.ink,
},

messageText: {
  fontSize: 11.5,
  color: COLORS.inkSoft,
  textAlign: 'center',
},

reminderRow: {
  flexDirection: 'row',
  alignItems: 'center',
  borderRadius: 14,
  paddingVertical: 9,
  paddingLeft: 9,
  paddingRight: 8,
  marginBottom: 7,
},

urgencyIcon: {
  width: 30,
  height: 30,
  borderRadius: 15,
  backgroundColor: 'rgba(255,255,255,0.7)',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 8,
},

reminderRowText: {
  flex: 1,
  minWidth: 0,
  paddingRight: 5,
},

reminderItemTitle: {
  fontSize: 12.5,
  lineHeight: 17,
  fontWeight: '700',
  color: COLORS.ink,
},

reminderMeta: {
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 5,
  marginTop: 4,
},

dueChip: {
  backgroundColor: 'rgba(255,255,255,0.75)',
  borderRadius: 8,
  paddingHorizontal: 6,
  paddingVertical: 2,
},

dueChipText: {
  fontSize: 10.5,
  fontWeight: '700',
},

reminderTaskTitle: {
  flex: 1,
  minWidth: 0,
  fontSize: 10.5,
  color: COLORS.inkSoft,
},

reminderMore: {
  textAlign: 'center',
  fontSize: 11.5,
  fontWeight: '700',
  color: COLORS.brick,
  paddingTop: 3,
},

  /* EVENTS (กรอบใหญ่) */

eventsGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 10,
},

eventCard: {
  flex: 1,
  minWidth: 0,
  backgroundColor: '#FFFFFF',
  borderRadius: 14,
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: '#EFE8E4',
},

eventImage: {
  width: '100%',
  height: 105,
  backgroundColor: '#F3E9E1',
},

eventContent: {
  padding: 9,
},

eventTitle: {
  fontSize: 12,
  lineHeight: 17,
  fontWeight: '700',
  color: '#1A1A1A',
},

eventDate: {
  fontSize: 10,
  lineHeight: 14,
  color: '#E8692B',
  marginTop: 4,
},

eventVenue: {
  fontSize: 10,
  lineHeight: 14,
  color: '#8E8985',
  marginTop: 3,
},

  eventsFrame: {
    backgroundColor: COLORS.cream,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.creamBorder,
    padding: 14,
    shadowColor: '#AFA7A2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },

  eventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

 eventRow: {
  flexDirection: 'row',
  alignItems: 'stretch',
  justifyContent: 'space-between',
  gap: 10,
  marginBottom: 10,
  width: '100%',
},

eventSpacer: {
  flex: 1,
  minWidth: 0,
},

eventSkeleton: {
  flex: 1,
  minWidth: 0,
  height: 155,
  borderRadius: 14,
  backgroundColor: COLORS.skeleton,
},

  eventsMessage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 26,
    gap: 8,
  },

eventImagePlaceholder: {
  backgroundColor: 'rgba(255,255,255,0.55)',
  alignItems: 'center',
  justifyContent: 'center',
},

eventBody: {
  padding: 9,
  gap: 6,
},

eventDateChip: {
  alignSelf: 'flex-start',
  flexDirection: 'row',
  alignItems: 'center',
  flexShrink: 1,
  gap: 4,
  backgroundColor: 'rgba(255,255,255,0.7)',
  borderRadius: 9,
  paddingHorizontal: 7,
  paddingVertical: 3,
},

eventDateText: {
  flexShrink: 1,
  fontSize: 10,
  lineHeight: 14,
  fontWeight: '700',
  color: COLORS.brick,
},

eventVenueRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  marginTop: 'auto',
  paddingTop: 2,
},

eventVenueText: {
  flex: 1,
  fontSize: 11,
  color: COLORS.inkSoft,
},

  allButton: {
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.brick,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },

  allButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* BOTTOM */

  bottomSpace: {
    height: 90, // กันปุ่มแชตบอทลอยทับเนื้อหาส่วนท้าย
  },
});
