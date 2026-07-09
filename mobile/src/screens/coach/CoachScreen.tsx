import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '../../lib/apiFetch';
import { Endpoints } from '../../constants/api';
import { Colors } from '../../constants/colors';
import { Spacing, Radii, Typography, TouchTargetMin } from '../../constants/typography';
import { CrisisCard } from '../../components/CrisisCard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isCrisis?: boolean;
  crisisResources?: unknown[];
}

interface CoachResponse {
  message?: string;
  text?: string;
  isCrisis?: boolean;
  crisis?: boolean;
  resources?: unknown[];
  requireAuth?: boolean;
  capped?: boolean;
  used?: number;
  limit?: number;
  upgradeUrl?: string;
}

let msgCounter = 0;
const uid = () => `msg-${++msgCounter}-${Date.now()}`;

export function CoachScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: 'assistant',
      content: "Heart's still thumpin'. What's on your mind today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const appendMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const startVoiceInput = useCallback(async () => {
    try {
      const { default: Speech } = await import('expo-speech');
      Alert.alert(
        'Voice Input',
        'Voice input requires a voice recognition library. Type your message or use the keyboard mic.',
        [{ text: 'OK' }],
      );
    } catch {
      Alert.alert('Voice input not available', 'Please type your message.');
    }
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: uid(), role: 'user', content: text };
    setInput('');
    appendMessage(userMsg);
    setLoading(true);

    const history = messages
      .filter((m) => !m.isCrisis)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const resp = await apiFetch<CoachResponse>(Endpoints.coachChat, {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          history,
          skipAudio: true,
        }),
      });

      const isCrisis = !!(resp.isCrisis || resp.crisis);
      const replyText = resp.message || resp.text || '';

      appendMessage({
        id: uid(),
        role: 'assistant',
        content: replyText,
        isCrisis,
        crisisResources: resp.resources as unknown[] | undefined,
      });
    } catch (e: any) {
      if (e?.requireAuth) {
        appendMessage({
          id: uid(),
          role: 'assistant',
          content: e.message || "You've used your free messages. Sign in to continue.",
        });
      } else if (e?.capped) {
        appendMessage({
          id: uid(),
          role: 'assistant',
          content: e.message || "You've hit today's message limit. Upgrade to Sasquatch Premium for unlimited.",
        });
      } else {
        appendMessage({
          id: uid(),
          role: 'assistant',
          content: "Network trouble. Try again in a moment.",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    if (item.isCrisis) {
      return (
        <View style={styles.messagePad}>
          <CrisisCard
            message={item.content}
            resources={item.crisisResources as any}
          />
        </View>
      );
    }
    return (
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        {!isUser && (
          <View style={styles.botAvatar} accessibilityLabel="Sasquatch coach">
            <Text style={styles.botAvatarText}>S</Text>
          </View>
        )}
        <View style={[styles.bubbleContent, isUser ? styles.bubbleContentUser : styles.bubbleContentBot]}>
          <Text
            style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}
            accessibilityRole="text"
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.botAvatar}>
          <Text style={styles.botAvatarText}>S</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>Sasquatch Coach</Text>
          <Text style={styles.headerSub}>Not medical advice — accountability & reps.</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        keyboardShouldPersistTaps="handled"
        accessibilityLabel="Coach conversation"
      />

      {loading && (
        <View style={styles.typingRow}>
          <ActivityIndicator size="small" color={Colors.orange} />
          <Text style={styles.typingText}>Sasquatch is typing…</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.voiceBtn}
            onPress={startVoiceInput}
            accessibilityRole="button"
            accessibilityLabel="Voice input"
            accessibilityHint="Speak your message to the coach"
          >
            <Text style={styles.voiceBtnText}>🎤</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Sasquatch anything…"
            placeholderTextColor={Colors.textTertiary}
            multiline
            maxLength={800}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
            accessibilityLabel="Message to coach"
            accessibilityHint="Type your message here. Tap send or press return to send."
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !input.trim() || loading }}
          >
            <Text style={styles.sendBtnText}>→</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.disclaimer}>
          New symptoms → your doctor. In crisis? Call 988 or 911.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.stone,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.ink },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  messagePad: {
    paddingVertical: Spacing.xs,
  },
  bubble: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'flex-end',
  },
  bubbleUser: {
    flexDirection: 'row-reverse',
  },
  bubbleBot: {},
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  botAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
  },
  bubbleContent: {
    maxWidth: '78%',
    borderRadius: Radii.lg,
    padding: Spacing.md,
  },
  bubbleContentUser: {
    backgroundColor: Colors.orange,
    borderBottomRightRadius: 4,
  },
  bubbleContentBot: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 23,
  },
  bubbleTextUser: {
    color: Colors.white,
  },
  bubbleTextBot: {
    color: Colors.ink,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  typingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  voiceBtn: {
    width: TouchTargetMin,
    height: TouchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
    backgroundColor: Colors.muted,
  },
  voiceBtnText: { fontSize: 20 },
  input: {
    flex: 1,
    minHeight: TouchTargetMin,
    maxHeight: 120,
    backgroundColor: Colors.muted,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 16,
    color: Colors.ink,
  },
  sendBtn: {
    width: TouchTargetMin,
    height: TouchTargetMin,
    backgroundColor: Colors.orange,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
  },
});
