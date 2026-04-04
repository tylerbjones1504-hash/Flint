/**
 * Onboarding Step 6: Prompts
 * Users can pick up to 3 prompts from the seeded prompt_templates and write answers.
 * This step is optional — can be skipped and prompts added later.
 *
 * TODO: Add a nicer template picker UI (search, categories)
 */
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useOnboarding, type OnboardingPrompt } from '@/context/onboarding';
import { supabase } from '@/lib/supabase';
import type { PromptTemplate } from '@/types/database';

const MAX_PROMPTS = 3;
const MAX_ANSWER_LEN = 300;

export default function Step6() {
  const { data, update } = useOnboarding();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('prompt_templates')
      .select('*')
      .eq('is_active', true)
      .order('is_flint_branded', { ascending: false })
      .order('display_order')
      .then(({ data: rows }) => {
        setTemplates(rows ?? []);
        setLoading(false);
      });
  }, []);

  function addPrompt(template: PromptTemplate) {
    if (data.prompts.length >= MAX_PROMPTS) return;
    const newPrompt: OnboardingPrompt = {
      template_id: template.id,
      prompt_text: template.prompt_text,
      answer_text: '',
    };
    update({ prompts: [...data.prompts, newPrompt] });
    setPickerOpen(false);
  }

  function updateAnswer(index: number, answer_text: string) {
    const updated = data.prompts.map((p, i) =>
      i === index ? { ...p, answer_text: answer_text.slice(0, MAX_ANSWER_LEN) } : p
    );
    update({ prompts: updated });
  }

  function removePrompt(index: number) {
    update({ prompts: data.prompts.filter((_, i) => i !== index) });
  }

  // Already-selected template IDs to prevent duplicates
  const selectedTemplateIds = new Set(data.prompts.map((p) => p.template_id));

  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>Step 6 of 7</Text>
      <Text style={{ fontSize: 24, marginBottom: 8 }}>Prompts</Text>
      <Text style={{ color: '#555', marginBottom: 8 }}>
        Optional. Choose up to 3 prompts and write short answers. Helps matches start conversations.
      </Text>
      <Text style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>
        {data.prompts.length}/{MAX_PROMPTS} prompts added
      </Text>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          {data.prompts.map((prompt, index) => (
            <View
              key={index}
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 12, marginBottom: 16 }}
            >
              <Text style={{ fontWeight: '600', marginBottom: 8 }}>{prompt.prompt_text}</Text>
              <TextInput
                value={prompt.answer_text}
                onChangeText={(v) => updateAnswer(index, v)}
                placeholder="Your answer..."
                multiline
                numberOfLines={3}
                maxLength={MAX_ANSWER_LEN}
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  padding: 8,
                  borderRadius: 4,
                  minHeight: 72,
                  textAlignVertical: 'top',
                }}
              />
              <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                {prompt.answer_text.length}/{MAX_ANSWER_LEN}
              </Text>
              <View style={{ marginTop: 8 }}>
                <Button title="Remove" onPress={() => removePrompt(index)} color="#c00" />
              </View>
            </View>
          ))}

          {data.prompts.length < MAX_PROMPTS && (
            <Button
              title={`+ Add Prompt (${data.prompts.length}/${MAX_PROMPTS})`}
              onPress={() => setPickerOpen(true)}
            />
          )}
        </>
      )}

      <View style={{ height: 24 }} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Button title="← Back" onPress={() => router.back()} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Next →" onPress={() => router.push('/(onboarding)/step-7')} />
        </View>
      </View>
      <View style={{ height: 16 }} />
      <Button
        title="Skip"
        onPress={() => { update({ prompts: [] }); router.push('/(onboarding)/step-7'); }}
      />
      <View style={{ height: 48 }} />

      {/* Template picker modal */}
      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={{ flex: 1 }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '600' }}>Pick a Prompt</Text>
            <Button title="Cancel" onPress={() => setPickerOpen(false)} />
          </View>
          <FlatList
            data={templates.filter((t) => !selectedTemplateIds.has(t.id))}
            keyExtractor={(t) => t.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => addPrompt(item)}
                style={{
                  padding: 14,
                  marginBottom: 10,
                  borderRadius: 6,
                  backgroundColor: item.is_flint_branded ? '#f0f0ff' : '#f5f5f5',
                }}
              >
                {item.is_flint_branded && (
                  <Text style={{ fontSize: 11, color: '#555', marginBottom: 2 }}>⚡ Flint original</Text>
                )}
                <Text>{item.prompt_text}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}
