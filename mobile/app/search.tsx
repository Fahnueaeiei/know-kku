// @ts-nocheck

import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { getPlaces, getEvents, fetchTasks, getTrivia } from "../api/api";
import { fetchKkuEvents } from "../api/events";
import { COLORS } from "../constants/appTheme";
import { searchPlaces } from "../utils/searchPlaces"; // ← แก้ path ให้ตรงกับไฟล์จริงของคุณ

/* =========================================================
   TYPES
========================================================= */

type ResultType = "place" | "event" | "checklist" | "trivia";

// รูปร่างที่ searchPlaces ต้องการ (name/category/description/address/aliases)
// + เก็บตัวผลลัพธ์จริงไว้ใน item
type Searchable = {
    name: string;
    category?: string | null;
    description?: string | null;
    item: SearchItem;
};

type SearchItem = {
    key: string;
    type: ResultType;
    title: string;
    subtitle?: string;
    extraText: string; // ข้อความเสริมที่ใช้ค้น (ค้นแบบตรงตัว)
    onPress: () => void;
};

const TYPE_META: Record<ResultType, { label: string; icon: string }> = {
    place: { label: "สถานที่", icon: "location-outline" },
    event: { label: "กิจกรรม", icon: "calendar-outline" },
    checklist: { label: "Checklist", icon: "checkbox-outline" },
    trivia: { label: "เกร็ดน่ารู้", icon: "bulb-outline" },
};

const TYPE_ORDER: ResultType[] = ["place", "event", "checklist", "trivia"];

/* =========================================================
   SEARCH LOGIC
   ใช้ searchPlaces (utils/searchbar) กับทุกชนิดข้อมูล
   → ได้การจับชื่อเล่น / พิมพ์ผิดเล็กน้อย / sc9 = SC.09 เหมือนหน้า Place

   ชื่อเล่นข้ามชนิด: ถ้าคำค้นตรงกับสถานที่ ไม่เกิน MAX_ALIAS_EXPAND แห่ง
   (เช่น "ตึกหลอด" → SC.06) จะค้นด้วยชื่อสถานที่นั้นเพิ่ม
   เพื่อให้เจอกิจกรรม/Checklist ที่เขียนว่า "SC06" ด้วย
========================================================= */

const MAX_ALIAS_EXPAND = 3;

const toSearchable = (item: SearchItem): Searchable => ({
    name: item.title,
    category: item.subtitle,
    description: item.extraText,
    item,
});

function runSearch(items: SearchItem[], query: string): SearchItem[] {
    const q = query.trim();
    if (!q) return [];

    const searchables = items.map(toSearchable);

    // 1) ค้นด้วยคำที่พิมพ์
    const variants = [q];

    // 2) ขยายด้วยชื่อสถานที่ที่ชื่อเล่นตรงกัน
    const placeHits = searchPlaces(
        searchables.filter((s) => s.item.type === "place"),
        q
    );
    if (placeHits.length > 0 && placeHits.length <= MAX_ALIAS_EXPAND) {
        placeHits.forEach((p) => variants.push(p.name));
    }

    // รวมผลทุก variant (คงลำดับคะแนน, กันซ้ำ)
    const seen = new Set<string>();
    const merged: SearchItem[] = [];

    variants.forEach((variant) => {
        searchPlaces(searchables, variant).forEach((s) => {
            if (!seen.has(s.item.key)) {
                seen.add(s.item.key);
                merged.push(s.item);
            }
        });
    });

    return merged;
}

/* =========================================================
   SEARCH SCREEN
========================================================= */

