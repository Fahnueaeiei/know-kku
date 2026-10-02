// @ts-nocheck

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

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

  red: "#E63946",
};

/* =========================================================
   MOCK USER DATA
========================================================= */

const INITIAL_USER = {
  username: "sujeephon_kk",
  email: "sujeephon@gmail.com",
  phone: "081-234-5678",
  avatar: require("../assets/images/jeno1.jpg"),
};

/* =========================================================
   PROFILE SCREEN
========================================================= */

export default function ProfileScreen() {
  const [user, setUser] = useState(INITIAL_USER);

  /*
   * field ที่กำลังแก้ไข
   * null = ไม่มี field ไหนกำลังแก้
   */
  const [editingField, setEditingField] = useState<
    "username" | "phone" | null
  >(null);

  /*
   * ค่าชั่วคราวระหว่างกำลังแก้ไข
   */
  const [editValue, setEditValue] = useState("");

  /*
   * Logout
   */
  const [logoutModal, setLogoutModal] = useState(false);

  /* =======================================================
     START EDIT
  ======================================================= */

  const startEdit = (
    field: "username" | "phone"
  ) => {
    setEditingField(field);
    setEditValue(user[field]);
  };

  /* =======================================================
     CANCEL EDIT
  ======================================================= */

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  /* =======================================================
     SAVE EDIT
  ======================================================= */

  const saveEdit = () => {
    if (!editingField) return;

    const value = editValue.trim();

    if (!value) {
      Alert.alert(
        "Invalid information",
        `Please enter your ${editingField}.`
      );
      return;
    }

    setUser((previousUser) => ({
      ...previousUser,
      [editingField]: value,
    }));

    const fieldName =
      editingField === "username"
        ? "Username"
        : "Phone number";

    setEditingField(null);
    setEditValue("");

    Alert.alert(
      "Updated successfully",
      `${fieldName} has been changed successfully.`
    );
  };

  /* =======================================================
     CHANGE PROFILE IMAGE
  ======================================================= */

  const handleChangePhoto = () => {
    /*
      ภายหลังสามารถเชื่อม:

      expo-image-picker
      Cloudinary
      Backend API

      ตัวอย่าง:

      const result = await ImagePicker.launchImageLibraryAsync(...)
      uploadImage(result.assets[0].uri)
    */

    Alert.alert(
      "Change Profile Photo",
      "Image Picker และ Upload API สามารถเชื่อมในขั้นตอน Backend ได้"
    );
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {
    setLogoutModal(false);

    /*
      ภายหลังสามารถเชื่อม Auth:

      await logout();
      router.replace("/login");
    */

    Alert.alert(
      "Logged out",
      "Logout API จะเชื่อมในขั้นตอน Authentication"
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* =================================================
            PROFILE HEADER
        ================================================= */}

        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <Image
              source={user.avatar}
              style={styles.avatar}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.editPhotoButton}
              onPress={handleChangePhoto}
            >
              <Ionicons
                name="camera"
                size={15}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.profileTitle}>
            My Profile
          </Text>

          <Text style={styles.profileSubtitle}>
            Manage your personal information
          </Text>
        </View>

        {/* =================================================
            PERSONAL INFORMATION
        ================================================= */}

        <View style={styles.infoSection}>

          {/* USERNAME */}

          <ProfileField
            label="Username"
            value={user.username}
            editable
            editing={editingField === "username"}
            editValue={editValue}
            onStartEdit={() =>
              startEdit("username")
            }
            onChangeText={setEditValue}
            onSave={saveEdit}
            onCancel={cancelEdit}
          />

          {/* EMAIL */}

          <ProfileField
            label="Email"
            value={user.email}
            editable={false}
            editing={false}
            editValue=""
            onStartEdit={() => { }}
            onChangeText={() => { }}
            onSave={() => { }}
            onCancel={() => { }}
          />

          {/* PHONE */}

          <ProfileField
            label="Phone"
            value={user.phone}
            editable
            editing={editingField === "phone"}
            editValue={editValue}
            onStartEdit={() =>
              startEdit("phone")
            }
            onChangeText={setEditValue}
            onSave={saveEdit}
            onCancel={cancelEdit}
          />

        </View>

        {/* =================================================
            APP PREFERENCES
        ================================================= */}

        <View style={styles.preferencesCard}>
          <Text style={styles.preferencesTitle}>
            APP PREFERENCES
          </Text>

          <PreferenceItem
            icon="settings-outline"
            title="Settings"
            onPress={() => { }}
          />

          <View style={styles.preferenceDivider} />

          <PreferenceItem
            icon="document-text-outline"
            title="Terms & Conditions"
            onPress={() => { }}
          />

          <View style={styles.preferenceDivider} />

          <PreferenceItem
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => { }}
          />
        </View>

        {/* =================================================
            LOGOUT
        ================================================= */}

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.logoutButton}
          onPress={() =>
            setLogoutModal(true)
          }
        >
          <Ionicons
            name="log-out-outline"
            size={18}
            color={COLORS.red}
          />

          <Text style={styles.logoutText}>
            Logout
          </Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>
          Know KKU • Version 1.0.0
        </Text>
      </ScrollView>

      {/* =================================================
          LOGOUT MODAL
      ================================================= */}

      <Modal
        visible={logoutModal}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setLogoutModal(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModal}>

            <View style={styles.logoutIcon}>
              <Ionicons
                name="log-out-outline"
                size={24}
                color={COLORS.red}
              />
            </View>

            <Text style={styles.logoutModalTitle}>
              Log out?
            </Text>

            <Text style={styles.logoutModalSubtitle}>
              Are you sure you want to log out
              of your account?
            </Text>

            <View style={styles.logoutActions}>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() =>
                  setLogoutModal(false)
                }
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmLogoutButton}
                onPress={handleLogout}
              >
                <Text
                  style={styles.confirmLogoutText}
                >
                  Logout
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* =========================================================
   PROFILE FIELD
