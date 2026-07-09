import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/typography';

interface SasquatchHeaderProps {
  greeting?: string;
  subtitle?: string;
  showLogo?: boolean;
}

export function SasquatchHeader({
  greeting = 'Stroke Recovery Academy',
  subtitle,
  showLogo = true,
}: SasquatchHeaderProps) {
  return (
    <View style={styles.container}>
      {showLogo && (
        <Image
          source={require('../../assets/sasquatch-logo.png')}
          style={styles.logo}
          accessibilityLabel="Sasquatch logo"
        />
      )}
      <View style={styles.textContainer}>
        <Text style={styles.greeting}>{greeting}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.cream,
    gap: Spacing.sm,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.mutedFg,
    marginTop: 1,
  },
});
