import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Colors } from '../constants/colors';
import { Spacing, Radii, Typography } from '../constants/typography';

interface CrisisResource {
  name: string;
  number?: string;
  text?: string;
  url?: string;
}

interface CrisisCardProps {
  message: string;
  resources?: CrisisResource[];
}

export function CrisisCard({ message, resources = [] }: CrisisCardProps) {
  const defaultResources: CrisisResource[] = [
    { name: '988 Suicide & Crisis Lifeline', number: '988', text: '988' },
    { name: 'Crisis Text Line', text: 'HOME to 741741' },
    { name: 'Veterans Crisis Line', number: '988', text: 'then press 1' },
    { name: 'Emergency', number: '911' },
  ];

  const displayResources = resources.length > 0 ? resources : defaultResources;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerText}>You're not alone</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.resourcesLabel}>Immediate Help</Text>
      {displayResources.map((r, i) => (
        <TouchableOpacity
          key={i}
          style={styles.resource}
          onPress={() => {
            if (r.number) {
              Linking.openURL(`tel:${r.number.replace(/\D/g, '')}`);
            } else if (r.url) {
              Linking.openURL(r.url);
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={`Call ${r.name}`}
          accessibilityHint="Activates to call or contact this crisis resource"
        >
          <Text style={styles.resourceName}>{r.name}</Text>
          {r.number && <Text style={styles.resourceAction}>Call {r.number}</Text>}
          {r.text && !r.number && <Text style={styles.resourceAction}>Text {r.text}</Text>}
          {r.text && r.number && <Text style={styles.resourceSub}>Text: {r.text}</Text>}
        </TouchableOpacity>
      ))}
      <Text style={styles.disclaimer}>
        If you are in immediate danger, call 911.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.crisisLight,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.crisis,
  },
  header: {
    backgroundColor: Colors.crisis,
    borderRadius: Radii.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  headerText: {
    ...Typography.label,
    color: Colors.white,
    textTransform: 'none',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0,
  },
  message: {
    ...Typography.body,
    color: '#4C1D95',
    marginBottom: Spacing.md,
  },
  resourcesLabel: {
    ...Typography.label,
    color: Colors.crisis,
    marginBottom: Spacing.sm,
  },
  resource: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    minHeight: 60,
    justifyContent: 'center',
  },
  resourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4C1D95',
    marginBottom: 2,
  },
  resourceAction: {
    fontSize: 15,
    color: Colors.crisis,
    fontWeight: '700',
  },
  resourceSub: {
    fontSize: 13,
    color: Colors.mutedFg,
    marginTop: 2,
  },
  disclaimer: {
    ...Typography.caption,
    color: Colors.mutedFg,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
