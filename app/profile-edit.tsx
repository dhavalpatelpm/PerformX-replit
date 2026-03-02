import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useUser, UserProfile, computeBMI } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";

const FIELDS: {
  key: keyof Omit<UserProfile, "profilePicUri">;
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

export default function ProfileEditScreen() {
  const { profile, saveProfile, getInitials } = useUser();
  const { colors, isDark } = useTheme();
  const insets  = useSafeAreaInsets();
  const topPad  = Platform.OS === "web" ? 67 : insets.top;
  const botPad  = Platform.OS === "web" ? 34 : insets.bottom;

  const [form, setForm] = useState<UserProfile>(
    profile ?? { name: "", email: "", profession: "", age: "", weightKg: "", heightCm: "" }
  );
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState<Partial<Record<keyof UserProfile, string>>>({});
  const [showPicModal, setShowPicModal] = useState(false);

  const refs = useRef<Record<string, TextInput | null>>({});

  const update = useCallback((key: keyof UserProfile, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  }, [errors]);

  // Live BMI from current form values
  const liveBMI = computeBMI(form.weightKg, form.heightCm);

  const validate = (): boolean => {
    const e: Partial<Record<keyof UserProfile, string>> = {};
    if (!form.name.trim())       e.name       = "Required";
    if (!form.email.trim())      e.email      = "Required";
    if (!form.profession.trim()) e.profession = "Required";
    if (!form.age.trim())        e.age        = "Required";
    if (!form.weightKg.trim())   e.weightKg   = "Required";
    if (!form.heightCm.trim())   e.heightCm   = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveProfile(form);
    setSaving(false);
    router.back();
  };

  const waitForModalClose = () => new Promise<void>(r => setTimeout(r, 350));

  const pickFromGallery = async () => {
    setShowPicModal(false);
    await waitForModalClose();
    const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      if (!canAskAgain) {
        Alert.alert(
          "Photos Access Denied",
          "PerformX needs photo library access to set your profile picture. Please enable it in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
      }
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      update("profilePicUri", result.assets[0].uri);
    }
  };

  const pickFromCamera = async () => {
    setShowPicModal(false);
    if (Platform.OS === "web") return;
    await waitForModalClose();
    const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      if (!canAskAgain) {
        Alert.alert(
          "Camera Access Denied",
          "PerformX needs camera access to take a profile photo. Please enable it in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
      }
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      update("profilePicUri", result.assets[0].uri);
    }
  };

  const initials = getInitials();

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingTop: topPad + 8, paddingBottom: botPad + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={s.topBar}>
            <Pressable
              onPress={() => router.back()}
              style={[s.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </Pressable>
            <Text style={[s.title, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
              Edit Profile
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Avatar */}
          <View style={s.avatarSection}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPicModal(true); }}
              style={s.avatarWrap}
            >
              {form.profilePicUri ? (
                <Image source={{ uri: form.profilePicUri }} style={s.avatarImg} />
              ) : (
                <View style={[s.avatarPlaceholder, { backgroundColor: colors.tint + "20", borderColor: colors.tint + "55" }]}>
                  <Text style={[s.avatarInitials, { color: colors.tint, fontFamily: "Outfit_800ExtraBold" }]}>
                    {initials}
                  </Text>
                </View>
              )}
              <View style={[s.cameraBtn, { backgroundColor: colors.tint }]}>
                <Ionicons name="camera" size={16} color="#000" />
              </View>
            </Pressable>
            <Text style={[s.changePhotoText, { color: colors.tint, fontFamily: "Outfit_500Medium" }]}>
              {form.profilePicUri ? "Change Photo" : "Add Photo"}
            </Text>
          </View>

          {/* Live BMI pill */}
          {liveBMI && (
            <View style={[s.bmiPill, { backgroundColor: liveBMI.color + "18", borderColor: liveBMI.color + "45" }]}>
              <Ionicons name="analytics-outline" size={16} color={liveBMI.color} />
              <Text style={[s.bmiPillText, { color: liveBMI.color, fontFamily: "Outfit_700Bold" }]}>
                BMI {liveBMI.value}
              </Text>
              <Text style={[s.bmiPillCat, { color: liveBMI.color + "cc", fontFamily: "Outfit_400Regular" }]}>
                {liveBMI.category}
              </Text>
            </View>
          )}

          {/* Form fields */}
          <View style={[s.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {FIELDS.map((f, idx) => {
              const hasError = !!errors[f.key];
              const val = (form[f.key] as string) ?? "";
              return (
                <View key={f.key} style={[s.fieldWrap, idx > 0 && s.fieldTop]}>
                  <Text style={[s.label, { color: colors.textSecondary, fontFamily: "Outfit_500Medium" }]}>
                    {f.label}
                  </Text>
                  <View
                    style={[
                      s.inputRow,
                      {
                        borderColor: hasError
                          ? "#FF3B30"
                          : val
                          ? colors.tint + "55"
                          : colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                  >
                    <Ionicons
                      name={f.icon as any}
                      size={18}
                      color={hasError ? "#FF3B30" : val ? colors.tint : colors.textMuted}
                      style={s.inputIcon}
                    />
                    <TextInput
                      ref={r => { refs.current[f.key] = r; }}
                      style={[s.input, { color: colors.text }]}
                      value={val}
                      onChangeText={v => update(f.key, v)}
                      placeholder={f.placeholder}
                      placeholderTextColor={colors.textMuted}
                      keyboardType={f.keyboard}
                      autoCapitalize={f.keyboard === "email-address" ? "none" : "words"}
                      returnKeyType={idx < FIELDS.length - 1 ? "next" : "done"}
                      onSubmitEditing={() => {
                        const next = FIELDS[idx + 1];
                        if (next) refs.current[next.key]?.focus();
                        else handleSave();
                      }}
                      blurOnSubmit={false}
                    />
                    {!!f.suffix && (
                      <Text style={[s.suffix, { color: colors.textMuted, fontFamily: "Outfit_500Medium" }]}>
                        {f.suffix}
                      </Text>
                    )}
                  </View>
                  {hasError && (
                    <Text style={s.errorText}>{errors[f.key]}</Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Save button */}
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [s.saveBtn, { opacity: pressed ? 0.85 : 1, backgroundColor: colors.tint }]}
          >
            {saving ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#000" />
                <Text style={[s.saveBtnText, { fontFamily: "Outfit_700Bold" }]}>Save Changes</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Photo picker modal */}
      <Modal
        visible={showPicModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicModal(false)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setShowPicModal(false)}>
          <View style={[s.pickerSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.pickerTitle, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>
              Profile Photo
            </Text>
            <Pressable
              onPress={pickFromGallery}
              style={[s.pickerBtn, { borderColor: colors.border }]}
            >
              <Ionicons name="images-outline" size={22} color={colors.tint} />
              <Text style={[s.pickerBtnText, { color: colors.text, fontFamily: "Outfit_600SemiBold" }]}>
                Choose from Gallery
              </Text>
            </Pressable>
            {Platform.OS !== "web" && (
              <Pressable
                onPress={pickFromCamera}
                style={[s.pickerBtn, { borderColor: colors.border }]}
              >
                <Ionicons name="camera-outline" size={22} color={colors.tint} />
                <Text style={[s.pickerBtnText, { color: colors.text, fontFamily: "Outfit_600SemiBold" }]}>
                  Take a Photo
                </Text>
              </Pressable>
            )}
            {form.profilePicUri && (
              <Pressable
                onPress={() => { update("profilePicUri", ""); setShowPicModal(false); }}
                style={[s.pickerBtn, { borderColor: colors.border }]}
              >
                <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                <Text style={[s.pickerBtnText, { color: "#FF3B30", fontFamily: "Outfit_600SemiBold" }]}>
                  Remove Photo
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setShowPicModal(false)}
              style={[s.cancelBtn, { backgroundColor: colors.border }]}
            >
              <Text style={[s.cancelText, { color: colors.text, fontFamily: "Outfit_600SemiBold" }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1 },
  scroll:       { paddingHorizontal: 20 },
  topBar:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  backBtn:      { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title:        { fontSize: 18 },
  avatarSection:{ alignItems: "center", marginBottom: 20 },
  avatarWrap:   { position: "relative", marginBottom: 10 },
  avatarImg:    { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  avatarInitials:    { fontSize: 32 },
  cameraBtn:    { position: "absolute", bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  changePhotoText: { fontSize: 14 },
  bmiPill:      { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1, marginBottom: 16, alignSelf: "center" },
  bmiPillText:  { fontSize: 16 },
  bmiPillCat:   { fontSize: 14 },
  formCard:     { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 20 },
  fieldWrap:    {},
  fieldTop:     { marginTop: 18 },
  label:        { fontSize: 11, marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.5 },
  inputRow:     { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, height: 50 },
  inputIcon:    { marginRight: 10 },
  input:        { flex: 1, fontSize: 15, fontFamily: "Outfit_500Medium" },
  suffix:       { fontSize: 13, marginLeft: 6 },
  errorText:    { fontSize: 11, color: "#FF3B30", fontFamily: "Outfit_400Regular", marginTop: 4 },
  saveBtn:      { borderRadius: 16, height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 },
  saveBtnText:  { fontSize: 16, color: "#000" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  pickerSheet:  { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, gap: 4 },
  pickerTitle:  { fontSize: 17, textAlign: "center", marginBottom: 12 },
  pickerBtn:    { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 4 },
  pickerBtnText:{ fontSize: 16 },
  cancelBtn:    { borderRadius: 14, height: 50, alignItems: "center", justifyContent: "center", marginTop: 8 },
  cancelText:   { fontSize: 16 },
});