export default function SearchScreen() {
    const router = useRouter();
    const { q } = useLocalSearchParams<{ q?: string }>();

    const [query, setQuery] = useState(String(q ?? ""));
    const [typeFilter, setTypeFilter] = useState<ResultType | "all">("all");
    const [loading, setLoading] = useState(true);
    const [index, setIndex] = useState<SearchItem[]>([]);

    // รับค่าใหม่เมื่อกลับมาค้นจาก Home อีกครั้ง
    useEffect(() => {
        setQuery(String(q ?? ""));
    }, [q]);

    /* ---------- สร้าง index จากทุกแหล่งข้อมูล ---------- */

    useEffect(() => {
        let mounted = true;

        const build = async () => {
            const [placesRes, eventsRes, kkuRes, tasksRes, triviaRes] =
                await Promise.allSettled([
                    getPlaces(),
                    getEvents(),
                    fetchKkuEvents(20),
                    fetchTasks(),
                    getTrivia(),
                ]);

            const items: SearchItem[] = [];

            // สถานที่ (title ต้องเป็น p.name ตรงตัว เพราะ PLACE_ALIASES ใช้ชื่อนี้เป็น key)
            if (placesRes.status === "fulfilled") {
                placesRes.value.forEach((p) =>
                    items.push({
                        key: `place-${p.placeId}`,
                        type: "place",
                        title: p.name,
                        subtitle: p.category,
                        extraText: [p.description, p.address].filter(Boolean).join(" "),
                        onPress: () => router.push(`/place/${p.placeId}`),
                    })
                );
            }

            // กิจกรรมของแอป
            if (eventsRes.status === "fulfilled") {
                eventsRes.value.forEach((e) =>
                    items.push({
                        key: `event-${e.eventId}`,
                        type: "event",
                        title: e.title,
                        subtitle: e.category ?? undefined,
                        extraText: [e.description, e.location].filter(Boolean).join(" "),
                        onPress: () => router.push(`/event/${e.eventId}`),
                    })
                );
            }

            // กิจกรรมของ มข.
            if (kkuRes.status === "fulfilled") {
                kkuRes.value.forEach((e) =>
                    items.push({
                        key: `event-kku-${e.id}`,
                        type: "event",
                        title: e.title,
                        subtitle: [e.dateLabel, e.venue].filter(Boolean).join(" • "),
                        extraText: [e.venue, e.organizer, ...(e.categories ?? [])]
                            .filter(Boolean)
                            .join(" "),
                        onPress: () =>
                            router.push({
                                pathname: "/event/[id]" as any,
                                params: {
                                    id: `kku-${e.id}`,
                                    source: "kku",
                                    title: e.title,
                                    dateLabel: e.dateLabel ?? "",
                                    venue: e.venue ?? "",
                                    imageUrl: e.imageUrl ?? "",
                                    url: e.url ?? "",
                                },
                            }),
                    })
                );
            }

            // Checklist
            if (tasksRes.status === "fulfilled") {
                tasksRes.value.forEach((task) =>
                    task.items.forEach((item) =>
                        items.push({
                            key: `check-${task.taskId}-${item.itemId}`,
                            type: "checklist",
                            title: item.title,
                            subtitle: task.title,
                            extraText: [item.subtitle, item.note, item.location]
                                .filter(Boolean)
                                .join(" "),
                            onPress: () => router.push("/checklist"),
                        })
                    )
                );
            }

            // เกร็ดน่ารู้
            if (triviaRes.status === "fulfilled") {
                triviaRes.value.forEach((t) =>
                    items.push({
                        key: `trivia-${t.newsId}`,
                        type: "trivia",
                        title: t.title,
                        subtitle: t.category ?? undefined,
                        extraText: t.description ?? "",
                        onPress: () => {
                            if (t.externalLink) {
                                Linking.openURL(t.externalLink).catch(() => { });
                            }
                        },
                    })
                );
            }

            if (mounted) {
                setIndex(items);
                setLoading(false);
            }
        };

        build();

        return () => {
            mounted = false;
        };
    }, [router]);

    /* ---------- กรองผลลัพธ์ ---------- */

    const results = useMemo(() => runSearch(index, query), [index, query]);

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: results.length };
        results.forEach((r) => {
            c[r.type] = (c[r.type] ?? 0) + 1;
        });
        return c;

    }, [results]);

    const closeSearch = () => {
        setQuery("");

        if (router.canGoBack()) {
            router.back(); // กลับไปหน้าที่เปิดค้นหามา (ปกติคือ Home)
        } else {
            router.replace("/"); // เปิดหน้า search ตรง ๆ ผ่านลิงก์ → ไป Home
        }
    };

    // ถ้าชนิดที่เลือกอยู่ไม่มีผลแล้ว (พิมพ์คำใหม่) ให้กลับไป "ทั้งหมด"
    useEffect(() => {
        if (typeFilter !== "all" && !counts[typeFilter]) setTypeFilter("all");
    }, [counts, typeFilter]);

    const visible = useMemo(() => {
        const filtered =
            typeFilter === "all"
                ? results
                : results.filter((r) => r.type === typeFilter);

        // แสดงเรียงตามชนิด (สถานที่ → กิจกรรม → ...) คงลำดับคะแนนภายในชนิดเดียวกัน
        return [...filtered].sort(
            (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type)
        );
    }, [results, typeFilter]);

    /* ---------- RENDER ---------- */

    return (
        <View style={styles.container}>
            {/* SEARCH BOX */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={18} color={COLORS.textLight} />

                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    style={styles.searchInput}
                    placeholder="ค้นหาสถานที่ กิจกรรม Checklist..."
                    placeholderTextColor="#99928E"
                    autoFocus={!q}
                    returnKeyType="search"
                />

                {query.length > 0 && (
                    <TouchableOpacity onPress={closeSearch} activeOpacity={0.7}>
                        <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
                    </TouchableOpacity>
                )}
            </View>

            {/* TYPE FILTER */}
            {results.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.chipScroll}
                    contentContainerStyle={styles.chipRow}
                >
                    {(["all", ...TYPE_ORDER] as const)
                        .filter((t) => t === "all" || counts[t])
                        .map((t) => {
                            const active = typeFilter === t;
                            return (
                                <TouchableOpacity
                                    key={t}
                                    activeOpacity={0.8}
                                    style={[styles.chip, active && styles.chipActive]}
                                    onPress={() => setTypeFilter(t)}
                                >
                                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                        {t === "all" ? "ทั้งหมด" : TYPE_META[t].label} ({counts[t] ?? 0})
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                </ScrollView>
            )}

            {/* RESULTS */}
            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.listContent}
            >
                {loading && (
                    <View style={styles.state}>
                        <ActivityIndicator color={COLORS.orange} />
                        <Text style={styles.stateText}>กำลังโหลดข้อมูล...</Text>
                    </View>
                )}

                {!loading && !query.trim() && (
                    <View style={styles.state}>
                        <Ionicons name="search-outline" size={28} color={COLORS.textLight} />
                        <Text style={styles.stateText}>
                            พิมพ์เพื่อค้นหาสถานที่ กิจกรรม หรือ Checklist
                        </Text>
                    </View>
                )}

                {!loading && !!query.trim() && results.length === 0 && (
                    <View style={styles.state}>
                        <Ionicons name="sad-outline" size={28} color={COLORS.textLight} />
                        <Text style={styles.stateTitle}>ไม่พบ “{query.trim()}”</Text>
                        <Text style={styles.stateText}>ลองใช้คำอื่น หรือพิมพ์สั้นลง</Text>
                    </View>
                )}

                {visible.map((item) => (
                    <TouchableOpacity
                        key={item.key}
                        activeOpacity={0.85}
                        style={styles.row}
                        onPress={item.onPress}
                    >
                        <View style={styles.rowIcon}>
                            <Ionicons
                                name={TYPE_META[item.type].icon}
                                size={18}
                                color={COLORS.brick}
                            />
                        </View>

                        <View style={styles.rowText}>
                            <Text style={styles.rowTitle} numberOfLines={2}>
                                {item.title}
                            </Text>
                            <Text style={styles.rowSub} numberOfLines={1}>
                                {TYPE_META[item.type].label}
                                {item.subtitle ? ` • ${item.subtitle}` : ""}
                            </Text>
                        </View>

                        <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingHorizontal: 16,
        paddingTop: 12,
    },

    searchContainer: {
        height: 46,
        borderRadius: 23,
        backgroundColor: COLORS.white,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 12,
        borderWidth: 0.5,
        borderColor: "#F0EBE8",
    },

    searchInput: {
        flex: 1,
        height: 46,
        marginLeft: 8,
        paddingVertical: 0,
        fontSize: 14,
        color: COLORS.ink,
    },

    chipScroll: { flexGrow: 0, marginBottom: 12 },
    chipRow: { gap: 8 },

    chip: {
        height: 34,
        paddingHorizontal: 13,
        borderRadius: 17,
        backgroundColor: COLORS.cream,
        borderWidth: 1,
        borderColor: COLORS.creamBorder,
        justifyContent: "center",
    },
    chipActive: { backgroundColor: COLORS.brick, borderColor: COLORS.brick },
    chipText: { fontSize: 12.5, fontWeight: "700", color: COLORS.inkSoft },
    chipTextActive: { color: "#FFFFFF" },

    listContent: { paddingBottom: 40 },

    row: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 12,
        marginBottom: 8,
    },
    rowIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: COLORS.cream,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    rowText: { flex: 1, minWidth: 0, paddingRight: 6 },
    rowTitle: { fontSize: 14, lineHeight: 20, fontWeight: "700", color: COLORS.ink },
    rowSub: { marginTop: 2, fontSize: 11.5, color: COLORS.textLight },

    state: { alignItems: "center", paddingTop: 48, gap: 8 },
    stateTitle: { fontSize: 15, fontWeight: "800", color: COLORS.ink },
    stateText: { fontSize: 13, color: COLORS.inkSoft, textAlign: "center" },
});