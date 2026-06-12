import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { X } from 'lucide-react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const { language } = useUIStore();
  const isAr = language === 'ar';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    const result = await register(email, password, name);
    setLoading(false);
    if (result.error) {
      setError(isAr ? 'حدث خطأ أثناء التسجيل' : 'Registration failed');
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{isAr ? 'إنشاء حساب' : 'Create Account'}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={22} color="#212529" />
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {[
        { label: isAr ? 'الاسم الكامل' : 'Full Name', value: name, onChange: setName, type: 'default' },
        { label: isAr ? 'البريد الإلكتروني' : 'Email', value: email, onChange: setEmail, type: 'email-address' },
        { label: isAr ? 'كلمة المرور' : 'Password', value: password, onChange: setPassword, type: 'default', secure: true },
      ].map(field => (
        <View key={field.label} style={styles.field}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={styles.input}
            value={field.value}
            onChangeText={field.onChange}
            keyboardType={field.type as any}
            autoCapitalize="none"
            secureTextEntry={field.secure}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isAr ? 'تسجيل' : 'Register'}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/auth/login')} style={styles.switchBtn}>
        <Text style={styles.switchText}>
          {isAr ? 'لديك حساب؟ سجل دخولك' : 'Have an account? Log In'}
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
