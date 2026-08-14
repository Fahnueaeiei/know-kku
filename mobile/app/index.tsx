import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';

const API_URL = 'http://172.20.10.2:3000';

type Post = {
  postId: number;
  content: string;
  category?: string | null;
  isAnonymous?: boolean | null;
  createdAt?: string | null;
  user?: { userId: number; displayName?: string | null } | null;
};

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`${API_URL}/posts`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
        setError('Unable to load posts.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Community Feed</Text>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.postId)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              <Text style={styles.author}>
                {item.isAnonymous ? 'Anonymous' : item.user?.displayName || 'KKU Student'}
              </Text>
              {item.category && <Text style={styles.category}>{item.category}</Text>}
              <Text style={styles.content}>{item.content}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No posts found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginTop: 8, marginBottom: 12 },
  loader: { marginTop: 40 },
  error: { textAlign: 'center', color: '#D64545', marginTop: 40 },
  list: { paddingBottom: 20 },
  postCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  author: { fontSize: 13, fontWeight: '700', color: '#333' },
  category: { fontSize: 11, color: '#E86A33', marginTop: 4 },
  content: { fontSize: 14, lineHeight: 21, color: '#555', marginTop: 8 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});