import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

/* =========================================================
   TYPES
========================================================= */

type ChecklistItem = {
  itemId: string;
  title: string;
  completed: boolean;
};

type ChecklistTask = {
  taskId: string;
  title: string;
  description: string;
  dueDate: string;
  items: ChecklistItem[];
};

/* =========================================================
   COLORS
========================================================= */

const COLORS = {
  orange: "#FA7C35",
  orangeLight: "#FFF0E8",

  background: "#FAF7F5",
  white: "#FFFFFF",

  text: "#2A2928",
  textSecondary: "#686360",
  textLight: "#8E8985",

  border: "#EFE8E4",

  green: "#62B88A",
  greenLight: "#EAF8F0",

  red: "#E63946",
};

/* =========================================================
   MOCK DATA
========================================================= */

const INITIAL_TASKS: ChecklistTask[] = [
  {
    taskId: "task-1",

    title: "New Student Preparation",

    description:
      "เตรียมสิ่งสำคัญก่อนเริ่มต้นชีวิตนักศึกษาที่มหาวิทยาลัยขอนแก่น",

    dueDate: "20 Aug 2026",

    items: [
      {
        itemId: "1-1",
        title: "เตรียมเอกสารสำคัญสำหรับรายงานตัว",
        completed: true,
      },

      {
        itemId: "1-2",
        title: "สมัคร KKU Account",
        completed: true,
      },

      {
        itemId: "1-3",
        title: "ตรวจสอบตารางเรียน",
        completed: false,
      },

      {
        itemId: "1-4",
        title: "เตรียมอุปกรณ์การเรียน",
        completed: false,
      },

      {
        itemId: "1-5",
        title: "สำรวจเส้นทางไปอาคารเรียน",
        completed: false,
      },
    ],
  },

  {
    taskId: "task-2",

    title: "First Week at KKU",

    description:
      "สิ่งที่ควรทำให้เรียบร้อยภายในสัปดาห์แรกของการเปิดภาคเรียน",

    dueDate: "30 Aug 2026",

    items: [
      {
        itemId: "2-1",
        title: "เข้าร่วมกิจกรรมปฐมนิเทศ",
        completed: true,
      },

      {
        itemId: "2-2",
        title: "เข้าร่วมกิจกรรมพบอาจารย์ที่ปรึกษา",
        completed: false,
      },

      {
        itemId: "2-3",
        title: "สมัครเข้าชมรมที่สนใจ",
        completed: false,
      },

      {
        itemId: "2-4",
        title: "สำรวจห้องสมุดกลาง",
        completed: false,
      },
    ],
  },
];

/* =========================================================
   CHECKLIST SCREEN
========================================================= */

export default function ChecklistScreen() {
  const [tasks, setTasks] =
    useState<ChecklistTask[]>(
      INITIAL_TASKS
    );

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  /* =======================================================
     TOGGLE ITEM
  ======================================================= */

  const toggleItem = (
    taskId: string,
    itemId: string
  ) => {
    setTasks((previousTasks) =>
      previousTasks.map((task) => {
        if (task.taskId !== taskId) {
          return task;
        }

        return {
          ...task,

          items: task.items.map(
            (item) =>
              item.itemId === itemId
                ? {
                    ...item,
                    completed:
                      !item.completed,
                  }
                : item
          ),
        };
      })
    );
  };

  /* =======================================================
     CREATE TASK
  ======================================================= */

  const createTask = (
    task: ChecklistTask
  ) => {
    setTasks((previousTasks) => [
      ...previousTasks,
      task,
    ]);

    setShowCreateModal(false);
  };

  return (
    <View style={styles.container}>

      {/* =================================================
          HEADER
      ================================================= */}

      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>
            Checklist
          </Text>

          <Text style={styles.pageSubtitle}>
            Keep track of your KKU journey
          </Text>
        </View>

        <Ionicons
          name="checkmark-circle"
          size={28}
          color={COLORS.orange}
        />
      </View>

      {/* =================================================
          TASK LIST
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.taskId}
            task={task}
            onToggleItem={
              toggleItem
            }
          />
        ))}

        {/* =================================================
            CREATE TASK CARD
        ================================================= */}

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.createTaskCard}
          onPress={() =>
            setShowCreateModal(true)
          }
        >
          <View
            style={
              styles.createIcon
            }
          >
            <Ionicons
              name="add"
              size={22}
              color={
                COLORS.orange
              }
            />
          </View>

          <View
            style={
              styles.createContent
            }
          >
            <Text
              style={
                styles.createTitle
              }
            >
              Create New Task
            </Text>

            <Text
              style={
                styles.createSubtitle
              }
            >
              Add your own checklist
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={
              COLORS.textLight
            }
          />
        </TouchableOpacity>

        <View
          style={styles.bottomSpace}
        />
      </ScrollView>

      {/* =================================================
          CREATE TASK MODAL
      ================================================= */}

      <CreateTaskModal
        visible={showCreateModal}
        onClose={() =>
          setShowCreateModal(false)
        }
        onCreate={createTask}
      />
    </View>
  );
}

