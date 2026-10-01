import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Pressable,
  LayoutAnimation,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import Confetti from "./Confetti";

// ปรับ path ให้ตรงกับโปรเจกต์ (เช่น "@/lib/api")
import {
  ApiPlace,
  ChecklistItem,
  ChecklistTask,
  ItemPatch,
  NewChecklistTask,
  getPlaces,
  fetchTasks,
  updateItem as updateItemApi,
  deleteItem as deleteItemApi,
  createTask as createTaskApi,
  updateTask as updateTaskApi,
  deleteTask as deleteTaskApi,
  setItemCompleted as setItemCompletedApi,
  extractChecklistFromDocument,
  GetToken,
} from "../api/api";

/* =========================================================
   THEME
========================================================= */

const INK = "#1A1A1A";
const INK_SOFT = "#4A4644";
const PAGE_BG = "#FCF9F7";
const ORANGE = "#E8692B";
const OVERDUE = "#C62828";
const TODAY = "#B8480F";

// สีการ์ดวนตามลำดับ: ชมพู, มิ้นต์, ม่วง, พีช, ฟ้า
const CARD_COLORS = ["#F7D6E4", "#B5EFE3", "#E3DBFA", "#FDE2C6", "#D2E7FB"];

const ROW_BG = "rgba(255,255,255,0.42)";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/* =========================================================
   DATE / LINK HELPERS
   เก็บวันที่เป็น "YYYY-MM-DD" และเวลาเป็น "HH:mm" (เวลาเครื่อง ไม่มีปัญหา timezone)
========================================================= */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const pad = (n: number) => String(n).padStart(2, "0");

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const toHHmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const fromISODate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const fromHHmm = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

function formatDue(dateISO: string, time: string | null) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  let label: string;

  if (dateISO === toISODate(today)) {
    label = "Today";
  } else if (dateISO === toISODate(tomorrow)) {
    label = "Tomorrow";
  } else {
    const d = fromISODate(dateISO);
    label = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
    if (d.getFullYear() !== today.getFullYear()) label += ` ${d.getFullYear()}`;
  }

  return time ? `${label}, ${time}` : label;
}

function isOverdue(item: ChecklistItem) {
  if (item.completed || !item.dueDate) return false;

  const now = new Date();
  const today = toISODate(now);

  if (item.dueDate < today) return true;

  return (
    item.dueDate === today && !!item.dueTime && item.dueTime < toHHmm(now)
  );
}

const normalizeUrl = (u: string) =>
  /^[a-z][a-z0-9+.-]*:/i.test(u) ? u : `https://${u}`;

const openUrl = (u: string) => {
  const url = normalizeUrl(u);
  Linking.openURL(url).catch(() => Alert.alert("Can't open link", url));
};

// ปรับให้ตรงกับ route หน้ารายละเอียด Place ของโปรเจกต์
const PLACE_ROUTE = (placeId: number) => `/place/${placeId}`;

const openMap = (place: string) => {
  // เติมชื่อมหาวิทยาลัย กันค้นแล้วไปโผล่ที่อื่น (เช่น "SC09")
  const q = encodeURIComponent(`${place}, Khon Kaen University`);
  const url = Platform.select({
    ios: `http://maps.apple.com/?q=${q}`,
    default: `geo:0,0?q=${q}`,
  }) as string;
  Linking.openURL(url).catch(() => Alert.alert("Can't open maps", place));
};

const animate = () =>
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

function formatCompletedDate(iso: string) {
  const d = new Date(iso);
  let label = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  if (d.getFullYear() !== new Date().getFullYear()) label += ` ${d.getFullYear()}`;
  return label;
}

function lastCompletedAt(task: ChecklistTask): string | null {
  const stamps = task.items
    .map((i) => i.completedAt)
    .filter((v): v is string => !!v);
  return stamps.length ? stamps.sort().slice(-1)[0] : null;
}

// แปลงเช็คลิสต์เดิมเป็นรูปแบบเดียวกับฟอร์ม เพื่อใช้ฟอร์มเดียวทั้งสร้างและแก้ไข
const taskToDraft = (task: ChecklistTask): NewChecklistTask => ({
  title: task.title,
  description: task.description ?? undefined,
  items: task.items.map((i) => ({
    itemId: i.itemId,
    completed: i.completed,
    title: i.title,
    subtitle: i.subtitle ?? undefined,
    dueDate: i.dueDate,
    dueTime: i.dueTime,
    note: i.note ?? undefined,
    url: i.url ?? undefined,
    location: i.location ?? undefined,
    placeId: i.placeId,
  })),
});

/* =========================================================
   SCREEN
========================================================= */

