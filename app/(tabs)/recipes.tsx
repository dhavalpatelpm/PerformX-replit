import React, { useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";

type Goal = "Strength" | "Endurance" | "Recovery" | "Mental Focus";
type DietType = "Pure Veg" | "Eggetarian" | "Non-Veg";
type Macro = { protein: number; carbs: number; fat: number; calories: number };

interface Recipe {
  id: string;
  name: string;
  goal: Goal;
  diet: DietType;
  prepTime: string;
  servings: number;
  difficulty: "Easy" | "Medium" | "Advanced";
  ingredients: string[];
  steps: string[];
  macros: Macro;
  tags: string[];
}

const GOALS: Goal[] = ["Strength", "Endurance", "Recovery", "Mental Focus"];
const DIET_TYPES: DietType[] = ["Pure Veg", "Eggetarian", "Non-Veg"];

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

const DIET_COLORS: Record<DietType, string> = {
  "Pure Veg": "#00C853",
  "Eggetarian": "#FFB300",
  "Non-Veg": "#FF3B30",
};

const DIET_ICONS: Record<DietType, string> = {
  "Pure Veg": "leaf-outline",
  "Eggetarian": "sunny-outline",
  "Non-Veg": "restaurant-outline",
};

const RECIPE_BANK: Recipe[] = [
  // ── PURE VEG ──────────────────────────────────────────────
  {
    id: "pv1",
    name: "Paneer Tikka Power Bowl",
    goal: "Strength",
    diet: "Pure Veg",
    prepTime: "20 min",
    servings: 2,
    difficulty: "Medium",
    ingredients: [
      "250g paneer, cubed",
      "1 cup quinoa or brown rice (cooked)",
      "1/2 cup green moong dal (boiled)",
      "1 tbsp hung curd",
      "1 tsp tandoori masala",
      "1 tsp ginger-garlic paste",
      "1 tbsp mustard oil",
      "Salt, chilli powder, chaat masala",
    ],
    steps: [
      "Marinate paneer cubes in hung curd, tandoori masala, ginger-garlic paste, chilli powder and salt for 15 min.",
      "Heat a grill pan with mustard oil over high heat. Sear paneer 2–3 min per side until charred.",
      "Layer cooked quinoa or rice in bowl, top with boiled moong dal.",
      "Place grilled paneer on top. Sprinkle chaat masala.",
      "Serve hot with mint chutney on the side.",
    ],
    macros: { protein: 38, carbs: 52, fat: 22, calories: 560 },
    tags: ["High Protein", "Post-Workout", "Anabolic"],
  },
  {
    id: "pv2",
    name: "Rajma Chawal Performance Plate",
    goal: "Endurance",
    diet: "Pure Veg",
    prepTime: "30 min",
    servings: 2,
    difficulty: "Easy",
    ingredients: [
      "1 cup red kidney beans (rajma), soaked & boiled",
      "1.5 cups brown rice (cooked)",
      "1 large onion, finely chopped",
      "2 tomatoes, pureed",
      "1 tsp cumin seeds",
      "1 tsp coriander powder",
      "1/2 tsp garam masala",
      "1 tbsp ghee, salt to taste",
    ],
    steps: [
      "Heat ghee in a heavy pan. Add cumin seeds and let splutter.",
      "Add onions, cook until golden brown. Add ginger-garlic paste and sauté 2 min.",
      "Add tomato puree, coriander powder and cook until oil separates.",
      "Add boiled rajma, 1 cup water, salt and garam masala. Simmer 15 min.",
      "Serve generously over brown rice for a complete carb-protein meal.",
    ],
    macros: { protein: 26, carbs: 88, fat: 8, calories: 540 },
    tags: ["Carb-Load", "Plant Protein", "Pre-Race"],
  },
  {
    id: "pv3",
    name: "Masala Oats Pre-Workout Bowl",
    goal: "Strength",
    diet: "Pure Veg",
    prepTime: "10 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "1 cup rolled oats",
      "1 tsp ghee",
      "1/2 tsp mustard seeds",
      "1 green chilli, slit",
      "Handful of mixed nuts (almonds, cashews)",
      "1/4 cup peanuts",
      "Fresh coriander, salt, lemon juice",
    ],
    steps: [
      "Heat ghee in a non-stick pan. Add mustard seeds and green chilli.",
      "Add oats and roast on medium heat for 3–4 min until golden and fragrant.",
      "Add 2 cups hot water, salt and cook until oats absorb liquid.",
      "Top with mixed nuts and peanuts for extra protein and healthy fat.",
      "Finish with lemon juice and fresh coriander. Eat 45 min before training.",
    ],
    macros: { protein: 18, carbs: 60, fat: 16, calories: 460 },
    tags: ["Pre-Workout", "Slow-Release", "Satiety"],
  },
  {
    id: "pv4",
    name: "Haldi Banana Recovery Lassi",
    goal: "Recovery",
    diet: "Pure Veg",
    prepTime: "5 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "1 ripe banana",
      "300ml full-fat curd (dahi)",
      "1 tsp turmeric powder",
      "1/2 tsp black pepper",
      "1 tbsp honey or jaggery",
      "Pinch of cardamom",
      "5–6 soaked almonds, blended",
    ],
    steps: [
      "Add all ingredients to a blender.",
      "Blend on high for 60 seconds until completely smooth.",
      "Pour into a tall glass. Sprinkle pinch of cardamom on top.",
      "Drink within 30 min of completing your training session.",
      "The curcumin in turmeric and protein in curd support muscle recovery.",
    ],
    macros: { protein: 16, carbs: 56, fat: 8, calories: 360 },
    tags: ["Anti-Inflammatory", "Gut Health", "Fast Prep"],
  },
  {
    id: "pv5",
    name: "Sprouted Moong Chilla",
    goal: "Mental Focus",
    diet: "Pure Veg",
    prepTime: "15 min",
    servings: 2,
    difficulty: "Easy",
    ingredients: [
      "1 cup sprouted moong dal",
      "2 tbsp besan (gram flour)",
      "1 inch ginger, grated",
      "Handful spinach, finely chopped",
      "1 green chilli",
      "1 tsp cumin, salt to taste",
      "Ghee for cooking",
    ],
    steps: [
      "Grind sprouted moong with ginger, green chilli and a splash of water into a coarse batter.",
      "Add besan, chopped spinach, cumin and salt. Mix well. Rest 5 min.",
      "Heat a flat tawa, grease with ghee. Pour batter and spread thin.",
      "Cook 2–3 min per side on medium heat until golden.",
      "Serve with green chutney. The amino acids in sprouted dal support cognitive function.",
    ],
    macros: { protein: 22, carbs: 38, fat: 9, calories: 330 },
    tags: ["Brain Food", "Gut Health", "Amino Acids"],
  },

  // ── EGGETARIAN ────────────────────────────────────────────
  {
    id: "eg1",
    name: "Egg Bhurji Multigrain Bowl",
    goal: "Strength",
    diet: "Eggetarian",
    prepTime: "15 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "4 whole eggs",
      "1 medium onion, finely chopped",
      "2 tomatoes, chopped",
      "1 green chilli, chopped",
      "1 tsp cumin seeds",
      "1/2 tsp turmeric, 1 tsp coriander powder",
      "1 tbsp ghee or butter",
      "2 multigrain rotis or 1 cup cooked millets",
    ],
    steps: [
      "Heat ghee in a pan over medium heat. Add cumin seeds and let splutter.",
      "Add onions and green chilli. Cook until soft and translucent (4–5 min).",
      "Add tomatoes, turmeric and coriander powder. Cook until tomatoes break down.",
      "Beat eggs and pour into the pan. Keep stirring on medium-low heat until soft curds form.",
      "Serve hot with multigrain rotis or over cooked millets for a high-protein meal.",
    ],
    macros: { protein: 30, carbs: 44, fat: 20, calories: 480 },
    tags: ["High Protein", "Post-Workout", "Anabolic"],
  },
  {
    id: "eg2",
    name: "Masala Omelette Sprout Wrap",
    goal: "Mental Focus",
    diet: "Eggetarian",
    prepTime: "15 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "3 whole eggs",
      "1/2 cup mixed sprouts (moong, chana)",
      "Handful spinach",
      "1/4 bell pepper, diced",
      "1/2 tsp garam masala, chilli flakes",
      "1 tsp olive oil or ghee",
      "2 whole wheat rotis",
      "Green chutney",
    ],
    steps: [
      "Beat eggs with garam masala, chilli flakes and salt.",
      "Heat oil in pan, lightly sauté bell pepper for 2 min. Add sprouts and spinach.",
      "Pour beaten eggs over vegetables. Cook on medium heat until set, fold in half.",
      "Warm rotis on a tawa for 30 seconds each.",
      "Place omelette on roti, top with chutney and sprouts. Roll tightly and serve.",
    ],
    macros: { protein: 26, carbs: 40, fat: 15, calories: 400 },
    tags: ["Brain Food", "Iron Rich", "Balanced"],
  },
  {
    id: "eg3",
    name: "Egg & Moong Dal Khichdi",
    goal: "Recovery",
    diet: "Eggetarian",
    prepTime: "25 min",
    servings: 2,
    difficulty: "Easy",
    ingredients: [
      "1/2 cup yellow moong dal",
      "1/2 cup white rice",
      "3 eggs",
      "1 tsp cumin seeds",
      "1/4 tsp turmeric",
      "1 tbsp ghee",
      "Salt, pinch of asafoetida (hing)",
      "Fresh coriander to garnish",
    ],
    steps: [
      "Pressure cook moong dal and rice together with 3 cups water, turmeric and salt for 3 whistles.",
      "In a separate pan, soft-boil or poach eggs for 6 min. Set aside.",
      "Prepare tadka: heat ghee, add cumin and hing. Let splutter.",
      "Pour tadka over khichdi and mash lightly to desired consistency.",
      "Halve the eggs and place on khichdi. Garnish with coriander. Eat warm for optimal gut recovery.",
    ],
    macros: { protein: 32, carbs: 70, fat: 12, calories: 520 },
    tags: ["Gut Recovery", "Electrolytes", "Post-Workout"],
  },
  {
    id: "eg4",
    name: "Boiled Egg & Millet Salad",
    goal: "Endurance",
    diet: "Eggetarian",
    prepTime: "18 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "3 hard-boiled eggs",
      "3/4 cup cooked foxtail millet (kangni)",
      "1 cucumber, diced",
      "1 tomato, diced",
      "Handful mint + coriander leaves",
      "1 tbsp lemon juice",
      "1 tsp chaat masala, salt",
    ],
    steps: [
      "Cook foxtail millet in 1.5x water for 12 min until fluffy. Cool slightly.",
      "Peel and halve the boiled eggs.",
      "In a large bowl, combine millet, cucumber, tomato and fresh herbs.",
      "Dress with lemon juice, chaat masala and salt. Toss well.",
      "Top with halved eggs. Consume 2 hours before training for sustained energy.",
    ],
    macros: { protein: 28, carbs: 58, fat: 14, calories: 470 },
    tags: ["Carb-Load", "Pre-Race", "Gluten Free"],
  },

  // ── NON-VEG ───────────────────────────────────────────────
  {
    id: "nv1",
    name: "Tandoori Chicken Power Plate",
    goal: "Strength",
    diet: "Non-Veg",
    prepTime: "30 min",
    servings: 2,
    difficulty: "Medium",
    ingredients: [
      "400g boneless chicken thighs",
      "3 tbsp hung curd",
      "1 tbsp ginger-garlic paste",
      "1.5 tsp tandoori masala",
      "1 tsp Kashmiri chilli powder",
      "1 tbsp mustard oil",
      "Juice of 1 lemon",
      "3 multigrain rotis, sliced onion rings",
    ],
    steps: [
      "Score chicken thighs with deep cuts. Mix curd, ginger-garlic paste, spices, oil and lemon juice.",
      "Coat chicken thoroughly and marinate minimum 2 hours (overnight is ideal).",
      "Grill on high heat or in oven at 220°C for 18–22 min, flipping halfway.",
      "Rest 5 min before slicing. Serve on warm rotis with raw onion rings and mint chutney.",
      "This meal delivers the highest protein-per-calorie ratio for muscle synthesis.",
    ],
    macros: { protein: 56, carbs: 42, fat: 14, calories: 530 },
    tags: ["High Protein", "Anabolic", "Post-Workout"],
  },
  {
    id: "nv2",
    name: "Chicken Keema Brown Rice Bowl",
    goal: "Endurance",
    diet: "Non-Veg",
    prepTime: "30 min",
    servings: 2,
    difficulty: "Medium",
    ingredients: [
      "300g chicken mince (keema)",
      "1.5 cups brown rice (cooked)",
      "1 large onion, finely chopped",
      "2 tomatoes, pureed",
      "1 tsp each: cumin, coriander, garam masala",
      "1/2 tsp turmeric",
      "1 tbsp olive oil",
      "Salt and fresh coriander",
    ],
    steps: [
      "Heat oil in a wok. Add onions and cook until deep golden (8 min).",
      "Add ginger-garlic paste and sauté. Add tomato puree, all spices and cook until oil separates.",
      "Add chicken mince, breaking lumps. Cook on high heat for 12–15 min until cooked through.",
      "Adjust salt. If dry, add splash of water and simmer 3 min.",
      "Serve generous portions over brown rice. Great carb-protein balance for endurance athletes.",
    ],
    macros: { protein: 50, carbs: 80, fat: 16, calories: 660 },
    tags: ["Carb-Load", "Lean Protein", "Pre-Race"],
  },
  {
    id: "nv3",
    name: "Rohu Fish Curry & Millets",
    goal: "Recovery",
    diet: "Non-Veg",
    prepTime: "25 min",
    servings: 2,
    difficulty: "Medium",
    ingredients: [
      "350g rohu or catla fish fillets",
      "1 cup barnyard millet (cooked)",
      "1 tbsp mustard oil",
      "1 tsp panch phoron",
      "2 tomatoes, 1 onion, chopped",
      "1/2 tsp each: turmeric, cumin, coriander",
      "Fresh curry leaves, salt",
    ],
    steps: [
      "Rub fish with turmeric and salt. Shallow fry in mustard oil 3 min per side. Set aside.",
      "In same pan, add panch phoron and curry leaves. Let splutter.",
      "Add onion and cook until soft. Add tomatoes and all spices, cook 5 min.",
      "Gently slide fish back in. Add 1/2 cup water, simmer 8 min on low heat.",
      "Serve over warm cooked millets. Omega-3 from fish accelerates muscle inflammation recovery.",
    ],
    macros: { protein: 44, carbs: 66, fat: 12, calories: 560 },
    tags: ["Omega-3", "Anti-Inflammatory", "Gut Health"],
  },
  {
    id: "nv4",
    name: "Mutton Bone Broth Collagen Soup",
    goal: "Recovery",
    diet: "Non-Veg",
    prepTime: "60 min",
    servings: 3,
    difficulty: "Advanced",
    ingredients: [
      "500g mutton bones with marrow",
      "2 inch fresh ginger, sliced",
      "6 garlic cloves, halved",
      "2 tsp black pepper, 1 tsp turmeric",
      "2 bay leaves, 2 cardamom pods",
      "1 tbsp apple cider vinegar",
      "Salt and fresh coriander",
    ],
    steps: [
      "Blanch bones in boiling water for 5 min. Discard water and rinse bones.",
      "Add bones to pressure cooker with all spices, garlic and ginger. Cover with 1.5 litres water.",
      "Add apple cider vinegar (helps extract collagen). Pressure cook 45 min on low.",
      "Strain broth. Discard solids. Season with salt.",
      "Drink a cup post-workout. Collagen, glycine and gelatin from marrow repair joints and connective tissue.",
    ],
    macros: { protein: 26, carbs: 4, fat: 8, calories: 190 },
    tags: ["Collagen", "Joint Recovery", "Anti-Inflammatory"],
  },
  {
    id: "nv5",
    name: "Grilled Chicken Sprout Salad",
    goal: "Mental Focus",
    diet: "Non-Veg",
    prepTime: "20 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "200g chicken breast, grilled",
      "1/2 cup mixed sprouts",
      "Handful spinach + rocket leaves",
      "1/4 cup walnuts, roughly broken",
      "1/4 avocado, sliced (optional)",
      "1 tbsp olive oil",
      "Lemon juice, salt, black pepper, chaat masala",
    ],
    steps: [
      "Season chicken breast with salt, pepper and grill 6–7 min per side. Slice thin.",
      "Toss spinach, rocket and sprouts in a large bowl.",
      "Add walnuts and avocado if using.",
      "Dress with olive oil, lemon juice, chaat masala. Toss lightly.",
      "Top with sliced chicken. The omega-3 from walnuts + lean protein boosts dopamine and focus.",
    ],
    macros: { protein: 42, carbs: 20, fat: 22, calories: 440 },
    tags: ["Brain Food", "Keto-Friendly", "Nootropic"],
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
  const dietColor = DIET_COLORS[recipe.diet];

  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={({ pressed }) => [rcStyles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 }]}
    >
      <LinearGradient
        colors={[goalColor + "28", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={rcStyles.cardGradient}
      />
      <View style={rcStyles.cardTop}>
        <View style={rcStyles.pillRow}>
          <View style={[rcStyles.dietDot, { backgroundColor: dietColor }]} />
          <View style={[rcStyles.goalPill, { backgroundColor: goalColor + "20", borderColor: goalColor + "40" }]}>
            <Ionicons name={GOAL_ICONS[recipe.goal] as any} size={12} color={goalColor} />
            <Text style={[rcStyles.goalText, { color: goalColor, fontFamily: "Outfit_600SemiBold" }]}>
              {recipe.goal}
            </Text>
          </View>
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
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  pillRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dietDot: { width: 10, height: 10, borderRadius: 5 },
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
  const dietColor = DIET_COLORS[recipe.diet];
  const maxMacro = Math.max(recipe.macros.protein, recipe.macros.carbs, recipe.macros.fat);

  const handleShare = async () => {
    const msg = `${recipe.name} (${recipe.diet})\n\nGoal: ${recipe.goal} | ${recipe.prepTime}\n\nIngredients:\n${recipe.ingredients.map(i => `• ${i}`).join("\n")}\n\nMacros: ${recipe.macros.protein}g protein, ${recipe.macros.carbs}g carbs, ${recipe.macros.fat}g fat, ${recipe.macros.calories} kcal\n\nGenerated with BioHack!`;
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
          <View style={rdStyles.pillRow}>
            <View style={[rdStyles.dietBadge, { backgroundColor: dietColor + "20", borderColor: dietColor + "50" }]}>
              <Ionicons name={DIET_ICONS[recipe.diet] as any} size={13} color={dietColor} />
              <Text style={[rdStyles.dietText, { color: dietColor, fontFamily: "Outfit_700Bold" }]}>{recipe.diet}</Text>
            </View>
            <View style={[rdStyles.goalPill, { backgroundColor: goalColor + "20", borderColor: goalColor + "40" }]}>
              <Ionicons name={GOAL_ICONS[recipe.goal] as any} size={13} color={goalColor} />
              <Text style={[rdStyles.goalText, { color: goalColor, fontFamily: "Outfit_600SemiBold" }]}>{recipe.goal}</Text>
            </View>
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
  pillRow: { flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" },
  dietBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  dietText: { fontSize: 12 },
  goalPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  goalText: { fontSize: 13 },
  title: { fontSize: 26, lineHeight: 32, marginBottom: 14 },
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
  const [selectedDiet, setSelectedDiet] = useState<DietType | "All">("All");
  const [selectedGoal, setSelectedGoal] = useState<Goal | "All">("All");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filtered = RECIPE_BANK.filter((r) => {
    const dietMatch = selectedDiet === "All" || r.diet === selectedDiet;
    const goalMatch = selectedGoal === "All" || r.goal === selectedGoal;
    return dietMatch && goalMatch;
  });

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
              Indian athlete nutrition, your way
            </Text>
          </View>
        </View>

        {/* Diet Preference Filter */}
        <Text style={[sStyles.filterLabel, { color: colors.textSecondary, fontFamily: "Outfit_600SemiBold" }]}>
          Dietary Preference
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={sStyles.filterRow}
        >
          {(["All", ...DIET_TYPES] as (DietType | "All")[]).map((diet) => {
            const active = selectedDiet === diet;
            const color = diet === "All" ? colors.tint : DIET_COLORS[diet];
            return (
              <Pressable
                key={diet}
                onPress={() => { setSelectedDiet(diet); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[
                  sStyles.filterChip,
                  { backgroundColor: active ? color : colors.card, borderColor: active ? color : colors.border },
                ]}
              >
                {diet !== "All" && (
                  <Ionicons
                    name={DIET_ICONS[diet] as any}
                    size={14}
                    color={active ? "#fff" : color}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text style={[sStyles.filterChipText, { color: active ? "#fff" : colors.textSecondary, fontFamily: "Outfit_700Bold" }]}>
                  {diet}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Goal Filter */}
        <Text style={[sStyles.filterLabel, { color: colors.textSecondary, fontFamily: "Outfit_600SemiBold", marginTop: 4 }]}>
          Training Goal
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={sStyles.filterRow}
        >
          {(["All", ...GOALS] as (Goal | "All")[]).map((goal) => {
            const active = selectedGoal === goal;
            const color = goal === "All" ? colors.tint : GOAL_COLORS[goal];
            return (
              <Pressable
                key={goal}
                onPress={() => { setSelectedGoal(goal); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[
                  sStyles.filterChip,
                  { backgroundColor: active ? color : colors.card, borderColor: active ? color : colors.border },
                ]}
              >
                {goal !== "All" && (
                  <Ionicons
                    name={GOAL_ICONS[goal] as any}
                    size={13}
                    color={active ? "#fff" : color}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text style={[sStyles.filterChipText, { color: active ? "#fff" : colors.textSecondary, fontFamily: "Outfit_600SemiBold" }]}>
                  {goal}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Diet legend */}
        <View style={[sStyles.legendCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {DIET_TYPES.map((d) => (
            <View key={d} style={sStyles.legendItem}>
              <View style={[sStyles.legendDot, { backgroundColor: DIET_COLORS[d] }]} />
              <Text style={[sStyles.legendText, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>{d}</Text>
            </View>
          ))}
        </View>

        {filtered.length === 0 ? (
          <View style={[sStyles.emptyState, { borderColor: colors.border }]}>
            <Ionicons name="restaurant-outline" size={48} color={colors.textMuted} />
            <Text style={[sStyles.emptyText, { color: colors.textMuted, fontFamily: "Outfit_500Medium" }]}>
              No recipes match your filters
            </Text>
            <Text style={[sStyles.emptyHint, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
              Try changing your dietary preference or goal
            </Text>
          </View>
        ) : (
          filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onPress={() => openRecipe(recipe)} />
          ))
        )}
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  title: { fontSize: 28 },
  subtitle: { fontSize: 14, marginTop: 2 },
  filterLabel: { fontSize: 12, letterSpacing: 0.6, marginBottom: 8, textTransform: "uppercase" },
  filterRow: { paddingBottom: 14, gap: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 13 },
  legendCard: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 12 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 20,
    gap: 10,
  },
  emptyText: { fontSize: 16 },
  emptyHint: { fontSize: 13 },
});
