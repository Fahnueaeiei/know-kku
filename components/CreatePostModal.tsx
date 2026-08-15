// @ts-nocheck
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

/**
 * CreatePostModal
 * Centered popup used to compose a new feed post.
 *
 * props:
 *  - visible: boolean
 *  - user: { name, avatar }              // current user shown in the popup
 *  - onClose: () => void
 *  - onSubmit: (text) => void            // called with trimmed text on Post
 */
export default function CreatePostModal({ visible, user, onClose, onSubmit }) {
  const [text, setText] = useState('');

  const handleClose = () => {
    setText('');
    onClose?.();
  };

  const handlePost = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit?.(trimmed);
    setText('');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.centerWrap}
          >
            {/* Stop backdrop press from closing when tapping inside the card */}
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.card}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>สร้างโพสต์</Text>
                  <TouchableOpacity
                    onPress={handleClose}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={20} color="#333" />
                  </TouchableOpacity>
                </View>

                {/* User row */}
                <View style={styles.userRow}>
                  <Image source={user.avatar} style={styles.avatar} />
                  <Text style={styles.userName}>{user.name}</Text>
                </View>

                {/* Text input */}
                <TextInput
                  style={styles.input}
                  placeholder="คุณคิดอะไรอยู่..."
                  placeholderTextColor="#aaa"
                  value={text}
                  onChangeText={setText}
                  multiline
                  autoFocus
                />

                {/* Icon row */}
                <View style={styles.iconRow}>
                  <TouchableOpacity>
                    <Feather name="image" size={20} color="#4CAF50" />
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Ionicons name="location-outline" size={20} color="#E86A33" />
                  </TouchableOpacity>
                </View>

                {/* Post button */}
                <TouchableOpacity
                  style={[styles.postButton, !text.trim() && styles.postButtonDisabled]}
                  onPress={handlePost}
                  disabled={!text.trim()}
                >
                  <Text style={styles.postButtonText}>Post</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  input: {
    minHeight: 100,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 14,
    marginBottom: 16,
  },
  postButton: {
    backgroundColor: '#E86A33',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
