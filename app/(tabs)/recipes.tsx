import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Share,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";

type Goal = "Strength" | "Endurance" | "Recovery" | "Mental Focus";
type Macro = { protein: number; carbs: number; fat: number; calories: number };

interface Recipe {
  id: string;
  name: string;
  goal: Goal;
  prepTime: string;
  servings: number;
  difficulty: "Easy" | "Medium" | "Advanced";
  ingredients: string[];
  steps: string[];
  macros: Macro;
  tags: string[];
}

const GOALS: Goal[] = ["Strength", "Endurance", "Recovery", "Mental Focus"];

const GOAL_COLORS: Record<Goal, string> = {
  Strength: "#FF6B35",
  Endurance: "#00B4D8",
  Recovery: "#00E676",
  "Mental Focus": "#B388FF",
};

const GOAL_ICONS: Record<Goal, string> = {
  Strength: "barbell-outline",
  Endurance: "bicycle-outline",
  Recovery: "bed-outline",
  "Mental Focus": "bulb-outline",
};

const RECIPE_BANK: Recipe[] = [
  {
    id: "r1",
    name: "Power Lifter's Protein Bowl",
    goal: "Strength",
    prepTime: "15 min",
    servings: 2,
    difficulty: "Easy",
    ingredients: [
      "200g grass-fed ground beef",
      "1 cup white rice (cooked)",
      "3 whole eggs",
      "1/2 avocado, sliced",
      "1 tbsp olive oil",
      "Salt, black pepper, garlic powder",
      "Sriracha sauce to taste",
    ],
    steps: [
      "Cook rice according to package, set aside.",
      "Heat olive oil in pan over high heat. Cook ground beef until browned, season with salt, pepper, and garlic powder.",
      "In same pan, scramble eggs until just set.",
      "Layer rice, beef, and eggs in bowl.",
      "Top with sliced avocado and sriracha.",
    ],
    macros: { protein: 52, carbs: 58, fat: 28, calories: 690 },
    tags: ["High Protein", "Post-Workout", "Anabolic"],
  },
  {
    id: "r2",
    name: "Rave Recovery Smoothie Bowl",
    goal: "Recovery",
    prepTime: "10 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "1 cup frozen mixed berries",
      "1 frozen banana",
      "200ml coconut milk",
      "1 scoop whey protein (vanilla)",
      "1 tbsp chia seeds",
      "1 tbsp almond butter",
      "Granola and fresh fruit to top",
    ],
    steps: [
      "Blend frozen berries, banana, coconut milk, and protein powder until thick and smooth.",
      "Pour into a chilled bowl.",
      "Top with granola, chia seeds, almond butter, and fresh fruit.",
      "Consume immediately for best texture.",
    ],
    macros: { protein: 38, carbs: 72, fat: 14, calories: 570 },
    tags: ["Anti-Inflammatory", "Electrolytes", "Fast"],
  },
  {
    id: "r3",
    name: "Athlete's Pre-Race Pasta",
    goal: "Endurance",
    prepTime: "20 min",
    servings: 2,
    difficulty: "Medium",
    ingredients: [
      "250g whole grain pasta",
      "150g salmon fillet",
      "2 garlic cloves, minced",
      "Handful spinach",
      "1 lemon (zest + juice)",
      "2 tbsp extra virgin olive oil",
      "Capers, salt, pepper",
    ],
    steps: [
      "Cook pasta al dente, reserve 1/2 cup pasta water.",
      "Season salmon with salt and pepper. Sear 4 min each side, flake apart.",
      "In same pan, sauté garlic in olive oil. Add spinach until wilted.",
      "Add pasta, salmon, lemon juice and zest. Toss with pasta water.",
      "Finish with capers and black pepper.",
    ],
    macros: { protein: 44, carbs: 92, fat: 18, calories: 710 },
    tags: ["Carb-Load", "Omega-3", "Pre-Race"],
  },
  {
    id: "r4",
    name: "Nootropic Brain Fuel Salad",
    goal: "Mental Focus",
    prepTime: "12 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "100g wild blueberries",
      "50g walnuts, roughly chopped",
      "2 cups arugula + spinach mix",
      "1 tbsp pumpkin seeds",
      "80g smoked salmon",
      "1 tbsp apple cider vinegar",
      "1 tbsp MCT oil or olive oil",
      "Pinch of sea salt",
    ],
    steps: [
      "Wash and dry greens, place in large bowl.",
      "Add blueberries, walnuts, pumpkin seeds, and smoked salmon.",
      "Whisk together MCT oil, apple cider vinegar, and sea salt.",
      "Drizzle dressing over salad and toss gently.",
      "Consume within 30 min for maximum cognitive benefit.",
    ],
    macros: { protein: 28, carbs: 32, fat: 36, calories: 560 },
    tags: ["Nootropic", "Keto-Friendly", "Brain Food"],
  },
  {
    id: "r5",
    name: "Anabolic Overnight Oats",
    goal: "Strength",
    prepTime: "5 min + overnight",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "100g rolled oats",
      "1 scoop casein protein (chocolate)",
      "200ml whole milk",
      "1 tbsp peanut butter",
      "1 banana, sliced",
      "1 tsp honey",
      "Pinch of cinnamon",
    ],
    steps: [
      "Mix oats, casein protein, and milk in a jar.",
      "Stir in peanut butter and honey.",
      "Top with banana slices and cinnamon.",
      "Seal jar and refrigerate overnight (8+ hours).",
      "Eat cold or microwave 90 seconds before consuming.",
    ],
    macros: { protein: 45, carbs: 88, fat: 16, calories: 680 },
    tags: ["Slow-Release", "Muscle Building", "Meal Prep"],
  },
  {
    id: "r6",
    name: "Electrolyte Beet & Ginger Shot",
    goal: "Endurance",
    prepTime: "8 min",
    servings: 2,
    difficulty: "Easy",
    ingredients: [
      "2 medium beets, peeled and chopped",
      "1 inch fresh ginger root",
      "2 carrots",
      "1 orange, peeled",
      "Pinch of sea salt",
      "1/4 tsp black pepper",
    ],
    steps: [
      "Add all ingredients to a juicer or high-speed blender.",
      "If blending, strain through fine mesh sieve.",
      "Add a pinch of sea salt for electrolytes.",
      "Drink 60–90 min before training for peak performance.",
    ],
    macros: { protein: 3, carbs: 28, fat: 0, calories: 120 },
    tags: ["Pre-Workout", "Nitric Oxide", "Natural Energy"],
  },
];

function MacroBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const { colors } = useTheme();
  const pct = Math.min(1, total > 0 ? value / total : 0);
  return (
    <View style={mbStyles.wrap}>
      <View style={mbStyles.labelRow}>
        <Text style={[mbStyles.label, { color: colors.textSecondary, fontFamily: "Outfit_500Medium" }]}>{label}</Text>
        <Text style={[mbStyles.value, { color: colors.text, fontFamily: "Outfit_700Bold" }]}>{value}g</Text>
      </View>
      <View style={[mbStyles.barBg, { backgroundColor: colors.border }]}>
        <View style={[mbStyles.barFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const mbStyles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  label: { fontSize: 12 },
  value: { fontSize: 12 },
  barBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
});

function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const { colors } = useTheme();
  const goalColor = GOAL_COLORS[recipe.goal];

  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={({ pressed }) => [rcStyles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 }]}
    >
      <LinearGradient
        colors={[goalColor + "30", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={rcStyles.cardGradient}
      />
      <View style={rcStyles.cardTop}>
        <View style={[rcStyles.goalPill, { backgroundColor: goalColor + "20", borderColor: goalColor + "40" }]}>
          <Ionicons name={GOAL_ICONS[recipe.goal] as any} size={12} color={goalColor} />
          <Text style={[rcStyles.goalText, { color: goalColor, fontFamily: "Outfit_600SemiBold" }]}>
            {recipe.goal}
          </Text>
        </View>
        <View style={[rcStyles.diffBadge, {
          backgroundColor: recipe.difficulty === "Easy" ? "#00E676" + "20" : recipe.difficulty === "Medium" ? "#FF6B35" + "20" : "#FF3B30" + "20"
        }]}>
          <Text style={[rcStyles.diffText, {
            color: recipe.difficulty === "Easy" ? "#00E676" : recipe.difficulty === "Medium" ? "#FF6B35" : "#FF3B30",
            fontFamily: "Outfit_600SemiBold"
          }]}>{recipe.difficulty}</Text>
        </View>
      </View>
      <Text style={[rcStyles.name, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>
        {recipe.name}
      </Text>
      <View style={rcStyles.metaRow}>
        <View style={rcStyles.meta}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={[rcStyles.metaText, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>
            {recipe.prepTime}
          </Text>
        </View>
        <View style={rcStyles.meta}>
          <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
          <Text style={[rcStyles.metaText, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>
            {recipe.servings} servings
          </Text>
        </View>
        <View style={rcStyles.meta}>
          <Ionicons name="flame-outline" size={14} color="#FF6B35" />
          <Text style={[rcStyles.metaText, { color: "#FF6B35", fontFamily: "Outfit_700Bold" }]}>
            {recipe.macros.calories} kcal
          </Text>
        </View>
      </View>
      <View style={rcStyles.tagsRow}>
        {recipe.tags.map((tag) => (
          <View key={tag} style={[rcStyles.tag, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
            <Text style={[rcStyles.tagText, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>
              {tag}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const rcStyles = StyleSheet.create({
  card: { borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, overflow: "hidden" },
  cardGradient: { ...StyleSheet.absoluteFillObject, borderRadius: 20 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  goalPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  goalText: { fontSize: 12 },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  diffText: { fontSize: 11 },
  name: { fontSize: 20, lineHeight: 26, marginBottom: 10 },
  metaRow: { flexDirection: "row", gap: 16, marginBottom: 10 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  tagText: { fontSize: 11 },
});

function RecipeDetailModal({ recipe, visible, onClose }: { recipe: Recipe | null; visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  if (!recipe) return null;
  const goalColor = GOAL_COLORS[recipe.goal];
  const maxMacro = Math.max(recipe.macros.protein, recipe.macros.carbs, recipe.macros.fat);

  const handleShare = async () => {
    const msg = `${recipe.name}\n\nGoal: ${recipe.goal} | ${recipe.prepTime}\n\nIngredients:\n${recipe.ingredients.map(i => `• ${i}`).join("\n")}\n\nMacros: ${recipe.macros.protein}g protein, ${recipe.macros.carbs}g carbs, ${recipe.macros.fat}g fat, ${recipe.macros.calories} kcal\n\nGenerated with BioHack!`;
    try { await Share.share({ message: msg }); } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[rdStyles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[goalColor + "40", colors.background]}
          style={rdStyles.headerGradient}
        />
        <View style={[rdStyles.header, { paddingTop: insets.top || 16 }]}>
          <Pressable onPress={onClose} style={[rdStyles.closeBtn, { backgroundColor: colors.card }]} hitSlop={12}>
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
          <Pressable onPress={handleShare} style={[rdStyles.shareBtn, { backgroundColor: goalColor }]} hitSlop={8}>
            <Ionicons name="share-social-outline" size={20} color="#fff" />
            <Text style={[rdStyles.shareBtnText, { fontFamily: "Outfit_600SemiBold" }]}>Share</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={[rdStyles.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
          <View style={[rdStyles.goalPill, { backgroundColor: goalColor + "20", borderColor: goalColor + "40" }]}>
            <Ionicons name={GOAL_ICONS[recipe.goal] as any} size={14} color={goalColor} />
            <Text style={[rdStyles.goalText, { color: goalColor, fontFamily: "Outfit_600SemiBold" }]}>{recipe.goal}</Text>
          </View>
          <Text style={[rdStyles.title, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>
            {recipe.name}
          </Text>
          <View style={rdStyles.metaRow}>
            {[
              { icon: "time-outline", text: recipe.prepTime, color: colors.textSecondary },
              { icon: "people-outline", text: `${recipe.servings} servings`, color: colors.textSecondary },
              { icon: "flame-outline", text: `${recipe.macros.calories} kcal`, color: "#FF6B35" },
            ].map((m, i) => (
              <View key={i} style={rdStyles.metaItem}>
                <Ionicons name={m.icon as any} size={16} color={m.color} />
                <Text style={[rdStyles.metaText, { color: m.color, fontFamily: "Outfit_500Medium" }]}>{m.text}</Text>
              </View>
            ))}
          </View>

          <View style={[rdStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[rdStyles.sectionTitle, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>
              Macros
            </Text>
            <View style={rdStyles.macroGrid}>
              {[
                { label: "PROTEIN", value: recipe.macros.protein, unit: "g", color: "#FF6B35" },
                { label: "CARBS", value: recipe.macros.carbs, unit: "g", color: "#00B4D8" },
                { label: "FAT", value: recipe.macros.fat, unit: "g", color: "#B388FF" },
              ].map((m) => (
                <View key={m.label} style={[rdStyles.macroBox, { backgroundColor: m.color + "15", borderColor: m.color + "30" }]}>
                  <Text style={[rdStyles.macroValue, { color: m.color, fontFamily: "Outfit_800ExtraBold" }]}>{m.value}</Text>
                  <Text style={[rdStyles.macroUnit, { color: m.color + "CC", fontFamily: "Outfit_500Medium" }]}>{m.unit}</Text>
                  <Text style={[rdStyles.macroLabel, { color: m.color + "99", fontFamily: "Outfit_600SemiBold" }]}>{m.label}</Text>
                </View>
              ))}
            </View>
            <MacroBar label="Protein" value={recipe.macros.protein} total={maxMacro} color="#FF6B35" />
            <MacroBar label="Carbs" value={recipe.macros.carbs} total={maxMacro} color="#00B4D8" />
            <MacroBar label="Fat" value={recipe.macros.fat} total={maxMacro} color="#B388FF" />
          </View>

          <View style={[rdStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[rdStyles.sectionTitle, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>
              Ingredients
            </Text>
            {recipe.ingredients.map((ing, i) => (
              <View key={i} style={rdStyles.ingRow}>
                <View style={[rdStyles.ingDot, { backgroundColor: goalColor }]} />
                <Text style={[rdStyles.ingText, { color: colors.text, fontFamily: "Outfit_400Regular" }]}>{ing}</Text>
              </View>
            ))}
          </View>

          <View style={[rdStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[rdStyles.sectionTitle, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>
              Preparation
            </Text>
            {recipe.steps.map((step, i) => (
              <View key={i} style={rdStyles.stepRow}>
                <View style={[rdStyles.stepNum, { backgroundColor: goalColor }]}>
                  <Text style={[rdStyles.stepNumText, { fontFamily: "Outfit_800ExtraBold" }]}>{i + 1}</Text>
                </View>
                <Text style={[rdStyles.stepText, { color: colors.text, fontFamily: "Outfit_400Regular" }]}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={rdStyles.tagsRow}>
            {recipe.tags.map((tag) => (
              <View key={tag} style={[rdStyles.tag, { backgroundColor: goalColor + "20", borderColor: goalColor + "40" }]}>
                <Text style={[rdStyles.tagText, { color: goalColor, fontFamily: "Outfit_600SemiBold" }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const rdStyles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 180 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  shareBtnText: { color: "#fff", fontSize: 14 },
  scroll: { paddingHorizontal: 20 },
  goalPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, alignSelf: "flex-start", marginBottom: 10 },
  goalText: { fontSize: 13 },
  title: { fontSize: 28, lineHeight: 34, marginBottom: 14 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 20 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 14 },
  section: { borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1 },
  sectionTitle: { fontSize: 18, marginBottom: 14 },
  macroGrid: { flexDirection: "row", gap: 10, marginBottom: 16 },
  macroBox: { flex: 1, borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1 },
  macroValue: { fontSize: 28 },
  macroUnit: { fontSize: 12, marginTop: -2 },
  macroLabel: { fontSize: 10, marginTop: 2, letterSpacing: 0.5 },
  ingRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  ingDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  ingText: { flex: 1, fontSize: 15, lineHeight: 22 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  stepNum: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepNumText: { color: "#fff", fontSize: 13 },
  stepText: { flex: 1, fontSize: 15, lineHeight: 22 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  tagText: { fontSize: 13 },
});

export default function RecipesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;
  const [selectedGoal, setSelectedGoal] = useState<Goal | "All">("All");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filtered = selectedGoal === "All"
    ? RECIPE_BANK
    : RECIPE_BANK.filter((r) => r.goal === selectedGoal);

  const openRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setModalVisible(true);
  };

  return (
    <View style={[sStyles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[sStyles.scroll, { paddingTop: topPad + 12, paddingBottom: botPad + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={sStyles.header}>
          <View>
            <Text style={[sStyles.title, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>
              Fuel Up
            </Text>
            <Text style={[sStyles.subtitle, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>
              Performance nutrition for athletes
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={sStyles.goalRow}
        >
          {(["All", ...GOALS] as (Goal | "All")[]).map((goal) => {
            const active = selectedGoal === goal;
            const color = goal === "All" ? colors.tint : GOAL_COLORS[goal];
            return (
              <Pressable
                key={goal}
                onPress={() => { setSelectedGoal(goal); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[
                  sStyles.goalChip,
                  { backgroundColor: active ? color : colors.card, borderColor: active ? color : colors.border },
                ]}
              >
                {goal !== "All" && (
                  <Ionicons
                    name={GOAL_ICONS[goal] as any}
                    size={14}
                    color={active ? "#fff" : color}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text style={[sStyles.goalChipText, { color: active ? "#fff" : colors.textSecondary, fontFamily: "Outfit_600SemiBold" }]}>
                  {goal}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={[sStyles.tipCard, { backgroundColor: colors.card, borderColor: colors.tint + "40" }]}>
          <Ionicons name="flash" size={20} color={colors.tint} />
          <Text style={[sStyles.tipText, { color: colors.text, fontFamily: "Outfit_500Medium" }]}>
            Tap any recipe to see full macros, ingredients and step-by-step prep — then share it.
          </Text>
        </View>

        {filtered.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} onPress={() => openRecipe(recipe)} />
        ))}
      </ScrollView>

      <RecipeDetailModal
        recipe={selectedRecipe}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const sStyles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title: { fontSize: 28 },
  subtitle: { fontSize: 14, marginTop: 2 },
  goalRow: { paddingBottom: 16, gap: 8 },
  goalChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  goalChipText: { fontSize: 13 },
  tipCard: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
