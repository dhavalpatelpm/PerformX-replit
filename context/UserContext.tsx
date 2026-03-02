import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@biohack_user_profile";

export interface UserProfile {
  name: string;
  email: string;
  profession: string;
  age: string;
  weightKg: string;
  heightCm: string;
  profilePicUri?: string;
}

export interface BMIResult {
  value: number;
  category: string;
  color: string;
}

interface UserContextType {
  profile: UserProfile | null;
  isOnboarded: boolean;
  loading: boolean;
  saveProfile: (p: UserProfile) => Promise<void>;
  getInitials: () => string;
  getBMI: (overrideWeight?: string, overrideHeight?: string) => BMIResult | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function computeBMI(weightKg: string, heightCm: string): BMIResult | null {
  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm) / 100;
  if (!w || !h || h <= 0) return null;
  const bmi = w / (h * h);
  let category = "Normal";
  let color = "#00E676";
  if (bmi < 18.5)      { category = "Underweight"; color = "#00B4D8"; }
  else if (bmi < 25)   { category = "Normal";      color = "#00E676"; }
  else if (bmi < 30)   { category = "Overweight";  color = "#FFB300"; }
  else                 { category = "Obese";        color = "#FF3B30"; }
  return { value: Math.round(bmi * 10) / 10, category, color };
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setProfile(JSON.parse(stored));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const saveProfile = useCallback(async (p: UserProfile) => {
    setProfile(p);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {}
  }, []);

  const getInitials = useCallback((): string => {
    if (!profile?.name) return "?";
    const parts = profile.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [profile]);

  const getBMI = useCallback(
    (overrideWeight?: string, overrideHeight?: string): BMIResult | null => {
      const w = overrideWeight ?? profile?.weightKg ?? "";
      const h = overrideHeight ?? profile?.heightCm ?? "";
      return computeBMI(w, h);
    },
    [profile]
  );

  return (
    <UserContext.Provider
      value={{ profile, isOnboarded: !!profile, loading, saveProfile, getInitials, getBMI }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}
