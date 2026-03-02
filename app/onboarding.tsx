import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useUser, UserProfile } from "@/context/UserContext";

const FIELDS: {
  key: keyof UserProfile;
  label: string;
  placeholder: string;
  icon: string;
  keyboard: "default" | "email-address" | "numeric" | "decimal-pad";
  suffix?: string;
}[] = [
  { key: "name",       label: "Full Name",   placeholder: "Alex Johnson",          icon: "person-outline",    keyboard: "default" },
  { key: "email",      label: "Email",        placeholder: "alex@domain.com",       icon: "mail-outline",      keyboard: "email-address" },
  { key: "profession", label: "Profession",   placeholder: "Powerlifter / Athlete", icon: "briefcase-outline", keyboard: "default" },
  { key: "age",        label: "Age",          placeholder: "25",                    icon: "calendar-outline",  keyboard: "numeric",      suffix: "yrs" },
  { key: "weightKg",   label: "Weight",       placeholder: "80",                    icon: "scale-outline",     keyboard: "decimal-pad",  suffix: "kg" },
  { key: "heightCm",   label: "Height",       placeholder: "175",                   icon: "resize-outline",    keyboard: "decimal-pad",  suffix: "cm" },
];

const BG      = "#0D0F14";
const CARD    = "#161A22";
const BORDER  = "#1E2530";
const TINT    = "#00E676";
const TEXT    = "#F5F7FA";
const MUTED   = "#6B7280";
const SECOND  = "#9CA3AF";

export default function OnboardingScreen() {
  const insets  = useSafeAreaInsets();
  const { saveProfile } = useUser();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof UserProfile, string>>>({});
  const [form, setForm] = useState<UserProfile>({
    name: "", email: "", profession: "", age: "", weightKg: "", heightCm: "",
  });

  const refs = useRef<Record<string, TextInput | null>>({});

  const update = (key: keyof UserProfile, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof UserProfile, string>> = {};
    if (!form.name.trim())       e.name       = "Full name is required";
    if (!form.email.trim())      e.email      = "Email is required";
    if (!form.profession.trim()) e.profession = "Profession is required";
    if (!form.age.trim())        e.age        = "Age is required";
    if (!form.weightKg.trim())   e.weightKg   = "Weight is required";
    if (!form.heightCm.trim())   e.heightCm   = "Height is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveProfile(form);
    router.replace("/(tabs)");
  };

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            {
              paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 24,
              paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 48,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand */}
          <View style={s.brandRow}>
            <View style={s.logoCircle}>
              <Ionicons name="flash" size={28} color={TINT} />
            </View>
            <Text style={[s.brandName, { color: TEXT }]}>PerformX</Text>
          </View>

          <Text style={[s.title, { color: TEXT }]}>
            Build your{"\n"}performance profile
          </Text>
          <Text style={[s.subtitle, { color: MUTED }]}>
            We use this to personalise your habits,{"\n"}calculate BMI, and track your progress.
          </Text>

          {/* Fields */}
          <View style={s.formCard}>
            {FIELDS.map((f, idx) => {
              const hasError = !!errors[f.key];
              return (
                <View key={f.key} style={[s.fieldWrap, idx > 0 && s.fieldTop]}>
                  <Text style={[s.label, { color: SECOND }]}>{f.label}</Text>
                  <View
                    style={[
                      s.inputRow,
                      {
                        borderColor: hasError ? "#FF3B30" : form[f.key] ? TINT + "55" : BORDER,
                        backgroundColor: CARD,
                      },
                    ]}
                  >
                    <Ionicons
                      name={f.icon as any}
                      size={18}
                      color={hasError ? "#FF3B30" : form[f.key] ? TINT : MUTED}
                      style={s.inputIcon}
                    />
                    <TextInput
                      ref={r => { refs.current[f.key] = r; }}
                      style={[s.input, { color: TEXT }]}
                      value={form[f.key]}
                      onChangeText={v => update(f.key, v)}
                      placeholder={f.placeholder}
                      placeholderTextColor={MUTED}
                      keyboardType={f.keyboard}
                      autoCapitalize={f.keyboard === "email-address" ? "none" : "words"}
                      returnKeyType={idx < FIELDS.length - 1 ? "next" : "done"}
                      onSubmitEditing={() => {
                        const next = FIELDS[idx + 1];
                        if (next) refs.current[next.key]?.focus();
                        else handleSubmit();
                      }}
                      blurOnSubmit={false}
                    />
                    {!!f.suffix && (
                      <Text style={[s.suffix, { color: MUTED }]}>{f.suffix}</Text>
                    )}
                  </View>
                  {hasError && (
                    <Text style={s.errorText}>{errors[f.key]}</Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* BMI preview note */}
          <View style={[s.bmiNote, { backgroundColor: TINT + "12", borderColor: TINT + "30" }]}>
            <Ionicons name="analytics-outline" size={16} color={TINT} />
            <Text style={[s.bmiNoteText, { color: SECOND }]}>
              Your BMI will be calculated automatically and shown in your Stats tab.
            </Text>
          </View>

          {/* CTA */}
          <Pressable
            onPress={handleSubmit}
            disabled={saving}
            style={({ pressed }) => [s.cta, { opacity: pressed ? 0.85 : 1 }]}
          >
            {saving ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={s.ctaText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color="#000" />
              </>
            )}
          </Pressable>

          <Text style={[s.privacy, { color: MUTED }]}>
            Your data is stored only on this device.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  scroll:     { paddingHorizontal: 24 },
  brandRow:   { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 32 },
  logoCircle: { width: 48, height: 48, borderRadius: 14, backgroundColor: TINT + "18", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: TINT + "40" },
  brandName:  { fontSize: 22, fontFamily: "Outfit_800ExtraBold" },
  title:      { fontSize: 32, fontFamily: "Outfit_800ExtraBold", lineHeight: 40, marginBottom: 12 },
  subtitle:   { fontSize: 15, fontFamily: "Outfit_400Regular", lineHeight: 22, marginBottom: 32 },
  formCard:   { backgroundColor: CARD, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: BORDER, marginBottom: 16 },
  fieldWrap:  {},
  fieldTop:   { marginTop: 20 },
  label:      { fontSize: 12, fontFamily: "Outfit_500Medium", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  inputRow:   { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, height: 52 },
  inputIcon:  { marginRight: 10 },
  input:      { flex: 1, fontSize: 16, fontFamily: "Outfit_500Medium" },
  suffix:     { fontSize: 14, fontFamily: "Outfit_500Medium", marginLeft: 8 },
  errorText:  { fontSize: 12, color: "#FF3B30", fontFamily: "Outfit_400Regular", marginTop: 5 },
  bmiNote:    { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 24 },
  bmiNoteText:{ fontSize: 13, fontFamily: "Outfit_400Regular", lineHeight: 19, flex: 1 },
  cta:        { backgroundColor: TINT, borderRadius: 16, height: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 },
  ctaText:    { fontSize: 17, fontFamily: "Outfit_700Bold", color: "#000" },
  privacy:    { fontSize: 12, fontFamily: "Outfit_400Regular", textAlign: "center" },
});