========================================================= */

function ProfileField({
  label,
  value,
  editable,
  editing,
  editValue,
  onStartEdit,
  onChangeText,
  onSave,
  onCancel,
}: {
  label: string;
  value: string;
  editable: boolean;
  editing: boolean;
  editValue: string;
  onStartEdit: () => void;
  onChangeText: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <View style={styles.field}>

      {/* LABEL */}

      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>
          {label}
        </Text>
      </View>

      {/* FIELD */}

      <TouchableOpacity
        activeOpacity={editable ? 0.85 : 1}
        disabled={!editable || editing}
        onPress={onStartEdit}
        style={[
          styles.fieldValueContainer,

          !editable &&
          styles.disabledField,

          editing &&
          styles.editingField,
        ]}
      >

        {editing ? (
          <>
            <TextInput
              value={editValue}
              onChangeText={onChangeText}
              autoFocus
              style={styles.editInput}
              keyboardType={
                label === "Phone"
                  ? "phone-pad"
                  : "default"
              }
              selectionColor={COLORS.orange}
              placeholderTextColor={COLORS.textLight}
              underlineColorAndroid="transparent"
            />

            {/* CANCEL */}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onCancel}
              style={styles.actionIcon}
            >
              <Ionicons
                name="close"
                size={16}
                color={COLORS.textLight}
              />
            </TouchableOpacity>

            {/* SAVE */}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onSave}
              style={[
                styles.actionIcon,
                styles.saveIcon,
              ]}
            >
              <Ionicons
                name="checkmark"
                size={16}
                color={COLORS.orange}
              />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text
              style={[
                styles.fieldValue,
                !editable &&
                styles.disabledText,
              ]}
            >
              {value}
            </Text>

            {editable ? (
              <Ionicons
                name="create-outline"
                size={15}
                color={COLORS.textLight}
              />
            ) : (
              <Ionicons
                name="lock-closed-outline"
                size={13}
                color={COLORS.textLight}
              />
            )}
          </>
        )}

      </TouchableOpacity>
    </View>
  );
}

/* =========================================================
   PREFERENCE ITEM
========================================================= */

