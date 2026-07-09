import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/colors';
import { Spacing, Radii, Typography, TouchTargetMin } from '../../constants/typography';

interface Props {
  onGoSignIn: () => void;
}

export function RegisterScreen({ onGoSignIn }: Props) {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!firstName.trim() || !email.trim() || !password) {
      setError('First name, email, and password are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register(email.trim().toLowerCase(), password, firstName.trim(), lastName.trim());
    } catch (e: any) {
      setError(e?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoRow}>
          <Image
            source={require('../../../assets/sasquatch-logo.png')}
            style={styles.logo}
            accessibilityLabel="Stroke Recovery Academy logo"
          />
        </View>

        <Text style={styles.title}>Join the Academy</Text>
        <Text style={styles.subtitle}>
          Start your recovery journey. It's free.
        </Text>

        {error && (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <Text style={styles.fieldLabel}>First name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="words"
              returnKeyType="next"
              accessibilityLabel="First name"
            />
          </View>
          <View style={styles.nameField}>
            <Text style={styles.fieldLabel}>Last name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="words"
              returnKeyType="next"
              accessibilityLabel="Last name"
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          accessibilityLabel="Email address"
        />

        <Text style={styles.fieldLabel}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          placeholderTextColor={Colors.textTertiary}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleRegister}
          accessibilityLabel="Password, at least 8 characters"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Create account"
          accessibilityState={{ disabled: loading }}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={onGoSignIn}
          accessibilityRole="button"
          accessibilityLabel="Sign in to existing account"
        >
          <Text style={styles.linkText}>
            Already a member?{' '}
            <Text style={styles.link}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.cream },
  container: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
    justifyContent: 'center',
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
  title: {
    ...Typography.h1,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 15,
    fontWeight: '500',
  },
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  nameField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.ink,
    marginBottom: 6,
    marginTop: Spacing.sm,
  },
  input: {
    height: TouchTargetMin + 8,
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    fontSize: 17,
    color: Colors.ink,
    marginBottom: Spacing.sm,
  },
  button: {
    height: TouchTargetMin + 8,
    backgroundColor: Colors.orange,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    ...Typography.button,
    fontSize: 18,
  },
  linkRow: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    minHeight: TouchTargetMin,
    justifyContent: 'center',
  },
  linkText: { fontSize: 16, color: Colors.textSecondary },
  link: { color: Colors.orange, fontWeight: '600' },
});
