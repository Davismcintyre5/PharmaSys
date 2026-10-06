import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { Spinner, IconButton, Alert } from '@/components/ui';
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from '@/hooks/useToast';
import { aiApi } from '@/api/axios';
import { queryKeys } from '@/config/queryKeys';
import type { AiQuota } from '@/types';

interface Message {
  id: string;
  from: 'user' | 'ai';
  text: string;
  at: string;
}

const SUGGESTIONS = [
  'What were my top selling drugs this week?',
  'Which items should I reorder?',
  "Summarize today's sales",
  'Any drugs close to expiry?',
];

export default function AiChat() {
  const { theme } = useTheme();
  const toast = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const listRef = useRef<FlatList<Message>>(null);

  const quotaQuery = useQuery({
    queryKey: queryKeys.ai.quota,
    queryFn: () => aiApi.quota(),
    staleTime: 30_000,
  });

  const quota: AiQuota | null = quotaQuery.data ?? null;

  function scrollToBottom() {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 50);
  }

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages.length]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;

    setInput('');
    const now = new Date().toISOString();
    const userMessage: Message = {
      id: `u-${Date.now()}`,
      from: 'user',
      text: msg,
      at: now,
    };

    setMessages((prev) => [...prev, userMessage]);
    setSending(true);

    try {
      const res = await aiApi.chat(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          from: 'ai',
          text: res.reply,
          at: new Date().toISOString(),
        },
      ]);
      quotaQuery.refetch();
    } catch (e: any) {
      toast.error(e?.message || 'AI request failed');
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          from: 'ai',
          text: 'Sorry, something went wrong. Try again.',
          at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.flex}
      >
        {quota ? (
          <View
            style={[
              styles.quota,
              {
                backgroundColor: theme.colors.surface,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <Ionicons
              name="flash-outline"
              size={14}
              color={theme.colors.textMuted}
            />
            <Text style={[styles.quotaText, { color: theme.colors.textMuted }]}>
              {quota.unlimited
                ? 'Unlimited'
                : `${quota.remaining ?? 0} / ${quota.max} left today`}
            </Text>
          </View>
        ) : null}

        {isEmpty ? (
          <View style={styles.empty}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: theme.colors.primary + '15' },
              ]}
            >
              <Ionicons
                name="sparkles"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              Ask me anything
            </Text>
            <Text
              style={[styles.emptyDesc, { color: theme.colors.textMuted }]}
            >
              I can help with stock, sales, expiries, and reorders.
            </Text>

            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => send(s)}
                  style={({ pressed }) => [
                    styles.suggestion,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: pressed
                        ? theme.colors.surface2
                        : theme.colors.surface,
                    },
                  ]}
                >
                  <Ionicons
                    name="sparkles-outline"
                    size={12}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.suggestionText,
                      { color: theme.colors.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            onContentSizeChange={scrollToBottom}
            renderItem={({ item }) => <MessageBubble message={item} />}
            ListFooterComponent={
              sending ? (
                <View style={styles.thinking}>
                  <View
                    style={[
                      styles.bubble,
                      styles.bubbleAi,
                      { backgroundColor: theme.colors.surface2 },
                    ]}
                  >
                    <Spinner />
                  </View>
                </View>
              ) : null
            }
          />
        )}

        <View
          style={[
            styles.composer,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything…"
            placeholderTextColor={theme.colors.textSubtle}
            editable={!sending}
            multiline
            maxLength={500}
            style={[
              styles.input,
              {
                color: theme.colors.text,
                backgroundColor: theme.colors.surface2,
                borderColor: theme.colors.border,
              },
            ]}
            onSubmitEditing={() => send()}
            blurOnSubmit={false}
          />
          <IconButton
            accessibilityLabel="Send"
            variant="solid"
            onPress={() => send()}
            disabled={sending || !input.trim()}
          >
            <Ionicons name="send" size={16} color="#ffffff" />
          </IconButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const { theme } = useTheme();
  const isUser = message.from === 'user';

  return (
    <View
      style={[
        styles.messageRow,
        isUser ? styles.rowUser : styles.rowAi,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: theme.colors.primary }
            : {
                backgroundColor: theme.colors.surface2,
                borderColor: theme.colors.border,
                borderWidth: 1,
              },
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            {
              color: isUser ? '#ffffff' : theme.colors.text,
            },
          ]}
        >
          {message.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  quota: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  quotaText: { fontSize: 12 },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
  },
  rowUser: { justifyContent: 'flex-end' },
  rowAi: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '85%',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleAi: { borderTopLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  thinking: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 12,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  suggestions: {
    width: '100%',
    marginTop: 24,
    gap: 8,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  suggestionText: { fontSize: 13, flex: 1 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
});