export default function ChecklistScreen() {
  // ตอนต่อ Clerk: const { getToken } = useAuth();
  const getToken: GetToken | undefined = undefined;
  const router = useRouter();

  const [tasks, setTasks] = useState<ChecklistTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showChoice, setShowChoice] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [docDraft, setDocDraft] = useState<NewChecklistTask | null>(null);
  const [docName, setDocName] = useState<string | null>(null);
  const [tab, setTab] = useState<"todo" | "completed">("todo");
  const [formMode, setFormMode] = useState<"create" | "checklist">("create");
  const [editMode, setEditMode] = useState<
    | { kind: "checklist"; task: ChecklistTask }
    | { kind: "item"; task: ChecklistTask; item: ChecklistItem }
    | null
  >(null);
  const [places, setPlaces] = useState<ApiPlace[]>([]);
  const [celebration, setCelebration] = useState<{
    key: number;
    title: string;
  } | null>(null);

  /* ---------- LOAD ---------- */

  const load = useCallback(async () => {
    try {
      setLoadError(false);
      setTasks(await fetchTasks(getToken));
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // สถานที่ในแอป ใช้แนะนำตอนกรอก Location (โหลดไม่ได้ก็พิมพ์เองได้)
  useEffect(() => {
    getPlaces()
      .then(setPlaces)
      .catch(() => {});
  }, []);

  /* ---------- TO-DO / COMPLETED ---------- */

  const { todo, completed, colorOf } = useMemo(() => {
    const isDone = (t: ChecklistTask) =>
      t.items.length > 0 && t.items.every((i) => i.completed);

    // สีผูกกับลำดับเดิมของเช็คลิสต์ ย้ายแท็บแล้วสีไม่เปลี่ยน
    const colors = new Map<number, string>(
      tasks.map((t, i) => [t.taskId, CARD_COLORS[i % CARD_COLORS.length]])
    );

    return {
      todo: tasks.filter((t) => !isDone(t)),
      completed: tasks.filter(isDone),
      colorOf: colors,
    };
  }, [tasks]);

  const visible = tab === "todo" ? todo : completed;

  // ต้องคงที่ ไม่งั้นฟอร์มจะถูกเติมใหม่ทุกครั้งที่หน้าจอ re-render
  const modalDraft = useMemo(
    () => (editMode?.kind === "checklist" ? taskToDraft(editMode.task) : docDraft),
    [editMode, docDraft]
  );

  /* ---------- TOGGLE (optimistic + rollback) ---------- */

  const applyCompleted = (
    list: ChecklistTask[],
    itemId: number,
    value: boolean
  ) =>
    list.map((task) => ({
      ...task,
      items: task.items.map((item) =>
        item.itemId === itemId
          ? {
              ...item,
              completed: value,
              completedAt: value ? new Date().toISOString() : null,
            }
          : item
      ),
    }));

  const toggleItem = async (itemId: number, current: boolean) => {
    const next = !current;

    // ติ๊กข้อนี้แล้วทำให้ทั้งเช็คลิสต์ครบพอดีหรือไม่
    const owner = tasks.find((t) => t.items.some((i) => i.itemId === itemId));
    const completesTask =
      next &&
      !!owner &&
      owner.items.every((i) => i.itemId === itemId || i.completed);

    animate();
    setTasks((prev) => applyCompleted(prev, itemId, next));

    try {
      await setItemCompletedApi(itemId, next, getToken);
      if (completesTask && owner) {
        setCelebration({ key: Date.now(), title: owner.title });
      }
    } catch {
      animate();
      setTasks((prev) => applyCompleted(prev, itemId, current));
      Alert.alert("Couldn't save", "Please try again.");
    }
  };

  /* ---------- CREATE / EDIT / DELETE ---------- */

  const closeCreate = () => {
    setShowCreate(false);
    setDocDraft(null);
    setDocName(null);
    setEditMode(null);
  };

  const handleSave = async (draft: NewChecklistTask) => {
    if (editMode?.kind === "checklist") {
      const updated = await updateTaskApi(editMode.task.taskId, draft, getToken);
      animate();
      setTasks((prev) =>
        prev.map((t) => (t.taskId === updated.taskId ? updated : t))
      );
    } else {
      const created = await createTaskApi(draft, getToken);
      setTasks((prev) => [...prev, created]);
    }
    closeCreate();
  };

  const startEditChecklist = (task: ChecklistTask) => {
    setFormMode("checklist");
    setEditMode({ kind: "checklist", task });
    setShowCreate(true);
  };

  const saveItem = async (patch: ItemPatch) => {
    if (editMode?.kind !== "item") return;

    const updated = await updateItemApi(editMode.item.itemId, patch, getToken);
    animate();
    setTasks((prev) =>
      prev.map((t) => ({
        ...t,
        items: t.items.map((i) => (i.itemId === updated.itemId ? updated : i)),
      }))
    );
    setEditMode(null);
  };

  const confirmDelete = (task: ChecklistTask) =>
    Alert.alert(
      "Delete checklist?",
      `"${task.title}" and its ${task.items.length} tasks will be permanently deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTaskApi(task.taskId, getToken);
              animate();
              setTasks((prev) => prev.filter((t) => t.taskId !== task.taskId));
            } catch {
              Alert.alert("Couldn't delete", "Please try again.");
            }
          },
        },
      ]
    );

  const deleteItem = (task: ChecklistTask, item: ChecklistItem) => {
    // เช็คลิสต์ต้องมีอย่างน้อย 1 รายการ
    if (task.items.length === 1) {
      Alert.alert(
        "This is the last task",
        "A checklist needs at least one task. Delete the whole checklist instead?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete checklist",
            style: "destructive",
            onPress: () => {
              setEditMode(null);
              confirmDelete(task);
            },
          },
        ]
      );
      return;
    }

    Alert.alert("Delete task?", `"${item.title}" will be permanently deleted.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteItemApi(item.itemId, getToken);
            animate();
            setTasks((prev) =>
              prev.map((t) =>
                t.taskId === task.taskId
                  ? { ...t, items: t.items.filter((i) => i.itemId !== item.itemId) }
                  : t
              )
            );
            setEditMode(null);
          } catch {
            Alert.alert("Couldn't delete", "Please try again.");
          }
        },
      },
    ]);
  };

  const openMenu = (task: ChecklistTask) =>
    Alert.alert(task.title, undefined, [
      { text: "Edit checklist", onPress: () => startEditChecklist(task) },
      {
        text: "Delete checklist",
        style: "destructive",
        onPress: () => confirmDelete(task),
      },
      { text: "Cancel", style: "cancel" },
    ]);

  // มี placeId → เปิดหน้า Place ในแอป / ไม่มี → ค้นแผนที่ด้วยข้อความ
  const openLocation = (item: ChecklistItem) => {
    if (item.placeId != null) {
      router.push(PLACE_ROUTE(item.placeId) as any);
    } else if (item.location) {
      openMap(item.location);
    }
  };

  /* ---------- CREATE FROM DOCUMENT ---------- */

  const MAX_DOC_BYTES = 10 * 1024 * 1024;

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      if (asset.size && asset.size > MAX_DOC_BYTES) {
        Alert.alert("ไฟล์ใหญ่เกินไป", "เลือกไฟล์ที่ไม่เกิน 10 MB");
        return;
      }

      setExtracting(true);

      const draft = await extractChecklistFromDocument(
        { uri: asset.uri, name: asset.name, mimeType: asset.mimeType },
        getToken
      );

      setDocDraft(draft);
      setDocName(asset.name);
      setFormMode("create");
      setShowCreate(true);
    } catch {
      Alert.alert(
        "อ่านเอกสารไม่สำเร็จ",
        "ลองใหม่อีกครั้ง หรือสร้างเช็คลิสต์เองก็ได้"
      );
    } finally {
      setExtracting(false);
    }
  };

  /* ---------- RENDER ---------- */

  const emptyText =
    tab === "todo"
      ? completed.length > 0
        ? "All caught up. Nice work!"
        : "No checklists yet. Tap the button below to create one."
      : "Nothing completed yet. Finish a checklist and it will show up here.";

  return (
    <View style={styles.container}>
      {!loading && (
        <Tabs
          tab={tab}
          todoCount={todo.length}
          completedCount={completed.length}
          onChange={(next) => {
            animate();
            setTab(next);
          }}
        />
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={ORANGE} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={ORANGE}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
        >
          {loadError && (
            <TouchableOpacity style={styles.errorBox} onPress={load}>
              <Text style={styles.errorText}>
                Couldn't load checklists. Tap to retry.
              </Text>
            </TouchableOpacity>
          )}

          {visible.map((task) => (
            <TaskCard
              key={task.taskId}
              task={task}
              color={colorOf.get(task.taskId) ?? CARD_COLORS[0]}
              onToggle={toggleItem}
              onMenu={() => openMenu(task)}
              onEditItem={(item) => setEditMode({ kind: "item", task, item })}
              onOpenLocation={openLocation}
            />
          ))}

          {visible.length === 0 && (
            <Text style={styles.emptyHint}>{emptyText}</Text>
          )}
        </ScrollView>
      )}

      {!loading && (
        <View style={styles.fabWrap} pointerEvents="box-none">
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.fab}
            onPress={() => setShowChoice(true)}
          >
            <Ionicons name="add" size={22} color={ORANGE} />
            <Text style={styles.fabText}>สร้างเช็คลิสต์ใหม่</Text>
          </TouchableOpacity>
        </View>
      )}

      <CreateChoiceSheet
        visible={showChoice}
        onClose={() => setShowChoice(false)}
        onManual={() => {
          setShowChoice(false);
          setFormMode("create");
          setTimeout(() => setShowCreate(true), 250);
        }}
        onUpload={() => {
          setShowChoice(false);
          // รอให้ sheet ปิดก่อน ไม่งั้น iOS เปิดตัวเลือกไฟล์ไม่ขึ้น
          setTimeout(pickDocument, 350);
        }}
      />

      <CreateTaskModal
        visible={showCreate}
        initialDraft={modalDraft}
        sourceName={docName}
        mode={formMode}
        places={places}
        onClose={closeCreate}
        onSave={handleSave}
      />

      <EditItemModal
        visible={editMode?.kind === "item"}
        item={editMode?.kind === "item" ? editMode.item : null}
        places={places}
        onClose={() => setEditMode(null)}
        onSave={saveItem}
        onDelete={() => {
          if (editMode?.kind === "item") deleteItem(editMode.task, editMode.item);
        }}
      />

      {extracting && (
        <View style={styles.busy}>
          <ActivityIndicator color={ORANGE} size="large" />
          <Text style={styles.busyText}>กำลังอ่านเอกสาร...</Text>
        </View>
      )}

      {celebration && (
        <>
          <Confetti key={celebration.key} onDone={() => setCelebration(null)} />
          <View style={styles.toast} pointerEvents="none">
            <Text style={styles.toastText} numberOfLines={1}>
              {`🎉 "${celebration.title}" completed!`}
            </Text>
            <Text style={styles.toastSub}>Moved to Completed</Text>
          </View>
        </>
      )}
    </View>
  );
}

