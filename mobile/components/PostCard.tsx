// @ts-nocheck
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

/**
 * PostCard
 * A single feed item on the Home screen.
 *
 * props:
 *  - post: { id, user: {name, faculty, avatar}, timeAgo, text, image, likes, comments, liked }
 *  - onToggleLike: (post) => void
 */
export default function PostCard({ post, onToggleLike }) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={post.user.avatar} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{post.user.name}</Text>
          <Text style={styles.meta}>
            {post.timeAgo} • {post.user.faculty}
          </Text>
        </View>
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="more-horizontal" size={18} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Text */}
      {!!post.text && <Text style={styles.text}>{post.text}</Text>}

      {/* Image */}
      {post.image && <Image source={post.image} style={styles.postImage} />}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => onToggleLike?.(post)}
        >
          <Ionicons
            name={post.liked ? 'heart' : 'heart-outline'}
            size={19}
            color={post.liked ? '#E63946' : '#555'}
          />
          <Text style={styles.actionText}>{post.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="chatbubble-outline" size={17} color="#555" />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="share-social-outline" size={18} color="#555" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  meta: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
  },
  text: {
    fontSize: 13.5,
    color: '#333',
    lineHeight: 20,
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 170,
    borderRadius: 12,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    borderTopWidth: 1,
    borderTopColor: '#f2f2f2',
    paddingTop: 10,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 12.5,
    color: '#666',
    fontWeight: '500',
  },
});