function PreferenceItem({
  icon,
  title,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.preferenceItem}
      onPress={onPress}
    >
      <View style={styles.preferenceIcon}>
        <Ionicons
          name={icon}
          size={17}
          color={COLORS.textSecondary}
        />
      </View>

      <Text style={styles.preferenceText}>
        {title}
      </Text>

      <Ionicons
        name="chevron-forward"
        size={17}
        color={COLORS.textLight}
      />
    </TouchableOpacity>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({

  /* ================= SCREEN ================= */

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 20,
  },

  /* ================= PROFILE HEADER ================= */

  profileHeader: {
    alignItems: "center",
    marginBottom: 20,
  },

  avatarWrapper: {
    position: "relative",
    marginBottom: 10,
  },

  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 4,
    borderColor: COLORS.white,
  },

  editPhotoButton: {
    position: "absolute",
    right: 0,
    bottom: 2,

    width: 31,
    height: 31,
    borderRadius: 16,

    backgroundColor: COLORS.orange,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 3,
    borderColor: COLORS.background,

    elevation: 3,
  },

  profileTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },

  profileSubtitle: {
    marginTop: 3,
    fontSize: 8.5,
    color: COLORS.textLight,
  },

  /* ================= INFO ================= */

  infoSection: {
    backgroundColor: COLORS.white,

    borderRadius: 23,

    paddingHorizontal: 13,
    paddingVertical: 4,

    marginBottom: 13,

    shadowColor: "#AFA7A2",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.07,
    shadowRadius: 8,

    elevation: 2,
  },

  field: {
    paddingVertical: 10,
  },

  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 6,
  },

  fieldLabel: {
    fontSize: 8,
    fontWeight: "700",

    color: COLORS.textLight,

    textTransform: "uppercase",

    letterSpacing: 0.4,
  },

  /* ================= FIELD ================= */

  fieldValueContainer: {
    minHeight: 39,

    borderWidth: 1,
    borderColor: COLORS.border,

    borderRadius: 12,

    paddingHorizontal: 10,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFFEFD",
  },

  /*
   * เมื่อกดแก้ไข
   * เปลี่ยนกรอบเป็นสีส้ม
   */
  editingField: {
    borderColor: COLORS.orange,
    borderWidth: 1.3,

    backgroundColor: COLORS.orangeLight,
  },

  disabledField: {
    backgroundColor: "#F8F6F5",
  },

  fieldValue: {
    flex: 1,

    fontSize: 9.5,

    color: COLORS.text,

    fontWeight: "500",
  },

  disabledText: {
    color: COLORS.textSecondary,
  },

  editInput: {
    flex: 1,

    minHeight: 37,

    paddingVertical: 0,
    paddingHorizontal: 0,

    fontSize: 9.5,

    color: COLORS.text,

    fontWeight: "500",

    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "transparent"
},

  actionIcon: {
    width: 27,
    height: 27,

    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    marginLeft: 3,
  },

  saveIcon: {
    backgroundColor: "#FFFFFF",
  },

  /* ================= PREFERENCES ================= */

  preferencesCard: {
    backgroundColor: COLORS.white,

    borderRadius: 23,

    paddingHorizontal: 13,
    paddingTop: 13,
    paddingBottom: 4,

    marginBottom: 13,

    shadowColor: "#AFA7A2",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.07,
    shadowRadius: 8,

    elevation: 2,
  },

  preferencesTitle: {
    fontSize: 8,

    fontWeight: "800",

    color: COLORS.textLight,

    letterSpacing: 0.7,

    marginBottom: 5,
  },

  preferenceItem: {
    height: 45,

    flexDirection: "row",
    alignItems: "center",
  },

  preferenceIcon: {
    width: 31,
    height: 31,

    borderRadius: 10,

    backgroundColor: "#F5F1EF",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 10,
  },

  preferenceText: {
    flex: 1,

    fontSize: 9.5,

    fontWeight: "600",

    color: COLORS.text,
  },

  preferenceDivider: {
    height: 1,

    backgroundColor: COLORS.border,

    marginLeft: 41,
  },

  /* ================= LOGOUT ================= */

  logoutButton: {
    height: 47,

    borderRadius: 23,

    backgroundColor: COLORS.white,

    borderWidth: 1,
    borderColor: "#F1D7D9",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 7,

    marginTop: 3,
  },

  logoutText: {
    fontSize: 10,

    fontWeight: "800",

    color: COLORS.red,
  },

  versionText: {
    textAlign: "center",

    fontSize: 7,

    color: "#B1AAA6",

    marginTop: 12,
  },

  /* ================= MODAL ================= */

  modalOverlay: {
    flex: 1,

    backgroundColor:
      "rgba(42,41,40,0.35)",

    justifyContent: "center",

    paddingHorizontal: 18,
  },

  /* ================= LOGOUT MODAL ================= */

  logoutModal: {
    backgroundColor: COLORS.white,

    borderRadius: 25,

    padding: 20,

    alignItems: "center",
  },

  logoutIcon: {
    width: 52,
    height: 52,

    borderRadius: 26,

    backgroundColor: "#FFF0F1",

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 10,
  },

  logoutModalTitle: {
    fontSize: 17,

    fontWeight: "800",

    color: COLORS.text,
  },

  logoutModalSubtitle: {
    textAlign: "center",

    fontSize: 9,

    lineHeight: 13,

    color: COLORS.textLight,

    marginTop: 5,
    marginBottom: 17,
  },

  logoutActions: {
    flexDirection: "row",

    width: "100%",

    gap: 8,
  },

  cancelButton: {
    flex: 1,

    height: 40,

    borderRadius: 20,

    backgroundColor: "#F5F1EF",

    alignItems: "center",
    justifyContent: "center",
  },

  cancelText: {
    fontSize: 9,

    fontWeight: "700",

    color: COLORS.textSecondary,
  },

  confirmLogoutButton: {
    flex: 1,

    height: 40,

    borderRadius: 20,

    backgroundColor: COLORS.red,

    alignItems: "center",
    justifyContent: "center",
  },

  confirmLogoutText: {
    fontSize: 9,

    fontWeight: "700",

    color: "#FFFFFF",
  },
});