/* =========================================================
   TASK CARD
========================================================= */

function TaskCard({
  task,
  onToggleItem,
}: {
  task: ChecklistTask;
  onToggleItem: (
    taskId: string,
    itemId: string
  ) => void;
}) {
  const completedCount =
    task.items.filter(
      (item) => item.completed
    ).length;

  const totalCount =
    task.items.length;

  const progress =
    totalCount === 0
      ? 0
      : Math.round(
          (completedCount /
            totalCount) *
            100
        );

  const isDone =
    totalCount > 0 &&
    completedCount === totalCount;

  return (
    <View
      style={[
        styles.taskCard,

        isDone &&
          styles.taskCardDone,
      ]}
    >
      {/* =================================================
          TASK HEADER
      ================================================= */}

      <View
        style={styles.taskHeader}
      >
        <View
          style={styles.taskTitleContainer}
        >
          <Text
            style={styles.taskTitle}
          >
            {task.title}
          </Text>

          <Text
            style={
              styles.taskDescription
            }
          >
            {task.description}
          </Text>
        </View>

        {isDone ? (
          <View
            style={
              styles.doneBadge
            }
          >
            <Ionicons
              name="sparkles"
              size={13}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.doneBadgeText
              }
            >
              Done!
            </Text>
          </View>
        ) : (
          <Text
            style={
              styles.progressText
            }
          >
            {progress}%
          </Text>
        )}
      </View>

      {/* =================================================
          PROGRESS
      ================================================= */}

      <View
        style={styles.progressSection}
      >
        <View
          style={
            styles.progressBackground
          }
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
              },
            ]}
          />
        </View>

        <Text
          style={
            styles.progressLabel
          }
        >
          {completedCount}/
          {totalCount} completed
        </Text>
      </View>

      {/* =================================================
          DUE DATE
      ================================================= */}

      <View
        style={styles.dateRow}
      >
        <Ionicons
          name="calendar-outline"
          size={13}
          color={
            COLORS.textLight
          }
        />

        <Text
          style={styles.dateText}
        >
          Due {task.dueDate}
        </Text>
      </View>

      {/* =================================================
          CHECKLIST ITEMS
      ================================================= */}

      <View
        style={styles.itemsContainer}
      >
        {task.items.map((item) => (
          <TouchableOpacity
            key={item.itemId}
            activeOpacity={0.8}
            style={[
              styles.checkItem,

              item.completed &&
                styles.checkItemCompleted,
            ]}
            onPress={() =>
              onToggleItem(
                task.taskId,
                item.itemId
              )
            }
          >
            <View
              style={[
                styles.checkbox,

                item.completed &&
                  styles.checkboxCompleted,
              ]}
            >
              {item.completed && (
                <Ionicons
                  name="checkmark"
                  size={13}
                  color="#FFFFFF"
                />
              )}
            </View>

            <Text
              style={[
                styles.itemText,

                item.completed &&
                  styles.itemTextCompleted,
              ]}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* =================================================
          TASK DONE EFFECT
      ================================================= */}

      {isDone && (
        <View
          style={
            styles.taskDoneMessage
          }
        >
          <Text
            style={
              styles.taskDoneEmoji
            }
          >
            🎉
          </Text>

          <View>
            <Text
              style={
                styles.taskDoneTitle
              }
            >
              Task completed!
            </Text>

            <Text
              style={
                styles.taskDoneSubtitle
              }
            >
              Great job! You did it ✨
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

/* =========================================================
   CREATE TASK MODAL
========================================================= */

function CreateTaskModal({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (
    task: ChecklistTask
  ) => void;
}) {
  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [dueDate, setDueDate] =
    useState("");

  const [items, setItems] =
    useState<string[]>([""]);

  /* =======================================================
     ADD CHECKLIST ITEM
  ======================================================= */

  const addItem = () => {
    setItems((previousItems) => [
      ...previousItems,
      "",
    ]);
  };

  /* =======================================================
     UPDATE ITEM
  ======================================================= */

  const updateItem = (
    index: number,
    value: string
  ) => {
    setItems((previousItems) =>
      previousItems.map(
        (item, itemIndex) =>
          itemIndex === index
            ? value
            : item
      )
    );
  };

  /* =======================================================
     REMOVE ITEM
  ======================================================= */

  const removeItem = (
    index: number
  ) => {
    setItems((previousItems) =>
      previousItems.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  };

  /* =======================================================
     DONE
  ======================================================= */

  const handleDone = () => {
    const validItems =
      items.filter(
        (item) => item.trim()
      );

    if (
      !title.trim() ||
      validItems.length === 0
    ) {
      return;
    }

    const newTask: ChecklistTask = {
      taskId:
        `task-${Date.now()}`,

      title:
        title.trim(),

      description:
        description.trim(),

      dueDate:
        dueDate.trim() ||
        "No due date",

      items:
        validItems.map(
          (item, index) => ({
            itemId:
              `item-${Date.now()}-${index}`,

            title:
              item.trim(),

            completed:
              false,
          })
        ),
    };

    onCreate(newTask);

    /* Reset form */

    setTitle("");
    setDescription("");
    setDueDate("");
    setItems([""]);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={
          styles.modalOverlay
        }
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <View
          style={
            styles.modalCard
          }
        >
          {/* =================================================
              CLOSE
          ================================================= */}

          <TouchableOpacity
            style={
              styles.closeButton
            }
            onPress={onClose}
          >
            <Ionicons
              name="close"
              size={19}
              color={
                COLORS.textSecondary
              }
            />
          </TouchableOpacity>

          {/* =================================================
              MODAL HEADER
          ================================================= */}

          <Text
            style={
              styles.modalTitle
            }
          >
            Create New Task
          </Text>

          <Text
            style={
              styles.modalSubtitle
            }
          >
            Create a checklist for
            something you want to
            accomplish.
          </Text>

          {/* =================================================
              FORM
          ================================================= */}

          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
          >
            {/* TASK NAME */}

            <Text
              style={
                styles.inputLabel
              }
            >
              Task name
            </Text>

            <TextInput
              value={title}
              onChangeText={
                setTitle
              }
              placeholder="e.g. Prepare for midterm"
              placeholderTextColor="#AAA3A0"
              style={
                styles.input
              }
            />

            {/* DESCRIPTION */}

            <Text
              style={
                styles.inputLabel
              }
            >
              Description
            </Text>

            <TextInput
              value={
                description
              }
              onChangeText={
                setDescription
              }
              placeholder="Add a short description..."
              placeholderTextColor="#AAA3A0"
              multiline
              style={[
                styles.input,
                styles.descriptionInput,
              ]}
            />

            {/* CHECKLIST */}

            <View
              style={
                styles.checklistHeader
              }
            >
              <Text
                style={
                  styles.inputLabel
                }
              >
                Checklist
              </Text>

              <TouchableOpacity
                onPress={
                  addItem
                }
              >
                <Text
                  style={
                    styles.addItemText
                  }
                >
                  + Add item
                </Text>
              </TouchableOpacity>
            </View>

            {items.map(
              (
                item,
                index
              ) => (
                <View
                  key={index}
                  style={
                    styles.modalItemRow
                  }
                >
                  <View
                    style={
                      styles.numberCircle
                    }
                  >
                    <Text
                      style={
                        styles.numberText
                      }
                    >
                      {index + 1}
                    </Text>
                  </View>

                  <TextInput
                    value={
                      item
                    }
                    onChangeText={(
                      value
                    ) =>
                      updateItem(
                        index,
                        value
                      )
                    }
                    placeholder={`Checklist item ${index + 1}`}
                    placeholderTextColor="#AAA3A0"
                    style={
                      styles.itemInput
                    }
                  />

                  {items.length >
                    1 && (
                    <TouchableOpacity
                      onPress={() =>
                        removeItem(
                          index
                        )
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={
                          16
                        }
                        color="#B7AEAA"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )
            )}

            {/* DATE */}

            <Text
              style={
                styles.inputLabel
              }
            >
              Due date
            </Text>

            <View
              style={
                styles.dateInputContainer
              }
            >
              <Ionicons
                name="calendar-outline"
                size={16}
                color={
                  COLORS.textLight
                }
              />

              <TextInput
                value={
                  dueDate
                }
                onChangeText={
                  setDueDate
                }
                placeholder="e.g. 30 Aug 2026"
                placeholderTextColor="#AAA3A0"
                style={
                  styles.dateInput
                }
              />
            </View>

            {/* DONE BUTTON */}

            <TouchableOpacity
              activeOpacity={0.85}
              style={
                styles.doneButton
              }
              onPress={
                handleDone
              }
            >
              <Text
                style={
                  styles.doneButtonText
                }
              >
                Done
              </Text>

              <Ionicons
                name="checkmark"
                size={17}
                color="#FFFFFF"
              />
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

const styles =
  StyleSheet.create({
    /* ================= SCREEN ================= */

    container: {
      flex: 1,

      backgroundColor:
        COLORS.background,
    },

    scrollContent: {
      paddingHorizontal: 10,

      paddingTop: 8,

      paddingBottom: 20,
    },

    /* ================= HEADER ================= */

    header: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      paddingHorizontal: 10,

      paddingTop: 8,

      paddingBottom: 12,
    },

    pageTitle: {
      fontSize: 22,

      fontWeight: "800",

      color: COLORS.text,
    },

    pageSubtitle: {
      marginTop: 3,

      fontSize: 9,

      color:
        COLORS.textLight,
    },

    /* ================= TASK CARD ================= */

    taskCard: {
      backgroundColor:
        COLORS.white,

      borderRadius: 24,

      padding: 13,

      marginBottom: 11,

      borderWidth: 1,

      borderColor:
        "#F0EBE8",

      shadowColor:
        "#AFA7A2",

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity: 0.08,

      shadowRadius: 8,

      elevation: 2,
    },

    taskCardDone: {
      borderColor:
        "#D7F0E2",

      backgroundColor:
        "#FCFFFD",
    },

    taskHeader: {
      flexDirection: "row",

      alignItems:
        "flex-start",

      justifyContent:
        "space-between",
    },

    taskTitleContainer: {
      flex: 1,

      paddingRight: 10,
    },

    taskTitle: {
      fontSize: 14,

      fontWeight: "800",

      color:
        COLORS.text,
    },

    taskDescription: {
      marginTop: 4,

      fontSize: 8.5,

      lineHeight: 12,

      color:
        COLORS.textSecondary,
    },

    progressText: {
      fontSize: 11,

      fontWeight: "800",

      color:
        COLORS.orange,
    },

    /* ================= PROGRESS ================= */

    progressSection: {
      marginTop: 11,
    },

    progressBackground: {
      height: 7,

      borderRadius: 10,

      backgroundColor:
        "#F0ECE9",

      overflow: "hidden",
    },

    progressFill: {
      height: "100%",

      borderRadius: 10,

      backgroundColor:
        COLORS.orange,
    },

    progressLabel: {
      marginTop: 5,

      fontSize: 7.5,

      color:
        COLORS.textLight,
    },

    /* ================= DATE ================= */

    dateRow: {
      flexDirection: "row",

      alignItems: "center",

      marginTop: 9,

      gap: 5,
    },

    dateText: {
      fontSize: 7.5,

      color:
        COLORS.textLight,
    },

    /* ================= ITEMS ================= */

    itemsContainer: {
      marginTop: 10,

      gap: 6,
    },

    checkItem: {
      minHeight: 38,

      borderRadius: 12,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        "#FFFFFF",

      flexDirection: "row",

      alignItems: "center",

      paddingHorizontal: 9,
    },

    checkItemCompleted: {
      backgroundColor:
        "#F7FCF9",

      borderColor:
        "#DCEFE4",
    },

    checkbox: {
      width: 20,

      height: 20,

      borderRadius: 6,

      borderWidth: 1.5,

      borderColor:
        "#D1CAC6",

      alignItems: "center",

      justifyContent:
        "center",

      marginRight: 8,
    },

    checkboxCompleted: {
      backgroundColor:
        COLORS.green,

      borderColor:
        COLORS.green,
    },

    itemText: {
      flex: 1,

      fontSize: 8.5,

      lineHeight: 12,

      color:
        COLORS.text,
    },

    itemTextCompleted: {
      color:
        COLORS.textLight,

      textDecorationLine:
        "line-through",
    },

    /* ================= DONE ================= */

    doneBadge: {
      flexDirection: "row",

      alignItems: "center",

      gap: 4,

      paddingHorizontal: 8,

      paddingVertical: 5,

      borderRadius: 12,

      backgroundColor:
        COLORS.green,
    },

    doneBadgeText: {
      fontSize: 8,

      fontWeight: "700",

      color: "#FFFFFF",
    },

    taskDoneMessage: {
      flexDirection: "row",

      alignItems: "center",

      marginTop: 11,

      padding: 9,

      borderRadius: 14,

      backgroundColor:
        COLORS.greenLight,
    },

    taskDoneEmoji: {
      fontSize: 22,

      marginRight: 8,
    },

    taskDoneTitle: {
      fontSize: 9,

      fontWeight: "800",

      color:
        "#3C8C64",
    },

    taskDoneSubtitle: {
      marginTop: 2,

      fontSize: 7.5,

      color:
        "#6B9F82",
    },

    /* ================= CREATE ================= */

    createTaskCard: {
      minHeight: 75,

      borderRadius: 22,

      borderWidth: 1.5,

      borderStyle: "dashed",

      borderColor:
        "#E8C5B4",

      backgroundColor:
        "#FFF9F6",

      flexDirection: "row",

      alignItems: "center",

      paddingHorizontal: 12,

      marginBottom: 12,
    },

    createIcon: {
      width: 39,

      height: 39,

      borderRadius: 20,

      backgroundColor:
        COLORS.orangeLight,

      alignItems: "center",

      justifyContent:
        "center",

      marginRight: 10,
    },

    createContent: {
      flex: 1,
    },

    createTitle: {
      fontSize: 10.5,

      fontWeight: "800",

      color:
        COLORS.text,
    },

    createSubtitle: {
      marginTop: 3,

      fontSize: 8,

      color:
        COLORS.textLight,
    },

    /* ================= MODAL ================= */

    modalOverlay: {
      flex: 1,

      backgroundColor:
        "rgba(42,41,40,0.35)",

      justifyContent:
        "center",

      paddingHorizontal: 16,
    },

    modalCard: {
      maxHeight: "90%",

      borderRadius: 27,

      backgroundColor:
        COLORS.white,

      paddingHorizontal: 16,

      paddingTop: 18,

      paddingBottom: 15,
    },

    closeButton: {
      position: "absolute",

      right: 13,

      top: 13,

      width: 31,

      height: 31,

      borderRadius: 16,

      backgroundColor:
        "#F5F1EF",

      alignItems: "center",

      justifyContent:
        "center",

      zIndex: 10,
    },

    modalTitle: {
      fontSize: 18,

      fontWeight: "800",

      color:
        COLORS.text,

      paddingRight: 40,
    },

    modalSubtitle: {
      marginTop: 4,

      marginBottom: 15,

      fontSize: 8.5,

      lineHeight: 12,

      color:
        COLORS.textLight,

      paddingRight: 30,
    },

    /* ================= FORM ================= */

    inputLabel: {
      fontSize: 9,

      fontWeight: "700",

      color:
        COLORS.text,

      marginBottom: 6,
    },

    input: {
      minHeight: 39,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 12,

      paddingHorizontal: 11,

      fontSize: 9,

      color:
        COLORS.text,

      marginBottom: 12,

      backgroundColor:
        "#FFFEFD",
    },

    descriptionInput: {
      height: 65,

      textAlignVertical:
        "top",

      paddingTop: 10,
    },

    /* ================= CHECKLIST FORM ================= */

    checklistHeader: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      marginBottom: 6,
    },

    addItemText: {
      fontSize: 8.5,

      fontWeight: "700",

      color:
        COLORS.orange,
    },

    modalItemRow: {
      flexDirection: "row",

      alignItems: "center",

      marginBottom: 7,
    },

    numberCircle: {
      width: 22,

      height: 22,

      borderRadius: 11,

      backgroundColor:
        COLORS.orangeLight,

      alignItems: "center",

      justifyContent:
        "center",

      marginRight: 7,
    },

    numberText: {
      fontSize: 7.5,

      fontWeight: "800",

      color:
        COLORS.orange,
    },

    itemInput: {
      flex: 1,

      height: 36,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 10,

      paddingHorizontal: 9,

      fontSize: 8.5,

      color:
        COLORS.text,

      marginRight: 7,
    },

    /* ================= DATE ================= */

    dateInputContainer: {
      height: 39,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 12,

      flexDirection: "row",

      alignItems: "center",

      paddingHorizontal: 10,

      marginBottom: 15,
    },

    dateInput: {
      flex: 1,

      marginLeft: 7,

      fontSize: 9,

      color:
        COLORS.text,
    },

    /* ================= DONE BUTTON ================= */

    doneButton: {
      height: 43,

      borderRadius: 22,

      backgroundColor:
        COLORS.orange,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "center",

      gap: 6,

      marginTop: 2,
    },

    doneButtonText: {
      fontSize: 10,

      fontWeight: "800",

      color: "#FFFFFF",
    },

    bottomSpace: {
      height: 10,
    },
  });