/* =========================================================
   TABS: To-do / Completed
========================================================= */

function Tabs({
  tab,
  todoCount,
  completedCount,
  onChange,
}: {
  tab: "todo" | "completed";
  todoCount: number;
  completedCount: number;
  onChange: (tab: "todo" | "completed") => void;
}) {
  const options: { key: "todo" | "completed"; label: string }[] = [
    { key: "todo", label: `To-do (${todoCount})` },
    { key: "completed", label: `Completed (${completedCount})` },
  ];

  return (
    <View style={styles.tabs}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.key}
          activeOpacity={0.8}
          style={[styles.tab, tab === o.key && styles.tabActive]}
          onPress={() => onChange(o.key)}
        >
          <Text style={[styles.tabText, tab === o.key && styles.tabTextActive]}>
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* =========================================================
   TASK CARD
   - แตะ checkbox = ติ๊กเสร็จ/ไม่เสร็จ
   - แตะแถว = เปิด/ปิดรายละเอียด (มีปุ่ม Edit)
   - ปุ่ม ... มุมขวาบน = แก้ไข / ลบ ทั้งเช็คลิสต์
========================================================= */

function TaskCard({
  task,
  color,
  onToggle,
  onMenu,
  onEditItem,
  onOpenLocation,
}: {
  task: ChecklistTask;
  color: string;
  onToggle: (itemId: number, current: boolean) => void;
  onMenu: () => void;
  onEditItem: (item: ChecklistItem) => void;
  onOpenLocation: (item: ChecklistItem) => void;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const total = task.items.length;
  const done = task.items.filter((i) => i.completed).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const isDone = total > 0 && done === total;
  const completedAt = isDone ? lastCompletedAt(task) : null;

  return (
    <View style={[styles.card, { backgroundColor: color }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{task.title}</Text>
          {isDone && (
            <Text style={styles.completedOn}>
              {completedAt
                ? `Completed ${formatCompletedDate(completedAt)}`
                : "Completed"}
            </Text>
          )}
        </View>

        {isDone && (
          <View style={styles.doneBadge}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.menuBtn}
          onPress={onMenu}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={INK} />
        </TouchableOpacity>
      </View>

      {task.items.map((item, index) => {
        const open = expandedId === item.itemId;

        return (
          <View key={item.itemId} style={styles.rowWrap}>
            <Pressable
              style={styles.rowMain}
              onPress={() => {
                animate();
                setExpandedId(open ? null : item.itemId);
              }}
            >
              <View
                style={[
                  styles.numberCircle,
                  item.completed && styles.numberCircleDone,
                ]}
              >
                <Text
                  style={[
                    styles.numberText,
                    item.completed && styles.numberTextDone,
                  ]}
                >
                  {index + 1}
                </Text>
              </View>

              <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                {!!item.subtitle && (
                  <Text style={styles.rowSubtitle}>({item.subtitle})</Text>
                )}
                <ItemMeta item={item} />
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[styles.checkbox, item.completed && styles.checkboxDone]}
                onPress={() => onToggle(item.itemId, item.completed)}
              >
                {item.completed && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </Pressable>

            {open && (
              <ItemDetails
                item={item}
                onEdit={() => onEditItem(item)}
                onOpenLocation={() => onOpenLocation(item)}
              />
            )}
          </View>
        );
      })}

      <View style={styles.progressMeta}>
        <Text style={styles.progressLabel}>
          {done}/{total} tasks completed
        </Text>
        <Text style={styles.progressLabel}>{percent}%</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

/* ---------- วันที่ + ไอคอนบอกว่ามีรายละเอียด ---------- */

function ItemMeta({ item }: { item: ChecklistItem }) {
  const hasIcons = !!(item.location || item.url || item.note);

  if (!item.dueDate && !hasIcons) return null;

  const color = item.completed
    ? "#9A928E"
    : isOverdue(item)
    ? OVERDUE
    : item.dueDate === toISODate(new Date())
    ? TODAY
    : INK_SOFT;

  return (
    <View style={styles.metaRow}>
      {!!item.dueDate && (
        <View style={styles.dateChip}>
          <Ionicons name="calendar-outline" size={12} color={color} />
          <Text style={[styles.dateChipText, { color }]}>
            {formatDue(item.dueDate, item.dueTime)}
          </Text>
        </View>
      )}
      {!!item.location && (
        <Ionicons name="location-outline" size={14} color={INK_SOFT} />
      )}
      {!!item.url && <Ionicons name="link-outline" size={14} color={INK_SOFT} />}
      {!!item.note && (
        <Ionicons name="document-text-outline" size={14} color={INK_SOFT} />
      )}
    </View>
  );
}

/* ---------- รายละเอียดที่เปิดออกมา ---------- */

function ItemDetails({
  item,
  onEdit,
  onOpenLocation,
}: {
  item: ChecklistItem;
  onEdit: () => void;
  onOpenLocation: () => void;
}) {
  const hasDetails = !!(item.note || item.url || item.location);
  const linked = item.placeId != null;

  return (
    <View style={styles.details}>
      {!!item.note && <Text style={styles.detailNote}>{item.note}</Text>}

      {!!item.location && (
        <TouchableOpacity
          style={styles.detailLine}
          activeOpacity={0.7}
          onPress={onOpenLocation}
        >
          <Ionicons
            name={linked ? "location" : "location-outline"}
            size={16}
            color={linked ? ORANGE : INK}
          />
          <Text style={styles.detailLinkText} numberOfLines={2}>
            {item.location}
          </Text>
        </TouchableOpacity>
      )}

      {!!item.url && (
        <TouchableOpacity
          style={styles.detailLine}
          activeOpacity={0.7}
          onPress={() => openUrl(item.url!)}
        >
          <Ionicons name="link-outline" size={16} color={INK} />
          <Text style={styles.detailLinkText} numberOfLines={1}>
            {item.url}
          </Text>
        </TouchableOpacity>
      )}

      {!hasDetails && (
        <Text style={styles.detailEmpty}>No extra details yet.</Text>
      )}

      <TouchableOpacity
        style={styles.editBtn}
        activeOpacity={0.7}
        onPress={onEdit}
      >
        <Ionicons name="create-outline" size={14} color={ORANGE} />
        <Text style={styles.editBtnText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );
}

/* =========================================================
   CHOICE SHEET: สร้างเอง / อัปโหลดเอกสาร
========================================================= */

function CreateChoiceSheet({
  visible,
  onClose,
  onManual,
  onUpload,
}: {
  visible: boolean;
  onClose: () => void;
  onManual: () => void;
  onUpload: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetOverlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>สร้างเช็คลิสต์ใหม่</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.option}
            onPress={onManual}
          >
            <View style={[styles.optionIcon, { backgroundColor: CARD_COLORS[0] }]}>
              <Ionicons name="create-outline" size={22} color={INK} />
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>สร้างเอง</Text>
              <Text style={styles.optionDesc}>
                ตั้งชื่อและเพิ่มรายการที่ต้องทำด้วยตัวเอง
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9A928E" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.option}
            onPress={onUpload}
          >
            <View style={[styles.optionIcon, { backgroundColor: CARD_COLORS[1] }]}>
              <Ionicons name="document-text-outline" size={22} color={INK} />
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>อัปโหลดเอกสาร</Text>
              <Text style={styles.optionDesc}>
                แนบ PDF หรือรูป เช่น ประกาศรายงานตัว แล้วให้ระบบสร้างรายการให้
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9A928E" />
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* =========================================================
   DATE / TIME PICKER FIELD
   iOS: ตัวเลือกแบบ compact ของระบบ / Android: dialog ของระบบ
========================================================= */

function PickerField({
  mode,
  value,
  placeholder,
  onChange,
}: {
  mode: "date" | "time";
  value: Date | null;
  placeholder: string;
  onChange: (d: Date | null) => void;
}) {
  const [show, setShow] = useState(false);

  const icon: IconName = mode === "date" ? "calendar-outline" : "time-outline";
  const minimumDate = mode === "date" ? startOfToday() : undefined;

  const clearBtn = (
    <TouchableOpacity
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      onPress={() => onChange(null)}
    >
      <Ionicons name="close-circle" size={18} color="#B7AEAA" />
    </TouchableOpacity>
  );

  if (Platform.OS === "ios") {
    if (!value) {
      return (
        <TouchableOpacity
          style={styles.pickerBtn}
          activeOpacity={0.8}
          onPress={() => onChange(new Date())}
        >
          <Ionicons name={icon} size={15} color={ORANGE} />
          <Text style={styles.pickerBtnText}>{placeholder}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.pickerSet}>
        <DateTimePicker
          value={value}
          mode={mode}
          display="compact"
          minimumDate={minimumDate}
          onChange={(_e: DateTimePickerEvent, d?: Date) => {
            if (d) onChange(d);
          }}
        />
        {clearBtn}
      </View>
    );
  }

  // Android
  return (
    <>
      <View style={styles.pickerSet}>
        <TouchableOpacity
          style={styles.pickerBtn}
          activeOpacity={0.8}
          onPress={() => setShow(true)}
        >
          <Ionicons name={icon} size={15} color={ORANGE} />
          <Text style={styles.pickerBtnText}>
            {value
              ? mode === "date"
                ? formatDue(toISODate(value), null)
                : toHHmm(value)
              : placeholder}
          </Text>
        </TouchableOpacity>
        {value && clearBtn}
      </View>

      {show && (
        <DateTimePicker
          value={value ?? new Date()}
          mode={mode}
          minimumDate={minimumDate}
          onChange={(e: DateTimePickerEvent, d?: Date) => {
            setShow(false);
            if (e.type === "set" && d) onChange(d);
          }}
        />
      )}
    </>
  );
}

/* =========================================================
   LOCATION FIELD: พิมพ์เอง หรือเลือกจากสถานที่ในแอป (Place)
   เลือกจากลิสต์ → เก็บ placeId (กดแล้วเปิดหน้า Place)
   พิมพ์เอง → เก็บเป็นข้อความ (กดแล้วค้นแผนที่)
========================================================= */

type FieldsValue = {
  dueDate: string | null;
  dueTime: string | null;
  location: string;
  placeId: number | null;
  url: string;
  note: string;
};

const emptyFields = (): FieldsValue => ({
  dueDate: null,
  dueTime: null,
  location: "",
  placeId: null,
  url: "",
  note: "",
});

function LocationField({
  location,
  placeId,
  places,
  onChange,
}: {
  location: string;
  placeId: number | null;
  places: ApiPlace[];
  onChange: (patch: { location: string; placeId: number | null }) => void;
}) {
  const [focused, setFocused] = useState(false);
  const linked = placeId != null;
  const query = location.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (!focused || linked || query.length === 0) return [];
    return places
      .filter((p) => p.name.toLowerCase().includes(query))
      .slice(0, 4);
  }, [focused, linked, query, places]);

  return (
    <View>
      <View style={styles.fieldRow}>
        <Ionicons
          name={linked ? "location" : "location-outline"}
          size={18}
          color={linked ? ORANGE : "#9A928E"}
        />
        <TextInput
          value={location}
          // พิมพ์ต่อ = ยกเลิกการผูกกับ Place
          onChangeText={(text) => onChange({ location: text, placeId: null })}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Location (e.g. SC06)"
          placeholderTextColor="#A9A29E"
          style={styles.fieldInput}
        />
      </View>

      {linked && (
        <Text style={styles.linkedHint}>Linked to a place in the app</Text>
      )}

      {suggestions.map((p) => (
        <TouchableOpacity
          key={p.placeId}
          activeOpacity={0.7}
          style={styles.suggestion}
          onPress={() => onChange({ location: p.name, placeId: p.placeId })}
        >
          <Ionicons name="location-outline" size={16} color={ORANGE} />
          <View style={{ flex: 1 }}>
            <Text style={styles.suggestionName} numberOfLines={1}>
              {p.name}
            </Text>
            <Text style={styles.suggestionMeta} numberOfLines={1}>
              {p.category}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* =========================================================
   ITEM FIELDS: วันที่ เวลา สถานที่ ลิงก์ โน้ต (ใช้ทั้งตอนสร้างและแก้รายการ)
========================================================= */

function ItemFields({
  value,
  places,
  onChange,
}: {
  value: FieldsValue;
  places: ApiPlace[];
  onChange: (patch: Partial<FieldsValue>) => void;
}) {
  return (
    <View>
      <Text style={styles.miniLabel}>Due date</Text>
      <View style={styles.pickerRow}>
        <PickerField
          mode="date"
          placeholder="Add date"
          value={value.dueDate ? fromISODate(value.dueDate) : null}
          onChange={(d) =>
            onChange(
              d ? { dueDate: toISODate(d) } : { dueDate: null, dueTime: null }
            )
          }
        />

        {!!value.dueDate && (
          <PickerField
            mode="time"
            placeholder="Add time"
            value={value.dueTime ? fromHHmm(value.dueTime) : null}
            onChange={(d) => onChange({ dueTime: d ? toHHmm(d) : null })}
          />
        )}
      </View>

      <LocationField
        location={value.location}
        placeId={value.placeId}
        places={places}
        onChange={onChange}
      />

      <View style={styles.fieldRow}>
        <Ionicons name="link-outline" size={18} color="#9A928E" />
        <TextInput
          value={value.url}
          onChangeText={(text) => onChange({ url: text })}
          placeholder="URL"
          placeholderTextColor="#A9A29E"
          style={styles.fieldInput}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
      </View>

      <View style={[styles.fieldRow, { alignItems: "flex-start" }]}>
        <Ionicons
          name="document-text-outline"
          size={18}
          color="#9A928E"
          style={{ marginTop: 10 }}
        />
        <TextInput
          value={value.note}
          onChangeText={(text) => onChange({ note: text })}
          placeholder="Note"
          placeholderTextColor="#A9A29E"
          style={[styles.fieldInput, styles.fieldInputNote]}
          multiline
        />
      </View>
    </View>
  );
}

/* =========================================================
   CREATE / EDIT CHECKLIST MODAL
   mode "create"    : สร้างใหม่ (แต่ละ task กาง details ได้)
   mode "checklist" : แก้ชื่อ + เพิ่ม/ลบ task (เห็นแค่ชื่อ task ไม่รก)
                      รายละเอียดแต่ละ task แก้ผ่านปุ่ม Edit ที่ task นั้น
========================================================= */

type DraftItem = FieldsValue & {
  itemId?: number; // มีเมื่อเป็นรายการเดิมที่กำลังแก้
  completed?: boolean;
  subtitle?: string; // ไม่ได้แก้ในฟอร์ม แต่ต้องส่งกลับไปไม่ให้หาย
  title: string;
  open: boolean;
};

const emptyDraftItem = (): DraftItem => ({
  ...emptyFields(),
  title: "",
  open: false,
});

function DraftItemEditor({
  index,
  item,
  places,
  withDetails,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  item: DraftItem;
  places: ApiPlace[];
  withDetails: boolean;
  canRemove: boolean;
  onChange: (patch: Partial<DraftItem>) => void;
  onRemove: () => void;
}) {
  const summary = [
    item.dueDate ? formatDue(item.dueDate, item.dueTime) : null,
    item.location.trim() || null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <View style={styles.draftCard}>
      <View style={styles.itemRow}>
        <View style={styles.itemNumber}>
          <Text style={styles.itemNumberText}>{index + 1}</Text>
        </View>

        <TextInput
          value={item.title}
          onChangeText={(text) => onChange({ title: text })}
          placeholder={`Task ${index + 1}`}
          placeholderTextColor="#A9A29E"
          style={styles.draftTitleInput}
        />

        {canRemove && (
          <TouchableOpacity onPress={onRemove} style={styles.trashBtn}>
            <Ionicons name="trash-outline" size={18} color="#9A928E" />
          </TouchableOpacity>
        )}
      </View>

      {withDetails && (
        <>
          <TouchableOpacity
            style={styles.detailsToggle}
            activeOpacity={0.7}
            onPress={() => onChange({ open: !item.open })}
          >
            <Ionicons
              name={item.open ? "chevron-up" : "chevron-down"}
              size={14}
              color={ORANGE}
            />
            <Text style={styles.detailsToggleText} numberOfLines={1}>
              {item.open
                ? "Hide details"
                : summary || "Add date, time & details"}
            </Text>
          </TouchableOpacity>

          {item.open && (
            <View style={styles.detailsForm}>
              <ItemFields value={item} places={places} onChange={onChange} />
            </View>
          )}
        </>
      )}
    </View>
  );
}

function CreateTaskModal({
  visible,
  initialDraft,
  sourceName,
  mode,
  places,
  onClose,
  onSave,
}: {
  visible: boolean;
  initialDraft: NewChecklistTask | null;
  sourceName: string | null;
  mode: "create" | "checklist";
  places: ApiPlace[];
  onClose: () => void;
  onSave: (draft: NewChecklistTask) => Promise<void>;
}) {
  const editing = mode === "checklist";

  const [title, setTitle] = useState("");
  const [items, setItems] = useState<DraftItem[]>([emptyDraftItem()]);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle("");
    setItems([emptyDraftItem()]);
  };

  // เปิดจากเอกสาร หรือเปิดเพื่อแก้ไข → เติมฟอร์มให้
  useEffect(() => {
    if (visible && initialDraft) {
      setTitle(initialDraft.title);
      setItems(
        initialDraft.items.length
          ? initialDraft.items.map((i) => ({
              itemId: i.itemId,
              completed: i.completed,
              subtitle: i.subtitle,
              title: i.title,
              dueDate: i.dueDate ?? null,
              dueTime: i.dueTime ?? null,
              location: i.location ?? "",
              placeId: i.placeId ?? null,
              url: i.url ?? "",
              note: i.note ?? "",
              open: false,
            }))
          : [emptyDraftItem()]
      );
    }
  }, [visible, initialDraft]);

  // ปิดแล้วเคลียร์ฟอร์ม กันข้อมูลค้างไปตอนเปิดครั้งถัดไป
  useEffect(() => {
    if (!visible) reset();
  }, [visible]);

  const patchItem = (index: number, patch: Partial<DraftItem>) =>
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );

  const submit = async () => {
    const cleanItems = items
      .map((i) => ({ ...i, title: i.title.trim() }))
      .filter((i) => i.title);

    if (!title.trim() || cleanItems.length === 0) {
      Alert.alert("Missing info", "Add a title and at least one task.");
      return;
    }

    try {
      setSaving(true);
      await onSave({
        title: title.trim(),
        items: cleanItems.map((i) => ({
          itemId: i.itemId,
          completed: i.completed,
          subtitle: i.subtitle,
          title: i.title,
          dueDate: i.dueDate,
          dueTime: i.dueDate ? i.dueTime : null,
          location: i.location.trim() || undefined,
          placeId: i.location.trim() ? i.placeId : null,
          url: i.url.trim() ? normalizeUrl(i.url.trim()) : undefined,
          note: i.note.trim() || undefined,
        })),
      });
    } catch {
      Alert.alert("Couldn't save", "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={INK_SOFT} />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>
            {editing
              ? "Edit Checklist"
              : sourceName
              ? "Review Checklist"
              : "Create Checklist"}
          </Text>

          {!!sourceName && !editing && (
            <View style={styles.sourceBanner}>
              <Ionicons name="document-text-outline" size={18} color={ORANGE} />
              <Text style={styles.sourceText} numberOfLines={2}>
                Created from {sourceName}. Review and edit before saving.
              </Text>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Midterm prep"
              placeholderTextColor="#A9A29E"
              style={styles.input}
            />

            <View style={styles.labelRow}>
              <Text style={styles.label}>Tasks</Text>
              <TouchableOpacity
                onPress={() => setItems((p) => [...p, emptyDraftItem()])}
              >
                <Text style={styles.addItem}>+ Add task</Text>
              </TouchableOpacity>
            </View>

            {items.map((item, index) => (
              <DraftItemEditor
                key={index}
                index={index}
                item={item}
                places={places}
                withDetails={!editing}
                canRemove={items.length > 1}
                onChange={(patch) => patchItem(index, patch)}
                onRemove={() =>
                  setItems((p) => p.filter((_, i) => i !== index))
                }
              />
            ))}

            {editing && (
              <Text style={styles.editHint}>
                To change a task's date, location, link or note, tap the task
                in the list and choose Edit.
              </Text>
            )}

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={submit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveText}>
                  {editing ? "Save Changes" : "Create"}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* =========================================================
   EDIT TASK MODAL: แก้เฉพาะรายการเดียว
========================================================= */

function EditItemModal({
  visible,
  item,
  places,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  item: ChecklistItem | null;
  places: ApiPlace[];
  onClose: () => void;
  onSave: (patch: ItemPatch) => Promise<void>;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState<FieldsValue>(emptyFields());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && item) {
      setTitle(item.title);
      setFields({
        dueDate: item.dueDate,
        dueTime: item.dueTime,
        location: item.location ?? "",
        placeId: item.placeId,
        url: item.url ?? "",
        note: item.note ?? "",
      });
    }
  }, [visible, item]);

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert("Missing info", "Task title can't be empty.");
      return;
    }

    const location = fields.location.trim();

    try {
      setSaving(true);
      await onSave({
        title: title.trim(),
        dueDate: fields.dueDate,
        dueTime: fields.dueDate ? fields.dueTime : null,
        location: location || null,
        placeId: location ? fields.placeId : null,
        url: fields.url.trim() ? normalizeUrl(fields.url.trim()) : null,
        note: fields.note.trim() || null,
      });
    } catch {
      Alert.alert("Couldn't save", "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={INK_SOFT} />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Edit Task</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Task title"
              placeholderTextColor="#A9A29E"
              style={styles.input}
            />

            <ItemFields
              value={fields}
              places={places}
              onChange={(patch) => setFields((f) => ({ ...f, ...patch }))}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.saveBtn, { marginTop: 16 }, saving && { opacity: 0.6 }]}
              onPress={submit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.deleteBtn}
              onPress={onDelete}
            >
              <Ionicons name="trash-outline" size={16} color={OVERDUE} />
              <Text style={styles.deleteBtnText}>Delete task</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAGE_BG },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 96 },

  errorBox: {
    backgroundColor: "#FDECEC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { fontSize: 14, color: "#B3261E" },

  emptyHint: {
    fontSize: 14,
    color: INK_SOFT,
    textAlign: "center",
    paddingVertical: 24,
  },

  /* card */
  card: {
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 14,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: INK },

  /* item row */
  rowWrap: {
    backgroundColor: ROW_BG,
    borderRadius: 8,
    marginBottom: 8,
  },
  rowMain: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  numberCircleDone: { backgroundColor: INK },
  numberText: { fontSize: 14, fontWeight: "700", color: INK },
  numberTextDone: { color: "#FFFFFF" },

  rowTextWrap: { flex: 1, paddingRight: 10 },
  rowTitle: { fontSize: 14, fontWeight: "600", lineHeight: 20, color: INK },
  rowSubtitle: { marginTop: 1, fontSize: 12, color: INK_SOFT },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.85)",
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: { backgroundColor: INK, borderColor: INK },

  /* item meta + details */
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dateChipText: { fontSize: 12, fontWeight: "600" },

  details: {
    paddingLeft: 52,
    paddingRight: 12,
    paddingBottom: 12,
    gap: 8,
  },
  detailNote: { fontSize: 13, lineHeight: 18, color: INK_SOFT },
  detailLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailLinkText: {
    flex: 1,
    fontSize: 13,
    color: INK,
    textDecorationLine: "underline",
  },
  detailEmpty: { fontSize: 13, color: "#9A928E" },
  editBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  editBtnText: { fontSize: 13, fontWeight: "700", color: ORANGE },

  /* progress */
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 6,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(26,26,26,0.12)",
  },
  progressLabel: { fontSize: 12, fontWeight: "600", color: INK },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.45)",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: INK },

  /* tabs */
  tabs: {
    flexDirection: "row",
    backgroundColor: "#F1ECE9",
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 12,
  },
  tab: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  tabText: { fontSize: 14, fontWeight: "600", color: "#8A827E" },
  tabTextActive: { color: INK, fontWeight: "800" },

  /* card header */
  cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  cardHeaderText: { flex: 1, paddingRight: 8 },
  completedOn: { marginTop: 2, fontSize: 12, color: INK_SOFT },
  doneBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  menuBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* floating create button */
  fabWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 16,
    alignItems: "center",
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 48,
    paddingLeft: 16,
    paddingRight: 22,
    borderRadius: 24,
    backgroundColor: INK,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  fabText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },

  /* modal */
  overlay: {
    flex: 1,
    backgroundColor: "rgba(26,26,26,0.4)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalCard: {
    maxHeight: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 18,
  },
  closeBtn: {
    position: "absolute",
    right: 14,
    top: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F3EFEC",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: INK, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "700", color: INK, marginBottom: 6 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addItem: { fontSize: 14, fontWeight: "700", color: ORANGE, marginBottom: 6 },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#EAE3DF",
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    color: INK,
    marginBottom: 12,
  },

  /* draft item editor */
  draftCard: {
    backgroundColor: "#FBF8F6",
    borderWidth: 1,
    borderColor: "#F0EAE6",
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
  },
  itemRow: { flexDirection: "row", alignItems: "center" },
  itemNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FDE9DD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  itemNumberText: { fontSize: 12, fontWeight: "800", color: ORANGE },
  draftTitleInput: {
    flex: 1,
    minHeight: 42,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAE3DF",
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 15,
    color: INK,
  },
  trashBtn: { padding: 8 },
  detailsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    marginLeft: 34,
  },
  detailsToggleText: { flex: 1, fontSize: 13, fontWeight: "600", color: ORANGE },
  detailsForm: { marginTop: 8, marginLeft: 34 },
  miniLabel: { fontSize: 12, fontWeight: "700", color: INK_SOFT, marginBottom: 6 },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },
  pickerSet: { flexDirection: "row", alignItems: "center", gap: 6 },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: "#FFF0E8",
  },
  pickerBtnText: { fontSize: 13, fontWeight: "700", color: ORANGE },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  fieldInput: {
    flex: 1,
    minHeight: 40,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAE3DF",
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 14,
    color: INK,
  },
  fieldInputNote: { minHeight: 64, paddingTop: 10, textAlignVertical: "top" },

  saveBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  saveText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
  editHint: { fontSize: 12, lineHeight: 17, color: INK_SOFT, marginBottom: 12 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    marginTop: 6,
  },
  deleteBtnText: { fontSize: 14, fontWeight: "700", color: OVERDUE },

  /* location suggestions */
  linkedHint: { marginLeft: 26, marginTop: 4, fontSize: 12, color: ORANGE },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    marginLeft: 26,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#FFF7F2",
    borderWidth: 1,
    borderColor: "#F7DCCB",
  },
  suggestionName: { fontSize: 14, fontWeight: "600", color: INK },
  suggestionMeta: { marginTop: 1, fontSize: 12, color: INK_SOFT },

  /* choice sheet */
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(26,26,26,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 32,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E3DCD8",
    marginBottom: 14,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: INK, marginBottom: 12 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#F8F4F1",
    marginBottom: 10,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  optionTextWrap: { flex: 1, paddingRight: 8 },
  optionTitle: { fontSize: 15, fontWeight: "700", color: INK },
  optionDesc: { marginTop: 2, fontSize: 12, lineHeight: 17, color: INK_SOFT },

  /* extracting overlay */
  busy: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(252,249,247,0.92)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    zIndex: 20,
  },
  busyText: { fontSize: 15, fontWeight: "600", color: INK },

  /* doc banner in modal */
  sourceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF0E8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  sourceText: { flex: 1, fontSize: 13, lineHeight: 18, color: INK },

  /* celebration toast */
  toast: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    maxWidth: "90%",
    alignItems: "center",
    backgroundColor: INK,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 30,
  },
  toastText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  toastSub: { marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.7)" },
});