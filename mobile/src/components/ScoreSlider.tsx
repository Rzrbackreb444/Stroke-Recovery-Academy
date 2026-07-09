import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { Spacing, Typography, TouchTargetMin } from '../constants/typography';

interface ScoreSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  lowLabel?: string;
  highLabel?: string;
  accessibilityHint?: string;
}

export function ScoreSlider({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
  lowLabel,
  highLabel,
  accessibilityHint,
}: ScoreSliderProps) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <View style={styles.container} accessible accessibilityLabel={`${label}: ${value} out of ${max}`} accessibilityHint={accessibilityHint}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepsRow}>
        {steps.map((step) => (
          <TouchableOpacity
            key={step}
            style={[styles.step, value === step && styles.stepActive]}
            onPress={() => onChange(step)}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === step }}
            accessibilityLabel={`${step}`}
            hitSlop={{ top: 8, bottom: 8, left: 2, right: 2 }}
          >
            <Text style={[styles.stepText, value === step && styles.stepTextActive]}>
              {step}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {(lowLabel || highLabel) && (
        <View style={styles.labels}>
          <Text style={styles.endLabel}>{lowLabel || ''}</Text>
          <Text style={styles.endLabel}>{highLabel || ''}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.ink,
    marginBottom: Spacing.sm,
  },
  stepsRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  step: {
    width: TouchTargetMin - 16,
    height: TouchTargetMin - 16,
    minWidth: 32,
    minHeight: 32,
    borderRadius: 8,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  stepActive: {
    backgroundColor: Colors.orange,
  },
  stepText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.mutedFg,
  },
  stepTextActive: {
    color: Colors.white,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  endLabel: {
    ...Typography.caption,
  },
});
