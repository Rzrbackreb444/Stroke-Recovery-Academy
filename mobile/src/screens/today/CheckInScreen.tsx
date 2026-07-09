import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { apiFetch } from '../../lib/apiFetch';
import { useOffline } from '../../contexts/OfflineContext';
import { Endpoints } from '../../constants/api';
import { Colors } from '../../constants/colors';
import { Spacing, Radii, Typography, TouchTargetMin } from '../../constants/typography';
import { ScoreSlider } from '../../components/ScoreSlider';

interface Props {
  onDone: () => void;
  onBack: () => void;
}

export function CheckInScreen({ onDone, onBack }: Props) {
  const { isOnline, queueCheckin } = useOffline();
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [pain, setPain] = useState(3);
  const [win, setWin] = useState('');
  const [challenge, setChallenge] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ streak: { current: number }; quote: string } | null>(null);
  const winInputRef = useRef<TextInput>(null);

  const steps = ['Mood', 'Energy', 'Pain', 'Your Win'];
  const totalSteps = steps.length;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else onBack();
  };

  const handleSubmit = async () => {
    setLoading(true);
    const body = {
      moodScore: mood,
      energyScore: energy,
      painScore: pain,
      winsToday: win.trim() || undefined,
      challengesToday: challenge.trim() || undefined,
    };
    try {
      if (!isOnline) {
        await queueCheckin(body);
        setDone(true);
        setResult(null);
      } else {
        const r = await apiFetch<{ streak: { current: number }; quote: string }>(
          Endpoints.checkinCreate,
          { method: 'POST', body: JSON.stringify(body) },
        );
        setResult(r);
        setDone(true);
      }
    } catch (e: any) {
      if (e?.message?.includes('Already checked in')) {
        Alert.alert("Already checked in", "You've already completed today's check-in.");
        onBack();
      } else {
        Alert.alert('Error', e?.message || 'Failed to save check-in. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.doneContainer}>
          <Text style={styles.doneEmoji} accessibilityLabel="Checkmark">✓</Text>
          <Text style={styles.doneTitle}>
            {isOnline ? "Check-in saved!" : "Saved offline — will sync when you reconnect"}
          </Text>
          {result && (
            <>
              <View style={styles.streakBadge}>
                <Text style={styles.streakNum}>{result.streak.current}</Text>
                <Text style={styles.streakLabel}>Day Streak</Text>
              </View>
              {result.quote ? (
                <View style={styles.quoteBox}>
                  <Text style={styles.quoteText}>{result.quote}</Text>
                </View>
              ) : null}
            </>
          )}
          <TouchableOpacity
            style={styles.doneButton}
            onPress={onDone}
            accessibilityRole="button"
            accessibilityLabel="Back to Today"
          >
            <Text style={styles.doneButtonText}>Back to Today</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>{step + 1} of {totalSteps}</Text>
      </View>

      <View style={styles.progress}>
        <View style={[styles.progressBar, { width: `${((step + 1) / totalSteps) * 100}%` }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepTitle}>{steps[step]}</Text>

        {step === 0 && (
          <ScoreSlider
            label="How's your mood today?"
            value={mood}
            onChange={setMood}
            lowLabel="Very low"
            highLabel="Great"
            accessibilityHint="Rate your mood from 1 to 10"
          />
        )}

        {step === 1 && (
          <ScoreSlider
            label="How's your energy?"
            value={energy}
            onChange={setEnergy}
            lowLabel="Exhausted"
            highLabel="Energized"
            accessibilityHint="Rate your energy from 1 to 10"
          />
        )}

        {step === 2 && (
          <ScoreSlider
            label="Pain level today?"
            value={pain}
            onChange={setPain}
            lowLabel="None"
            highLabel="Intense"
            accessibilityHint="Rate your pain level from 1 to 10"
          />
        )}

        {step === 3 && (
          <View>
            <Text style={styles.fieldLabel}>Your win today (anything counts)</Text>
            <TextInput
              ref={winInputRef}
              style={styles.textArea}
              value={win}
              onChangeText={setWin}
              placeholder="I walked to the mailbox. I said no to the thing. I got out of bed."
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={4}
              accessibilityLabel="Your win today"
              accessibilityHint="Describe anything you're proud of from today"
            />
            <Text style={styles.fieldLabel}>Biggest challenge (optional)</Text>
            <TextInput
              style={styles.textArea}
              value={challenge}
              onChangeText={setChallenge}
              placeholder="What was hard today?"
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={3}
              accessibilityLabel="Biggest challenge today, optional"
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, loading && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={step < totalSteps - 1 ? 'Next' : 'Save check-in'}
          accessibilityState={{ disabled: loading }}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.nextButtonText}>
              {step < totalSteps - 1 ? 'Next →' : 'Save Check-In'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    minHeight: TouchTargetMin,
    justifyContent: 'center',
    paddingRight: Spacing.md,
  },
  backText: { color: Colors.orange, fontSize: 17, fontWeight: '600' },
  stepIndicator: { ...Typography.caption, fontWeight: '600' },
  progress: {
    height: 4,
    backgroundColor: Colors.muted,
    marginHorizontal: Spacing.md,
    borderRadius: 2,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.orange,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  stepTitle: { ...Typography.h2, marginBottom: Spacing.xl },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.ink,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  textArea: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: 17,
    color: Colors.ink,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: Spacing.sm,
  },
  footer: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  nextButton: {
    height: TouchTargetMin + 8,
    backgroundColor: Colors.orange,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: { opacity: 0.6 },
  nextButtonText: { ...Typography.button, fontSize: 18 },
  doneContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  doneEmoji: {
    fontSize: 64,
    color: Colors.success,
    marginBottom: Spacing.lg,
    fontWeight: '700',
  },
  doneTitle: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    color: Colors.ink,
  },
  streakBadge: {
    backgroundColor: Colors.orange,
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  streakNum: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.white,
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  quoteBox: {
    backgroundColor: Colors.stone,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: Colors.orange,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: Colors.ink,
    lineHeight: 24,
    textAlign: 'center',
  },
  doneButton: {
    height: TouchTargetMin + 8,
    backgroundColor: Colors.orange,
    borderRadius: Radii.md,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: { ...Typography.button, fontSize: 18 },
});
