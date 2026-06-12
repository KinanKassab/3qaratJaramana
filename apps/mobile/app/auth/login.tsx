import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { X } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { language } = useUIStore();
  const isAr = language === 'ar';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const result = await login(email, password);
    setLoading(false);
    if (result.error) {
      setError(isAr ? 'البريد أو كلمة المرور غير صحيحة' : 'Invalid email or password');
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{isAr ? 'تسجيل الدخول' : 'Log In'}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={22} color="#212529" />
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.field}>
        <Text style={styles.label}>{isAr ? 'البريد الإلكتروني' : 'Email'}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          textAlign="left"
          placeholder="email@example.com"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{isAr ? 'كلمة المرور' : 'Password'}</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isAr ? 'دخول' : 'Log In'}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/auth/register')} style={styles.switchBtn}>
        <Text style={styles.switchText}>
          {isAr ? 'ليس لديك حساب؟ سجل الآن' : 'No account? Register'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 22, fontWeight: '800', color: '#212529' },
  error: { backgroundColor: '#fee2e2', borderRadius: 12, padding: 12, color: '#dc2626', fontSize: 13, marginBottom: 16, textAlign: 'center' },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#495057', marginBottom: 6, textAlign: 'right' },
  input: { borderWidth: 1, borderColor: '#dee2e6', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#212529' },
  btn: { backgroundColor: '#C4A35A', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchBtn: { marginTop: 16, alignItems: 'center' },
  switchText: { color: '#1B3A5C', fontSize: 14, fontWeight: '600' },
});
