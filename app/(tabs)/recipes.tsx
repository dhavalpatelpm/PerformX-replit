import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Share,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";

type Goal = "Strength" | "Endurance" | "Recovery" | "Mental Focus";
type DietType = "Pure Veg" | "Eggetarian" | "Non-Veg";
type MealType = "Breakfast" | "Brunch" | "Lunch" | "Pre-Workout" | "Post-Workout" | "Dinner";
type Macro = { protein: number; carbs: number; fat: number; calories: number };

const PREF_KEY = "@biohack_meal_pref";

interface MealPreference {
  name: string;
  diet: DietType | "";
  goals: Goal[];
  mealTimes: MealType[];
  restrictions: string;
  notes: string;
  savedAt: string;
}

interface Recipe {
  id: string;
  name: string;
  goal: Goal;
  diet: DietType;
  meal: MealType;
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
const MEAL_TYPES: MealType[] = ["Breakfast", "Brunch", "Lunch", "Pre-Workout", "Post-Workout", "Dinner"];

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
const MEAL_COLORS: Record<MealType, string> = {
  Breakfast: "#FF9500",
  Brunch: "#FF6B35",
  Lunch: "#00B4D8",
  "Pre-Workout": "#00E676",
  "Post-Workout": "#B388FF",
  Dinner: "#5E8BFF",
};
const MEAL_ICONS: Record<MealType, string> = {
  Breakfast: "sunny-outline",
  Brunch: "cafe-outline",
  Lunch: "restaurant-outline",
  "Pre-Workout": "flash-outline",
  "Post-Workout": "fitness-outline",
  Dinner: "moon-outline",
};

const RECIPE_BANK: Recipe[] = [
  // ══════════════════════════════════════════════
  //  BREAKFAST
  // ══════════════════════════════════════════════
  {
    id: "b1",
    name: "Savory Masala Oats with Nuts",
    goal: "Strength",
    diet: "Pure Veg",
    meal: "Breakfast",
    prepTime: "10 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "1 cup rolled oats",
      "1 tsp ghee",
      "1/2 tsp mustard seeds",
      "8–10 curry leaves",
      "1 green chilli, slit",
      "1/4 cup roasted peanuts",
      "2 tbsp mixed nuts (almonds, cashews)",
      "Salt, lemon juice, fresh coriander",
    ],
    steps: [
      "Heat ghee in a non-stick pan over medium heat. Add mustard seeds and curry leaves — let splutter.",
      "Add green chilli and oats. Roast on medium heat 3–4 min until oats turn golden.",
      "Pour in 1.5 cups hot water with salt. Stir and cook until oats absorb water (2–3 min).",
      "Fold in roasted peanuts and mixed nuts for crunch and healthy fat.",
      "Finish with lemon juice and fresh coriander. Best eaten 30–45 min before morning training.",
    ],
    macros: { protein: 18, carbs: 60, fat: 16, calories: 460 },
    tags: ["Pre-Workout Energy", "Slow-Release", "Gut Friendly"],
  },
  {
    id: "b2",
    name: "Sprouted Moong Chilla",
    goal: "Mental Focus",
    diet: "Pure Veg",
    meal: "Breakfast",
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
      "Ghee or oil for cooking",
    ],
    steps: [
      "Grind sprouted moong with ginger, green chilli and a splash of water into a coarse batter.",
      "Add besan, chopped spinach, cumin and salt. Mix well — rest 5 min.",
      "Heat a flat tawa, grease with ghee. Pour batter and spread into thin rounds.",
      "Cook 2–3 min per side on medium heat until golden and crisp at edges.",
      "Serve with green chutney. Sprouted amino acids support cognitive sharpness throughout the day.",
    ],
    macros: { protein: 22, carbs: 38, fat: 9, calories: 330 },
    tags: ["Brain Food", "Amino Acids", "Gut Health"],
  },
  {
    id: "b3",
    name: "Poha with Peanuts & Vegetables",
    goal: "Recovery",
    diet: "Pure Veg",
    meal: "Breakfast",
    prepTime: "10 min",
    servings: 2,
    difficulty: "Easy",
    ingredients: [
      "2 cups thick poha (flattened rice)",
      "1/4 cup roasted peanuts",
      "1 medium potato, diced small",
      "1 tsp mustard seeds, curry leaves",
      "1/2 tsp turmeric",
      "1 tbsp oil",
      "Salt, sugar (pinch), lemon juice",
    ],
    steps: [
      "Rinse poha in a sieve under cold water for 30 seconds. Drain — it should be soft but not mushy.",
      "Heat oil in pan, add mustard seeds and curry leaves. Add potato and cook until golden.",
      "Add turmeric and drained poha. Mix gently — do not break the flakes.",
      "Cook covered on low heat 3–4 min. Add peanuts, salt and a pinch of sugar.",
      "Finish with lemon juice. Light on the stomach, perfect for morning recovery days.",
    ],
    macros: { protein: 12, carbs: 56, fat: 10, calories: 360 },
    tags: ["Light Meal", "Easily Digestible", "Recovery Day"],
  },
  {
    id: "b4",
    name: "Egg Bhurji Multigrain Bowl",
    goal: "Strength",
    diet: "Eggetarian",
    meal: "Breakfast",
    prepTime: "15 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "4 whole eggs",
      "1 onion, finely chopped",
      "2 tomatoes, chopped",
      "1 green chilli",
      "1 tsp cumin seeds",
      "1/2 tsp turmeric, 1 tsp coriander powder",
      "1 tbsp ghee",
      "2 multigrain rotis or cooked millets",
    ],
    steps: [
      "Heat ghee in a heavy pan. Add cumin seeds and let splutter.",
      "Add onions and green chilli — cook until translucent (4–5 min).",
      "Add tomatoes, turmeric and coriander powder. Cook until oil separates.",
      "Beat eggs lightly and pour in. Stir continuously on low-medium heat to form soft curds.",
      "Serve hot over millets or with warm multigrain rotis. High biological value protein for morning muscle priming.",
    ],
    macros: { protein: 30, carbs: 44, fat: 20, calories: 480 },
    tags: ["High Protein", "Anabolic", "Muscle Priming"],
  },
  {
    id: "b5",
    name: "Mini Veggie Egg Muffins",
    goal: "Mental Focus",
    diet: "Eggetarian",
    meal: "Breakfast",
    prepTime: "22 min",
    servings: 2,
    difficulty: "Easy",
    ingredients: [
      "6 whole eggs",
      "1/2 cup spinach, chopped",
      "1/4 cup bell pepper, diced",
      "1/4 cup onion, finely chopped",
      "2 tbsp paneer or cottage cheese, crumbled",
      "1/2 tsp Italian herbs or chat masala",
      "Salt, pepper to taste",
    ],
    steps: [
      "Preheat oven to 180°C. Grease a 6-cup muffin tin with oil or butter.",
      "Beat eggs well in a bowl. Add all vegetables, paneer and spices. Mix evenly.",
      "Pour the egg mixture into muffin cups — fill 3/4 full.",
      "Bake 18–20 min until muffins are set and lightly golden on top.",
      "Let cool 2 min before removing. Can be meal-prepped on Sunday for the entire week.",
    ],
    macros: { protein: 24, carbs: 12, fat: 16, calories: 290 },
    tags: ["Meal Prep", "Portable", "Brain Food"],
  },
  {
    id: "b6",
    name: "Chicken Keema Omelette",
    goal: "Strength",
    diet: "Non-Veg",
    meal: "Breakfast",
    prepTime: "15 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "3 whole eggs",
      "80g cooked chicken mince (keema)",
      "1/4 onion, finely chopped",
      "1/4 tsp garam masala",
      "1 green chilli, chopped",
      "1 tsp ghee or butter",
      "Salt, fresh coriander",
    ],
    steps: [
      "If using raw keema, cook first: sauté in a dry pan with onion, garam masala and salt for 8 min.",
      "Beat eggs with salt and a splash of water.",
      "Heat ghee in a flat pan on medium. Pour eggs in, spreading evenly.",
      "When eggs are 80% set, place cooked keema, onion and green chilli on one half.",
      "Fold omelette over the filling. Garnish with coriander. Highest protein-per-calorie breakfast on the list.",
    ],
    macros: { protein: 38, carbs: 8, fat: 18, calories: 350 },
    tags: ["Highest Protein", "Lean", "Keto-Friendly"],
  },

  // ══════════════════════════════════════════════
  //  BRUNCH
  // ══════════════════════════════════════════════
  {
    id: "br1",
    name: "Paneer Bhurji Multigrain Toast",
    goal: "Strength",
    diet: "Pure Veg",
    meal: "Brunch",
    prepTime: "15 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "150g paneer, crumbled",
      "1/4 onion, chopped finely",
      "1 small tomato, deseeded, diced",
      "1/2 tsp cumin, 1/4 tsp turmeric",
      "1 tsp ghee",
      "2 slices multigrain bread",
      "Green chutney and sliced cucumber to serve",
    ],
    steps: [
      "Heat ghee in a pan. Add cumin and let splutter. Add onions and sauté 3 min.",
      "Add tomatoes and cook until soft. Add turmeric and salt.",
      "Add crumbled paneer and mix well on high heat for 2 min — don't overcook.",
      "Toast multigrain bread until golden. Spread green chutney on bread.",
      "Pile paneer bhurji generously on toast. Top with sliced cucumber for freshness.",
    ],
    macros: { protein: 28, carbs: 38, fat: 18, calories: 430 },
    tags: ["High Protein", "Vegetarian Power", "Satiety"],
  },
  {
    id: "br2",
    name: "Masala Omelette Sprout Wrap",
    goal: "Mental Focus",
    diet: "Eggetarian",
    meal: "Brunch",
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
      "2 whole wheat rotis, green chutney",
    ],
    steps: [
      "Beat eggs with garam masala, chilli flakes and a pinch of salt.",
      "Heat oil in pan — sauté bell pepper 2 min, add sprouts and spinach until wilted.",
      "Pour beaten eggs over vegetables. Cook on medium heat until set — fold in half.",
      "Warm rotis on a dry tawa for 30 seconds each.",
      "Place omelette on roti with green chutney, sprouts on the side. Roll and wrap tightly.",
    ],
    macros: { protein: 26, carbs: 40, fat: 15, calories: 400 },
    tags: ["Brain Food", "Iron Rich", "Balanced"],
  },
  {
    id: "br3",
    name: "Chicken Tikka Multigrain Sandwich",
    goal: "Strength",
    diet: "Non-Veg",
    meal: "Brunch",
    prepTime: "15 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "150g grilled chicken tikka (pre-cooked or leftover)",
      "3 slices multigrain bread",
      "2 tbsp hung curd or Greek yogurt",
      "1 tsp mint chutney",
      "Lettuce, tomato slices, onion rings",
      "Chaat masala to sprinkle",
    ],
    steps: [
      "Slice grilled chicken tikka into thin strips. If using raw chicken, season with tandoori masala and grill 10 min.",
      "Mix hung curd with mint chutney — this is your spread.",
      "Toast multigrain bread slices lightly.",
      "Spread curd-chutney mix, layer lettuce, tomato, onion rings and chicken tikka.",
      "Sprinkle chaat masala. Close sandwich, press lightly and slice diagonally. High protein mid-morning fuel.",
    ],
    macros: { protein: 35, carbs: 42, fat: 12, calories: 420 },
    tags: ["High Protein", "Portable", "Mid-Day Fuel"],
  },
  {
    id: "br4",
    name: "Haldi Banana Recovery Lassi",
    goal: "Recovery",
    diet: "Pure Veg",
    meal: "Brunch",
    prepTime: "5 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "1 ripe banana",
      "300ml full-fat curd (dahi)",
      "1 tsp turmeric powder",
      "1/2 tsp black pepper (activates curcumin)",
      "1 tbsp honey or jaggery",
      "Pinch of cardamom",
      "5–6 soaked almonds",
    ],
    steps: [
      "Soak almonds in water overnight or for 30 min in warm water. Peel skin.",
      "Add banana, curd, turmeric, black pepper, honey, cardamom and almonds to blender.",
      "Blend on high for 60 seconds until completely smooth and creamy.",
      "Pour into a tall glass. Sprinkle a pinch of cardamom on top.",
      "Best consumed within 30 min of finishing training. Curcumin + black pepper significantly reduces DOMS.",
    ],
    macros: { protein: 16, carbs: 56, fat: 8, calories: 360 },
    tags: ["Anti-Inflammatory", "Curcumin", "DOMS Relief"],
  },

  // ══════════════════════════════════════════════
  //  LUNCH
  // ══════════════════════════════════════════════
  {
    id: "l1",
    name: "Rajma Chawal Performance Plate",
    goal: "Endurance",
    diet: "Pure Veg",
    meal: "Lunch",
    prepTime: "30 min",
    servings: 2,
    difficulty: "Easy",
    ingredients: [
      "1 cup red kidney beans (rajma), soaked overnight & boiled",
      "1.5 cups brown rice (cooked)",
      "1 large onion, finely chopped",
      "2 tomatoes, pureed",
      "1 tsp cumin seeds, 1/2 tsp garam masala",
      "1 tsp coriander powder",
      "1 tbsp ghee, salt to taste",
    ],
    steps: [
      "Heat ghee in a heavy-bottomed pan. Add cumin seeds and let splutter.",
      "Add onions and cook until deep golden — this takes a full 8 min on medium heat.",
      "Add ginger-garlic paste, then tomato puree and all spices. Cook until oil separates.",
      "Add boiled rajma, 1 cup water, salt. Simmer 15 min until thick and flavourful.",
      "Serve over brown rice. The complete amino acid profile (rice + rajma) is a pillar of endurance athlete nutrition.",
    ],
    macros: { protein: 26, carbs: 88, fat: 8, calories: 540 },
    tags: ["Carb-Load", "Plant Protein", "Pre-Race Prep"],
  },
  {
    id: "l2",
    name: "Curd Rice with Pomegranate & Walnuts",
    goal: "Recovery",
    diet: "Pure Veg",
    meal: "Lunch",
    prepTime: "10 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "1 cup cooked white rice (slightly warm)",
      "200ml full-fat curd (dahi)",
      "2 tbsp pomegranate arils",
      "1 tbsp walnuts, roughly crushed",
      "1 tsp oil, 1/2 tsp mustard seeds",
      "5–6 curry leaves, 1 green chilli",
      "Salt, fresh coriander",
    ],
    steps: [
      "Mix warm rice and curd until combined — add salt. Let rice absorb curd.",
      "Heat oil in small pan. Add mustard seeds, curry leaves and green chilli. Splutter 30 sec.",
      "Pour hot tadka over curd rice and mix gently.",
      "Top with pomegranate arils and crushed walnuts.",
      "The probiotic curd repairs gut microbiome post hard training days. Eat cool.",
    ],
    macros: { protein: 14, carbs: 62, fat: 10, calories: 400 },
    tags: ["Gut Recovery", "Probiotic", "Anti-Inflammatory"],
  },
  {
    id: "l3",
    name: "Palak Dal with Jowar Roti",
    goal: "Mental Focus",
    diet: "Pure Veg",
    meal: "Lunch",
    prepTime: "30 min",
    servings: 2,
    difficulty: "Medium",
    ingredients: [
      "1/2 cup yellow moong dal + 1/4 cup chana dal",
      "2 cups spinach (palak), blanched and pureed",
      "1 tsp ghee, cumin seeds",
      "1/2 tsp turmeric, 1 tsp coriander powder",
      "2 garlic cloves, minced",
      "4 jowar (sorghum) rotis",
      "Lemon juice, salt",
    ],
    steps: [
      "Pressure cook both dals together with turmeric for 3 whistles. Mash lightly.",
      "Blanch spinach in boiling water 1 min, drain, blend smooth.",
      "Add spinach puree to cooked dal. Stir over low heat 5 min.",
      "Prepare tadka: heat ghee, add cumin and garlic. Cook 1 min and pour over dal.",
      "Season with lemon and salt. Serve with jowar rotis — iron-rich, gluten-free and brain-optimising.",
    ],
    macros: { protein: 20, carbs: 58, fat: 8, calories: 390 },
    tags: ["Iron Rich", "Gluten Free", "Brain Food"],
  },
  {
    id: "l4",
    name: "Egg & Moong Dal Khichdi",
    goal: "Recovery",
    diet: "Eggetarian",
    meal: "Lunch",
    prepTime: "25 min",
    servings: 2,
    difficulty: "Easy",
    ingredients: [
      "1/2 cup yellow moong dal",
      "1/2 cup white rice",
      "3 whole eggs",
      "1 tsp cumin seeds",
      "1/4 tsp turmeric, pinch of asafoetida",
      "1 tbsp ghee, salt",
      "Fresh coriander to garnish",
    ],
    steps: [
      "Pressure cook moong dal and rice together with 3 cups water, turmeric and salt for 3 whistles.",
      "Soft-boil or poach eggs for 6 min in lightly simmering water. Peel or plate.",
      "Prepare tadka: heat ghee, add cumin and asafoetida — let splutter 30 sec.",
      "Pour tadka over khichdi and mash lightly to desired porridge consistency.",
      "Halve the eggs and place on top. Garnish with coriander. The most easily digested recovery meal in Indian cuisine.",
    ],
    macros: { protein: 32, carbs: 70, fat: 12, calories: 520 },
    tags: ["Gut Recovery", "Electrolytes", "Easy Digestion"],
  },
  {
    id: "l5",
    name: "Boiled Egg & Foxtail Millet Salad",
    goal: "Endurance",
    diet: "Eggetarian",
    meal: "Lunch",
    prepTime: "18 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "3 hard-boiled eggs",
      "3/4 cup cooked foxtail millet (kangni)",
      "1 cucumber, diced",
      "1 tomato, diced",
      "Handful mint and coriander leaves",
      "1 tbsp lemon juice",
      "1 tsp chaat masala, salt to taste",
    ],
    steps: [
      "Cook foxtail millet in 1.5x water for 12 min until fluffy. Spread to cool.",
      "Peel and halve the boiled eggs.",
      "In a large bowl, combine millet, cucumber, tomato and fresh herbs.",
      "Dress with lemon juice, chaat masala and salt. Toss well.",
      "Top with halved eggs. Consume 2 hours before an afternoon training session for sustained glycogen.",
    ],
    macros: { protein: 28, carbs: 58, fat: 14, calories: 470 },
    tags: ["Carb-Load", "Gluten Free", "Pre-Race"],
  },
  {
    id: "l6",
    name: "Grilled Chicken Sprout Salad",
    goal: "Mental Focus",
    diet: "Non-Veg",
    meal: "Lunch",
    prepTime: "20 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "200g chicken breast, grilled",
      "1/2 cup mixed sprouts",
      "Handful spinach + rocket leaves",
      "1/4 cup walnuts, roughly broken",
      "1 small avocado, sliced (optional)",
      "1 tbsp olive oil, lemon juice",
      "Salt, black pepper, chaat masala",
    ],
    steps: [
      "Season chicken breast with salt, pepper, and a touch of tandoori masala. Grill 6–7 min per side.",
      "Rest chicken 3 min before slicing thin against the grain.",
      "Toss spinach, rocket and sprouts in a large bowl.",
      "Add walnuts and avocado if using.",
      "Dress with olive oil, lemon juice and chaat masala. Top with chicken. Omega-3 from walnuts + lean protein boosts dopamine and sustained focus.",
    ],
    macros: { protein: 42, carbs: 20, fat: 22, calories: 440 },
    tags: ["Nootropic", "Keto-Friendly", "Omega-3"],
  },
  {
    id: "l7",
    name: "Rohu Fish Curry with Millets",
    goal: "Recovery",
    diet: "Non-Veg",
    meal: "Lunch",
    prepTime: "25 min",
    servings: 2,
    difficulty: "Medium",
    ingredients: [
      "350g rohu or catla fish fillets",
      "1 cup barnyard millet (cooked)",
      "1 tbsp mustard oil, 1 tsp panch phoron",
      "2 tomatoes, 1 onion, chopped",
      "1/2 tsp each turmeric, cumin, coriander",
      "Fresh curry leaves, salt",
    ],
    steps: [
      "Rub fish with turmeric and salt. Shallow-fry in mustard oil 3 min per side. Set aside.",
      "In same pan, add panch phoron and curry leaves — splutter 30 sec.",
      "Add onion and cook until soft. Add tomatoes and spices — cook 5 min until oil separates.",
      "Gently slide fish back in. Add 1/2 cup water, simmer 8 min on low heat.",
      "Serve over warm cooked millets. Omega-3 from rohu fish accelerates joint and muscle inflammation recovery.",
    ],
    macros: { protein: 44, carbs: 66, fat: 12, calories: 560 },
    tags: ["Omega-3", "Anti-Inflammatory", "Joint Health"],
  },

  // ══════════════════════════════════════════════
  //  PRE-WORKOUT
  // ══════════════════════════════════════════════
  {
    id: "pw1",
    name: "Peanut Butter Banana Power Smoothie",
    goal: "Endurance",
    diet: "Pure Veg",
    meal: "Pre-Workout",
    prepTime: "5 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "2 ripe bananas",
      "2 tbsp natural peanut butter",
      "250ml oat milk or full-fat milk",
      "1 tsp cocoa powder",
      "1 tsp honey or dates (2 pitted)",
      "Pinch of sea salt, ice cubes",
    ],
    steps: [
      "Add all ingredients to a blender.",
      "Blend on high 45–60 seconds until smooth and creamy.",
      "Taste and adjust sweetness with honey.",
      "Pour over ice and drink 60–75 min before training.",
      "The combination of fast carbs (banana) and sustained energy (peanut butter fat) keeps you fueled for the full session.",
    ],
    macros: { protein: 14, carbs: 52, fat: 16, calories: 410 },
    tags: ["Pre-Race", "Natural Energy", "Endurance Fuel"],
  },
  {
    id: "pw2",
    name: "Dry Fruit & Jaggery Energy Balls",
    goal: "Strength",
    diet: "Pure Veg",
    meal: "Pre-Workout",
    prepTime: "10 min",
    servings: 3,
    difficulty: "Easy",
    ingredients: [
      "10 Medjool dates, pitted",
      "1/4 cup almonds",
      "1/4 cup cashews",
      "2 tbsp peanut butter",
      "1 tsp sesame seeds (til)",
      "1 tbsp desiccated coconut",
      "Pinch of cardamom",
    ],
    steps: [
      "Blend dates in a food processor until they form a sticky paste.",
      "Add almonds and cashews — pulse to a rough crumble (don't over-blend).",
      "Add peanut butter, sesame and cardamom. Mix thoroughly.",
      "Roll into 6 equal balls using slightly wet hands. Coat in desiccated coconut.",
      "Refrigerate 20 min to firm up. Eat 2 balls 45 min before training. Store in fridge up to 5 days.",
    ],
    macros: { protein: 10, carbs: 48, fat: 18, calories: 390 },
    tags: ["Natural Energy", "Meal Prep", "No Added Sugar"],
  },
  {
    id: "pw3",
    name: "Spiced Buttermilk with Chia Seeds",
    goal: "Endurance",
    diet: "Pure Veg",
    meal: "Pre-Workout",
    prepTime: "5 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "300ml cold buttermilk (chhaas)",
      "1 tbsp chia seeds",
      "1/2 tsp roasted cumin powder",
      "1/4 tsp black salt (kala namak)",
      "Pinch of ginger powder",
      "Fresh mint leaves",
    ],
    steps: [
      "Soak chia seeds in 4 tbsp water for 5 min — they will gel.",
      "Mix buttermilk with cumin powder, black salt and ginger powder.",
      "Add soaked chia seeds and stir.",
      "Garnish with mint leaves.",
      "Drink 45 min before training. Electrolytes from black salt + hydration from buttermilk prevent early cramping.",
    ],
    macros: { protein: 6, carbs: 14, fat: 4, calories: 120 },
    tags: ["Electrolytes", "Hydration", "Pre-Run"],
  },
  {
    id: "pw4",
    name: "Banana & Oat Pre-Lift Bar",
    goal: "Strength",
    diet: "Eggetarian",
    meal: "Pre-Workout",
    prepTime: "15 min",
    servings: 2,
    difficulty: "Easy",
    ingredients: [
      "1 cup rolled oats",
      "2 ripe bananas, mashed",
      "1 egg white",
      "2 tbsp peanut butter",
      "1 tsp honey",
      "1/4 tsp cinnamon",
      "Handful dark chocolate chips or raisins",
    ],
    steps: [
      "Preheat oven to 180°C. Line a small baking tray with parchment.",
      "Mix mashed banana, egg white, peanut butter and honey until smooth.",
      "Fold in oats, cinnamon and chocolate chips.",
      "Spread mixture on tray about 1.5cm thick. Bake 18–20 min until golden.",
      "Cool and slice into bars. Eat 1 bar 45 min before your heaviest lifting session.",
    ],
    macros: { protein: 16, carbs: 58, fat: 12, calories: 410 },
    tags: ["Natural Energy", "Pre-Lift", "Slow-Release"],
  },

  // ══════════════════════════════════════════════
  //  POST-WORKOUT
  // ══════════════════════════════════════════════
  {
    id: "po1",
    name: "Paneer Tikka Power Bowl",
    goal: "Strength",
    diet: "Pure Veg",
    meal: "Post-Workout",
    prepTime: "20 min",
    servings: 2,
    difficulty: "Medium",
    ingredients: [
      "250g paneer, cubed",
      "1 cup quinoa or brown rice (cooked)",
      "1/2 cup green moong dal (boiled)",
      "1 tbsp hung curd, 1 tsp tandoori masala",
      "1 tsp ginger-garlic paste",
      "1 tbsp mustard oil",
      "Salt, chilli powder, chaat masala",
    ],
    steps: [
      "Marinate paneer in hung curd, tandoori masala, ginger-garlic paste, chilli and salt for 15 min.",
      "Heat a grill pan with mustard oil on high. Sear paneer 2–3 min per side until charred.",
      "Layer cooked quinoa or rice in bowl, top with boiled moong dal.",
      "Place grilled paneer on top and sprinkle chaat masala generously.",
      "Consume within 45 min post-training. The leucine content in paneer maximally stimulates muscle protein synthesis.",
    ],
    macros: { protein: 38, carbs: 52, fat: 22, calories: 560 },
    tags: ["High Protein", "Post-Workout", "Muscle Synthesis"],
  },
  {
    id: "po2",
    name: "Egg White & Oat Recovery Shake",
    goal: "Strength",
    diet: "Eggetarian",
    meal: "Post-Workout",
    prepTime: "5 min",
    servings: 1,
    difficulty: "Easy",
    ingredients: [
      "5 pasteurised egg whites",
      "1/2 cup rolled oats",
      "1 banana",
      "250ml full-fat milk",
      "1 tbsp honey",
      "Pinch of cinnamon",
    ],
    steps: [
      "Add all ingredients to a blender — use pasteurised egg whites (safe to consume raw).",
      "Blend on high for 60 seconds until completely smooth.",
      "If too thick, add 50ml cold water and blend again.",
      "Consume within 30 min of finishing your session.",
      "This shake delivers 30g of fast-absorbing protein and 42g of glycogen-restoring carbs at the critical anabolic window.",
    ],
    macros: { protein: 30, carbs: 42, fat: 6, calories: 345 },
    tags: ["Anabolic Window", "Fast Absorbing", "Muscle Repair"],
  },
  {
    id: "po3",
    name: "Chicken Keema Brown Rice Bowl",
    goal: "Endurance",
    diet: "Non-Veg",
    meal: "Post-Workout",
    prepTime: "30 min",
    servings: 2,
    difficulty: "Medium",
    ingredients: [
      "300g chicken mince (keema)",
      "1.5 cups brown rice (cooked)",
      "1 large onion, finely chopped",
      "2 tomatoes, pureed",
      "1 tsp each cumin, coriander, garam masala",
      "1/2 tsp turmeric",
      "1 tbsp olive oil, salt, fresh coriander",
    ],
    steps: [
      "Heat oil in a wok. Add onions and cook until deep golden (8 min).",
      "Add ginger-garlic paste, then tomato puree and all spices. Cook until oil separates.",
      "Add chicken mince, breaking lumps. Cook on high heat 12–15 min until completely done.",
      "Adjust salt, add splash of water if dry, simmer 3 more min.",
      "Serve over brown rice. The 50g protein + 80g complex carb ratio is optimal for endurance glycogen replenishment.",
    ],
    macros: { protein: 50, carbs: 80, fat: 16, calories: 660 },
    tags: ["Glycogen Replenishment", "Lean Protein", "Post-Endurance"],
  },
  {
    id: "po4",
    name: "Mutton Bone Broth Collagen Soup",
    goal: "Recovery",
    diet: "Non-Veg",
    meal: "Post-Workout",
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
      "Blanch bones in boiling water 5 min. Discard water and rinse bones thoroughly.",
      "Add bones to pressure cooker with all spices, garlic and ginger. Cover with 1.5 litres water.",
      "Add apple cider vinegar — helps extract collagen from bones.",
      "Pressure cook 45 min on low. Strain broth and discard solids.",
      "Season with salt. Drink 1 cup immediately post-workout. Collagen, glycine and gelatin directly repair tendons and joint cartilage.",
    ],
    macros: { protein: 26, carbs: 4, fat: 8, calories: 190 },
    tags: ["Collagen", "Joint Repair", "Anti-Inflammatory"],
  },

  // ══════════════════════════════════════════════
  //  DINNER
  // ══════════════════════════════════════════════
  {
    id: "d1",
    name: "Palak Paneer with Bajra Roti",
    goal: "Strength",
    diet: "Pure Veg",
    meal: "Dinner",
    prepTime: "30 min",
    servings: 2,
    difficulty: "Medium",
    ingredients: [
      "250g paneer, cubed",
      "300g spinach (palak), blanched",
      "1 onion, 2 tomatoes, 2 garlic cloves",
      "1 tsp each cumin, coriander powder",
      "1/2 tsp garam masala",
      "1 tbsp ghee",
      "4 bajra (pearl millet) rotis",
    ],
    steps: [
      "Blanch spinach in boiling water 1 min. Drain and blend to smooth puree.",
      "Heat ghee — sauté onions, garlic until golden. Add tomatoes and all spices.",
      "Cook masala until oil separates. Add spinach puree and simmer 8 min.",
      "Add paneer cubes and cook gently 5 min — paneer will absorb the flavour.",
      "Serve with warm bajra rotis. Perfect dinner: slow-release carbs + casein-rich paneer protein for overnight muscle repair.",
    ],
    macros: { protein: 32, carbs: 58, fat: 18, calories: 530 },
    tags: ["Overnight Recovery", "High Protein", "Iron Rich"],
  },
  {
    id: "d2",
    name: "Dal Tadka with Brown Rice",
    goal: "Recovery",
    diet: "Pure Veg",
    meal: "Dinner",
    prepTime: "30 min",
    servings: 2,
    difficulty: "Easy",
    ingredients: [
      "1 cup toor dal (pigeon pea)",
      "1.5 cups brown rice (cooked)",
      "2 tomatoes, 1 onion, chopped",
      "1 tbsp ghee",
      "1 tsp cumin seeds, 2 dried red chillies",
      "1/2 tsp turmeric, 1 tsp coriander powder",
      "Lemon juice, fresh coriander",
    ],
    steps: [
      "Pressure cook toor dal with tomatoes and turmeric for 4 whistles. Mash lightly.",
      "Prepare tadka: heat ghee until almost smoking. Add cumin, red chillies and onions.",
      "Cook onions until golden. Add coriander powder, stir 30 sec and pour over dal.",
      "Squeeze lemon juice and stir. Add water if too thick — dal should be pourable.",
      "Serve with brown rice. A perfect wind-down dinner: gut-friendly, complete protein and easy on digestion before sleep.",
    ],
    macros: { protein: 18, carbs: 72, fat: 8, calories: 440 },
    tags: ["Gut Friendly", "Winding Down", "Complete Protein"],
  },
  {
    id: "d3",
    name: "Egg Fried Brown Rice",
    goal: "Endurance",
    diet: "Eggetarian",
    meal: "Dinner",
    prepTime: "20 min",
    servings: 2,
    difficulty: "Easy",
    ingredients: [
      "2 cups cooked brown rice (day-old works best)",
      "3 whole eggs",
      "1/2 cup mixed vegetables (peas, carrot, corn)",
      "3 garlic cloves, minced",
      "2 tbsp low-sodium soy sauce",
      "1 tsp sesame oil",
      "1 tbsp olive oil, spring onions",
    ],
    steps: [
      "Heat olive oil in a large wok on high heat. Add garlic — cook 30 sec.",
      "Add mixed vegetables and stir-fry 3 min on high heat.",
      "Push vegetables to the side, add eggs and scramble quickly in the centre.",
      "Add rice and break up any clumps. Toss everything together on high heat.",
      "Add soy sauce and sesame oil. Toss 2 min more. Garnish with spring onions. High-carb dinner for morning event athletes.",
    ],
    macros: { protein: 26, carbs: 76, fat: 14, calories: 540 },
    tags: ["Carb-Load", "Glycogen Store", "Pre-Event Night"],
  },
  {
    id: "d4",
    name: "Tandoori Chicken Power Plate",
    goal: "Strength",
    diet: "Non-Veg",
    meal: "Dinner",
    prepTime: "30 min",
    servings: 2,
    difficulty: "Medium",
    ingredients: [
      "400g boneless chicken thighs",
      "3 tbsp hung curd, 1 tbsp ginger-garlic paste",
      "1.5 tsp tandoori masala",
      "1 tsp Kashmiri chilli powder",
      "1 tbsp mustard oil",
      "Juice of 1 lemon",
      "3 multigrain rotis, sliced onion rings",
    ],
    steps: [
      "Score chicken thighs with deep cuts. Mix all marinade ingredients and coat thoroughly.",
      "Marinate minimum 2 hours (overnight ideal). The hung curd tenderises the protein fibers.",
      "Grill on high heat or oven at 220°C for 18–22 min, flipping halfway through.",
      "Rest 5 min before slicing. Serve on warm rotis with raw onion and mint chutney.",
      "The highest protein-per-calorie dinner on the list. The slow-digesting chicken protein feeds muscles overnight.",
    ],
    macros: { protein: 56, carbs: 42, fat: 14, calories: 530 },
    tags: ["Highest Protein", "Overnight Muscle Repair", "Anabolic"],
  },
  {
    id: "d5",
    name: "Grilled Pomfret with Steamed Rice",
    goal: "Recovery",
    diet: "Non-Veg",
    meal: "Dinner",
    prepTime: "25 min",
    servings: 2,
    difficulty: "Medium",
    ingredients: [
      "2 medium pomfret fish (cleaned, scored)",
      "1 tsp each turmeric, coriander powder, chilli powder",
      "1 tbsp ginger-garlic paste",
      "1 tbsp coconut oil",
      "Juice of 1 lime",
      "1.5 cups white rice (steamed)",
      "Sliced onion, tomato kachumber to serve",
    ],
    steps: [
      "Score pomfret deeply on both sides. Mix spices, ginger-garlic paste and lime juice into a paste.",
      "Rub marinade all over fish, including inside the cuts. Marinate 20 min minimum.",
      "Heat grill pan or tawa with coconut oil on high heat.",
      "Grill fish 5–6 min per side until skin is charred and flesh flakes easily.",
      "Serve over steamed rice with kachumber salad. Pomfret is exceptionally rich in DHA — the key omega-3 for joint recovery.",
    ],
    macros: { protein: 40, carbs: 60, fat: 14, calories: 530 },
    tags: ["DHA Rich", "Joint Recovery", "Omega-3"],
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
  const mealColor = MEAL_COLORS[recipe.meal];

  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={({ pressed }) => [rcStyles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 }]}
    >
      <LinearGradient
        colors={[goalColor + "22", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={rcStyles.cardGradient}
      />
      <View style={rcStyles.cardTop}>
        <View style={rcStyles.pillRow}>
          <View style={[rcStyles.mealPill, { backgroundColor: mealColor + "20", borderColor: mealColor + "40" }]}>
            <Ionicons name={MEAL_ICONS[recipe.meal] as any} size={11} color={mealColor} />
            <Text style={[rcStyles.mealText, { color: mealColor, fontFamily: "Outfit_700Bold" }]}>
              {recipe.meal}
            </Text>
          </View>
          <View style={[rcStyles.dietDot, { backgroundColor: dietColor }]} />
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
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
          <Text style={[rcStyles.metaText, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>
            {recipe.prepTime}
          </Text>
        </View>
        <View style={rcStyles.meta}>
          <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
          <Text style={[rcStyles.metaText, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>
            {recipe.servings} serving{recipe.servings > 1 ? "s" : ""}
          </Text>
        </View>
        <View style={rcStyles.meta}>
          <Ionicons name="flame-outline" size={13} color="#FF6B35" />
          <Text style={[rcStyles.metaText, { color: "#FF6B35", fontFamily: "Outfit_700Bold" }]}>
            {recipe.macros.calories} kcal
          </Text>
        </View>
      </View>
      <View style={rcStyles.bottomRow}>
        <View style={[rcStyles.goalPill, { backgroundColor: goalColor + "18", borderColor: goalColor + "35" }]}>
          <Ionicons name={GOAL_ICONS[recipe.goal] as any} size={11} color={goalColor} />
          <Text style={[rcStyles.goalText, { color: goalColor, fontFamily: "Outfit_600SemiBold" }]}>
            {recipe.goal}
          </Text>
        </View>
        <View style={rcStyles.macroStrip}>
          <Text style={[rcStyles.macroStripText, { color: "#FF6B35", fontFamily: "Outfit_600SemiBold" }]}>
            P:{recipe.macros.protein}g
          </Text>
          <Text style={[rcStyles.macroStripText, { color: "#00B4D8", fontFamily: "Outfit_600SemiBold" }]}>
            C:{recipe.macros.carbs}g
          </Text>
          <Text style={[rcStyles.macroStripText, { color: "#B388FF", fontFamily: "Outfit_600SemiBold" }]}>
            F:{recipe.macros.fat}g
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const rcStyles = StyleSheet.create({
  card: { borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, overflow: "hidden" },
  cardGradient: { ...StyleSheet.absoluteFillObject, borderRadius: 20 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  pillRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  mealPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9, borderWidth: 1 },
  mealText: { fontSize: 11 },
  dietDot: { width: 9, height: 9, borderRadius: 5 },
  diffBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  diffText: { fontSize: 11 },
  name: { fontSize: 18, lineHeight: 24, marginBottom: 8 },
  metaRow: { flexDirection: "row", gap: 14, marginBottom: 10 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12 },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goalPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9, borderWidth: 1 },
  goalText: { fontSize: 11 },
  macroStrip: { flexDirection: "row", gap: 10 },
  macroStripText: { fontSize: 11 },
});

function RecipeDetailModal({ recipe, visible, onClose }: { recipe: Recipe | null; visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  if (!recipe) return null;
  const goalColor = GOAL_COLORS[recipe.goal];
  const dietColor = DIET_COLORS[recipe.diet];
  const mealColor = MEAL_COLORS[recipe.meal];
  const maxMacro = Math.max(recipe.macros.protein, recipe.macros.carbs, recipe.macros.fat);

  const handleShare = async () => {
    const msg = `${recipe.name}\n${recipe.meal} | ${recipe.diet}\nGoal: ${recipe.goal} | ${recipe.prepTime}\n\nIngredients:\n${recipe.ingredients.map(i => `• ${i}`).join("\n")}\n\nMacros: ${recipe.macros.protein}g protein, ${recipe.macros.carbs}g carbs, ${recipe.macros.fat}g fat, ${recipe.macros.calories} kcal\n\nBioHack — Track. Fuel. Perform.`;
    try { await Share.share({ message: msg }); } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[rdStyles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={[goalColor + "40", colors.background]} style={rdStyles.headerGradient} />
        <View style={[rdStyles.header, { paddingTop: insets.top || 16 }]}>
          <Pressable onPress={onClose} style={[rdStyles.closeBtn, { backgroundColor: colors.card }]} hitSlop={12}>
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
          <Pressable onPress={handleShare} style={[rdStyles.shareBtn, { backgroundColor: goalColor }]} hitSlop={8}>
            <Ionicons name="share-social-outline" size={18} color="#fff" />
            <Text style={[rdStyles.shareBtnText, { fontFamily: "Outfit_600SemiBold" }]}>Share</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={[rdStyles.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
          <View style={rdStyles.badgeRow}>
            <View style={[rdStyles.badge, { backgroundColor: mealColor + "20", borderColor: mealColor + "50" }]}>
              <Ionicons name={MEAL_ICONS[recipe.meal] as any} size={13} color={mealColor} />
              <Text style={[rdStyles.badgeText, { color: mealColor, fontFamily: "Outfit_700Bold" }]}>{recipe.meal}</Text>
            </View>
            <View style={[rdStyles.badge, { backgroundColor: dietColor + "20", borderColor: dietColor + "50" }]}>
              <Ionicons name={DIET_ICONS[recipe.diet] as any} size={13} color={dietColor} />
              <Text style={[rdStyles.badgeText, { color: dietColor, fontFamily: "Outfit_700Bold" }]}>{recipe.diet}</Text>
            </View>
            <View style={[rdStyles.badge, { backgroundColor: goalColor + "20", borderColor: goalColor + "40" }]}>
              <Ionicons name={GOAL_ICONS[recipe.goal] as any} size={13} color={goalColor} />
              <Text style={[rdStyles.badgeText, { color: goalColor, fontFamily: "Outfit_600SemiBold" }]}>{recipe.goal}</Text>
            </View>
          </View>
          <Text style={[rdStyles.title, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>
            {recipe.name}
          </Text>
          <View style={rdStyles.metaRow}>
            {[
              { icon: "time-outline", text: recipe.prepTime, color: colors.textSecondary },
              { icon: "people-outline", text: `${recipe.servings} serving${recipe.servings > 1 ? "s" : ""}`, color: colors.textSecondary },
              { icon: "flame-outline", text: `${recipe.macros.calories} kcal`, color: "#FF6B35" },
            ].map((m, i) => (
              <View key={i} style={rdStyles.metaItem}>
                <Ionicons name={m.icon as any} size={15} color={m.color} />
                <Text style={[rdStyles.metaText, { color: m.color, fontFamily: "Outfit_500Medium" }]}>{m.text}</Text>
              </View>
            ))}
          </View>

          <View style={[rdStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[rdStyles.sectionTitle, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>Macros</Text>
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
            <Text style={[rdStyles.sectionTitle, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>Ingredients</Text>
            {recipe.ingredients.map((ing, i) => (
              <View key={i} style={rdStyles.ingRow}>
                <View style={[rdStyles.ingDot, { backgroundColor: goalColor }]} />
                <Text style={[rdStyles.ingText, { color: colors.text, fontFamily: "Outfit_400Regular" }]}>{ing}</Text>
              </View>
            ))}
          </View>

          <View style={[rdStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[rdStyles.sectionTitle, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>Preparation</Text>
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
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  badgeText: { fontSize: 12 },
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

// ─── Meal Preference Modal ─────────────────────────────────────────────────
function MealPreferenceModal({
  visible,
  initial,
  onClose,
  onSave,
}: {
  visible: boolean;
  initial: MealPreference | null;
  onClose: () => void;
  onSave: (pref: MealPreference) => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const blank: MealPreference = { name: "", diet: "", goals: [], mealTimes: [], restrictions: "", notes: "", savedAt: "" };
  const [form, setForm] = useState<MealPreference>(blank);

  useEffect(() => {
    if (visible) setForm(initial ?? blank);
  }, [visible]);

  const toggleGoal = (g: Goal) => setForm(f => ({ ...f, goals: f.goals.includes(g) ? f.goals.filter(x => x !== g) : [...f.goals, g] }));
  const toggleMeal = (m: MealType) => setForm(f => ({ ...f, mealTimes: f.mealTimes.includes(m) ? f.mealTimes.filter(x => x !== m) : [...f.mealTimes, m] }));

  const handleSave = () => {
    if (!form.diet) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({ ...form, savedAt: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) });
  };

  const handleShare = async () => {
    const lines: string[] = [
      "My Meal Preferences — BioHack",
      "",
      form.name ? `Athlete: ${form.name}` : "",
      form.diet ? `Diet: ${form.diet}` : "",
      form.goals.length ? `Training Goals: ${form.goals.join(", ")}` : "",
      form.mealTimes.length ? `Meals Needed: ${form.mealTimes.join(", ")}` : "",
      form.restrictions ? `Dietary Restrictions: ${form.restrictions}` : "",
      "",
      form.notes ? `Notes for Dietician:\n${form.notes}` : "",
      "",
      "Shared from BioHack — Performance Habit Tracker",
    ].filter(Boolean);
    try { await Share.share({ message: lines.join("\n") }); } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[mpStyles.container, { backgroundColor: colors.background }]}>
          <LinearGradient colors={["#00E67628", colors.background]} style={mpStyles.headerGradient} />

          <View style={[mpStyles.header, { paddingTop: insets.top || 20 }]}>
            <Pressable onPress={onClose} style={[mpStyles.closeBtn, { backgroundColor: colors.card }]} hitSlop={12}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
            <Text style={[mpStyles.headerTitle, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>
              Meal Preference
            </Text>
            <Pressable onPress={handleShare} style={[mpStyles.shareBtn, { backgroundColor: colors.card, borderColor: colors.border }]} hitSlop={8}>
              <Ionicons name="share-social-outline" size={18} color={colors.tint} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={[mpStyles.scroll, { paddingBottom: insets.bottom + 60 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[mpStyles.helpText, { color: colors.textSecondary, fontFamily: "Outfit_400Regular", backgroundColor: colors.card, borderColor: colors.border }]}>
              Save your preferences below and share this summary with your dietician so they can plan your custom meal programme.
            </Text>

            {/* Name */}
            <Text style={[mpStyles.sectionLabel, { color: colors.textSecondary, fontFamily: "Outfit_600SemiBold" }]}>Your Name (optional)</Text>
            <TextInput
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
              placeholder="e.g. Dhaval Patel"
              placeholderTextColor={colors.textMuted}
              style={[mpStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, fontFamily: "Outfit_400Regular" }]}
            />

            {/* Diet */}
            <Text style={[mpStyles.sectionLabel, { color: colors.textSecondary, fontFamily: "Outfit_600SemiBold" }]}>
              Dietary Preference <Text style={{ color: "#FF3B30" }}>*</Text>
            </Text>
            <View style={mpStyles.chipRow}>
              {(["Pure Veg", "Eggetarian", "Non-Veg"] as DietType[]).map(d => {
                const active = form.diet === d;
                const col = DIET_COLORS[d];
                return (
                  <Pressable
                    key={d}
                    onPress={() => { setForm(f => ({ ...f, diet: d })); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[mpStyles.chip, { backgroundColor: active ? col : colors.card, borderColor: active ? col : colors.border }]}
                  >
                    <Ionicons name={DIET_ICONS[d] as any} size={14} color={active ? "#fff" : col} />
                    <Text style={[mpStyles.chipText, { color: active ? "#fff" : colors.text, fontFamily: "Outfit_700Bold" }]}>{d}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Goals */}
            <Text style={[mpStyles.sectionLabel, { color: colors.textSecondary, fontFamily: "Outfit_600SemiBold" }]}>Training Goals</Text>
            <View style={mpStyles.chipRow}>
              {(["Strength", "Endurance", "Recovery", "Mental Focus"] as Goal[]).map(g => {
                const active = form.goals.includes(g);
                const col = GOAL_COLORS[g];
                return (
                  <Pressable
                    key={g}
                    onPress={() => { toggleGoal(g); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[mpStyles.chip, { backgroundColor: active ? col : colors.card, borderColor: active ? col : colors.border }]}
                  >
                    <Ionicons name={GOAL_ICONS[g] as any} size={14} color={active ? "#fff" : col} />
                    <Text style={[mpStyles.chipText, { color: active ? "#fff" : colors.text, fontFamily: "Outfit_600SemiBold" }]}>{g}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Meal Times */}
            <Text style={[mpStyles.sectionLabel, { color: colors.textSecondary, fontFamily: "Outfit_600SemiBold" }]}>Meals I Need Help With</Text>
            <View style={mpStyles.chipRow}>
              {(["Breakfast", "Brunch", "Lunch", "Pre-Workout", "Post-Workout", "Dinner"] as MealType[]).map(m => {
                const active = form.mealTimes.includes(m);
                const col = MEAL_COLORS[m];
                return (
                  <Pressable
                    key={m}
                    onPress={() => { toggleMeal(m); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[mpStyles.chip, { backgroundColor: active ? col : colors.card, borderColor: active ? col : colors.border }]}
                  >
                    <Ionicons name={MEAL_ICONS[m] as any} size={14} color={active ? "#fff" : col} />
                    <Text style={[mpStyles.chipText, { color: active ? "#fff" : colors.text, fontFamily: "Outfit_600SemiBold" }]}>{m}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Restrictions */}
            <Text style={[mpStyles.sectionLabel, { color: colors.textSecondary, fontFamily: "Outfit_600SemiBold" }]}>Dietary Restrictions / Allergies</Text>
            <TextInput
              value={form.restrictions}
              onChangeText={v => setForm(f => ({ ...f, restrictions: v }))}
              placeholder="e.g. Lactose intolerant, no peanuts, gluten free..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={2}
              style={[mpStyles.input, mpStyles.multiline, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, fontFamily: "Outfit_400Regular" }]}
            />

            {/* Notes for Dietician */}
            <Text style={[mpStyles.sectionLabel, { color: colors.textSecondary, fontFamily: "Outfit_600SemiBold" }]}>Notes for Dietician</Text>
            <TextInput
              value={form.notes}
              onChangeText={v => setForm(f => ({ ...f, notes: v }))}
              placeholder="Describe your training schedule, body goals, meal timing challenges, or anything else your dietician should know..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={[mpStyles.input, mpStyles.multilineL, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, fontFamily: "Outfit_400Regular" }]}
            />

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [mpStyles.saveBtn, { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#000" />
              <Text style={[mpStyles.saveBtnText, { fontFamily: "Outfit_800ExtraBold" }]}>Save Preference</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const mpStyles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 160 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18 },
  shareBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  helpText: { fontSize: 14, lineHeight: 21, borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1 },
  sectionLabel: { fontSize: 11, letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 10 },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 20 },
  multiline: { minHeight: 64, textAlignVertical: "top" },
  multilineL: { minHeight: 120, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  chipText: { fontSize: 13 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 18, marginTop: 8 },
  saveBtnText: { fontSize: 16, color: "#000" },
});

function FilterRow({
  label,
  options,
  optionColors,
  optionIcons,
  value,
  onChange,
  theme,
}: {
  label: string;
  options: string[];
  optionColors: Record<string, string>;
  optionIcons: Record<string, string>;
  value: string;
  onChange: (v: any) => void;
  theme: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <>
      <Text style={[sStyles.filterLabel, { color: theme.textSecondary, fontFamily: "Outfit_600SemiBold" }]}>
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sStyles.filterRow}>
        {(["All", ...options] as string[]).map((opt) => {
          const active = value === opt;
          const color = opt === "All" ? theme.tint : optionColors[opt];
          return (
            <Pressable
              key={opt}
              onPress={() => { onChange(opt); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={[
                sStyles.filterChip,
                { backgroundColor: active ? color : theme.card, borderColor: active ? color : theme.border },
              ]}
            >
              {opt !== "All" && (
                <Ionicons name={optionIcons[opt] as any} size={13} color={active ? "#fff" : color} style={{ marginRight: 4 }} />
              )}
              <Text style={[sStyles.filterChipText, { color: active ? "#fff" : theme.textSecondary, fontFamily: "Outfit_600SemiBold" }]}>
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );
}

export default function RecipesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : 0;

  const [selectedDiet, setSelectedDiet] = useState<DietType | "All">("All");
  const [selectedMeal, setSelectedMeal] = useState<MealType | "All">("All");
  const [selectedGoal, setSelectedGoal] = useState<Goal | "All">("All");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [prefModalVisible, setPrefModalVisible] = useState(false);
  const [savedPref, setSavedPref] = useState<MealPreference | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(PREF_KEY).then(val => {
      if (val) { try { setSavedPref(JSON.parse(val)); } catch {} }
    });
  }, []);

  const savePref = async (pref: MealPreference) => {
    await AsyncStorage.setItem(PREF_KEY, JSON.stringify(pref));
    setSavedPref(pref);
    setPrefModalVisible(false);
  };

  const deletePref = () => {
    Alert.alert(
      "Delete Meal Preference",
      "This will permanently remove your saved meal preferences. You can always add them again later.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await AsyncStorage.removeItem(PREF_KEY);
            setSavedPref(null);
          },
        },
      ]
    );
  };

  const sharePref = async (pref: MealPreference) => {
    const lines = [
      "My Meal Preferences — BioHack",
      "",
      pref.name ? `Athlete: ${pref.name}` : "",
      pref.diet ? `Diet: ${pref.diet}` : "",
      pref.goals.length ? `Training Goals: ${pref.goals.join(", ")}` : "",
      pref.mealTimes.length ? `Meals Needed: ${pref.mealTimes.join(", ")}` : "",
      pref.restrictions ? `Dietary Restrictions: ${pref.restrictions}` : "",
      "",
      pref.notes ? `Notes for Dietician:\n${pref.notes}` : "",
      "",
      "Shared from BioHack — Performance Habit Tracker",
    ].filter(Boolean);
    try { await Share.share({ message: lines.join("\n") }); } catch {}
  };

  const filtered = RECIPE_BANK.filter((r) => {
    const dietOk = selectedDiet === "All" || r.diet === selectedDiet;
    const mealOk = selectedMeal === "All" || r.meal === selectedMeal;
    const goalOk = selectedGoal === "All" || r.goal === selectedGoal;
    return dietOk && mealOk && goalOk;
  });

  const openRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setModalVisible(true);
  };

  const activeFilters = [selectedDiet, selectedMeal, selectedGoal].filter(f => f !== "All").length;

  return (
    <View style={[sStyles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[sStyles.scroll, { paddingTop: topPad + 12, paddingBottom: botPad + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={sStyles.header}>
          <View>
            <Text style={[sStyles.title, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>Fuel Up</Text>
            <Text style={[sStyles.subtitle, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>
              Indian athlete nutrition, your way
            </Text>
          </View>
          <View style={[sStyles.countBadge, { backgroundColor: colors.tint + "20", borderColor: colors.tint + "40" }]}>
            <Text style={[sStyles.countText, { color: colors.tint, fontFamily: "Outfit_800ExtraBold" }]}>{filtered.length}</Text>
            <Text style={[sStyles.countLabel, { color: colors.tint, fontFamily: "Outfit_500Medium" }]}>recipes</Text>
          </View>
        </View>

        <FilterRow
          label="Dietary Preference"
          options={DIET_TYPES}
          optionColors={DIET_COLORS}
          optionIcons={DIET_ICONS}
          value={selectedDiet}
          onChange={setSelectedDiet}
          theme={colors}
        />
        <FilterRow
          label="Meal Category"
          options={MEAL_TYPES}
          optionColors={MEAL_COLORS}
          optionIcons={MEAL_ICONS}
          value={selectedMeal}
          onChange={setSelectedMeal}
          theme={colors}
        />
        <FilterRow
          label="Training Goal"
          options={GOALS}
          optionColors={GOAL_COLORS}
          optionIcons={GOAL_ICONS}
          value={selectedGoal}
          onChange={setSelectedGoal}
          theme={colors}
        />

        {activeFilters > 0 && (
          <Pressable
            onPress={() => { setSelectedDiet("All"); setSelectedMeal("All"); setSelectedGoal("All"); }}
            style={[sStyles.clearBtn, { borderColor: colors.border }]}
          >
            <Ionicons name="close-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={[sStyles.clearBtnText, { color: colors.textSecondary, fontFamily: "Outfit_600SemiBold" }]}>
              Clear {activeFilters} filter{activeFilters > 1 ? "s" : ""}
            </Text>
          </Pressable>
        )}

        {filtered.length === 0 ? (
          <View style={sStyles.emptyWrapper}>
            {/* No match message */}
            <View style={[sStyles.emptyTop, { borderColor: colors.border }]}>
              <Ionicons name="restaurant-outline" size={42} color={colors.textMuted} />
              <Text style={[sStyles.emptyText, { color: colors.textMuted, fontFamily: "Outfit_500Medium" }]}>
                No recipes match your filters
              </Text>
              <Text style={[sStyles.emptyHint, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
                Try adjusting the filters above — or save your preferences for your dietician.
              </Text>
            </View>

            {/* Saved preference card */}
            {savedPref ? (
              <View style={[sStyles.prefCard, { backgroundColor: colors.card, borderColor: colors.tint + "40" }]}>
                <LinearGradient colors={[colors.tint + "18", "transparent"]} style={StyleSheet.absoluteFillObject} />
                <View style={sStyles.prefCardHeader}>
                  <View style={sStyles.prefCardTitleRow}>
                    <Ionicons name="person-circle-outline" size={20} color={colors.tint} />
                    <Text style={[sStyles.prefCardTitle, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>
                      {savedPref.name || "My Preferences"}
                    </Text>
                  </View>
                  <Text style={[sStyles.prefCardDate, { color: colors.textMuted, fontFamily: "Outfit_400Regular" }]}>
                    Saved {savedPref.savedAt}
                  </Text>
                </View>

                <View style={sStyles.prefRows}>
                  {savedPref.diet ? (
                    <View style={sStyles.prefRow}>
                      <Ionicons name={DIET_ICONS[savedPref.diet] as any} size={14} color={DIET_COLORS[savedPref.diet]} />
                      <Text style={[sStyles.prefRowLabel, { color: colors.textSecondary, fontFamily: "Outfit_500Medium" }]}>Diet</Text>
                      <Text style={[sStyles.prefRowValue, { color: DIET_COLORS[savedPref.diet], fontFamily: "Outfit_700Bold" }]}>{savedPref.diet}</Text>
                    </View>
                  ) : null}
                  {savedPref.goals.length > 0 && (
                    <View style={sStyles.prefRow}>
                      <Ionicons name="barbell-outline" size={14} color={colors.textSecondary} />
                      <Text style={[sStyles.prefRowLabel, { color: colors.textSecondary, fontFamily: "Outfit_500Medium" }]}>Goals</Text>
                      <Text style={[sStyles.prefRowValue, { color: colors.text, fontFamily: "Outfit_600SemiBold" }]}>{savedPref.goals.join(", ")}</Text>
                    </View>
                  )}
                  {savedPref.mealTimes.length > 0 && (
                    <View style={sStyles.prefRow}>
                      <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                      <Text style={[sStyles.prefRowLabel, { color: colors.textSecondary, fontFamily: "Outfit_500Medium" }]}>Meals</Text>
                      <Text style={[sStyles.prefRowValue, { color: colors.text, fontFamily: "Outfit_600SemiBold" }]}>{savedPref.mealTimes.join(", ")}</Text>
                    </View>
                  )}
                  {savedPref.restrictions ? (
                    <View style={sStyles.prefRow}>
                      <Ionicons name="alert-circle-outline" size={14} color="#FFB300" />
                      <Text style={[sStyles.prefRowLabel, { color: colors.textSecondary, fontFamily: "Outfit_500Medium" }]}>Restrictions</Text>
                      <Text style={[sStyles.prefRowValue, { color: colors.text, fontFamily: "Outfit_400Regular" }]} numberOfLines={1}>{savedPref.restrictions}</Text>
                    </View>
                  ) : null}
                  {savedPref.notes ? (
                    <View style={[sStyles.prefNoteBox, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
                      <Text style={[sStyles.prefNoteLabel, { color: colors.textSecondary, fontFamily: "Outfit_600SemiBold" }]}>Notes for Dietician</Text>
                      <Text style={[sStyles.prefNoteText, { color: colors.text, fontFamily: "Outfit_400Regular" }]} numberOfLines={3}>{savedPref.notes}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Primary action */}
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); sharePref(savedPref); }}
                  style={[sStyles.prefBtn, sStyles.prefBtnShare, { backgroundColor: colors.tint }]}
                >
                  <Ionicons name="share-social-outline" size={16} color="#000" />
                  <Text style={[sStyles.prefBtnText, { color: "#000", fontFamily: "Outfit_800ExtraBold" }]}>Share with Dietician</Text>
                </Pressable>
                {/* Secondary actions */}
                <View style={sStyles.prefBtnRow}>
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPrefModalVisible(true); }}
                    style={[sStyles.prefBtn, sStyles.prefBtnSecondary, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}
                  >
                    <Ionicons name="pencil-outline" size={15} color={colors.textSecondary} />
                    <Text style={[sStyles.prefBtnText, { color: colors.textSecondary, fontFamily: "Outfit_600SemiBold" }]}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); deletePref(); }}
                    style={[sStyles.prefBtn, sStyles.prefBtnSecondary, sStyles.prefBtnDelete, { borderColor: "#FF3B3022" }]}
                  >
                    <Ionicons name="trash-outline" size={15} color="#FF3B30" />
                    <Text style={[sStyles.prefBtnText, { color: "#FF3B30", fontFamily: "Outfit_600SemiBold" }]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* No preference saved yet */
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setPrefModalVisible(true); }}
                style={({ pressed }) => [sStyles.addPrefCard, { backgroundColor: colors.card, borderColor: colors.tint + "60", opacity: pressed ? 0.85 : 1 }]}
              >
                <LinearGradient colors={[colors.tint + "18", "transparent"]} style={StyleSheet.absoluteFillObject} />
                <View style={[sStyles.addPrefIcon, { backgroundColor: colors.tint + "20" }]}>
                  <Ionicons name="nutrition-outline" size={28} color={colors.tint} />
                </View>
                <Text style={[sStyles.addPrefTitle, { color: colors.text, fontFamily: "Outfit_800ExtraBold" }]}>
                  Save Meal Preference
                </Text>
                <Text style={[sStyles.addPrefSub, { color: colors.textSecondary, fontFamily: "Outfit_400Regular" }]}>
                  Fill in your dietary needs and share a personalised summary with your dietician so they can plan your meals.
                </Text>
                <View style={[sStyles.addPrefCta, { backgroundColor: colors.tint }]}>
                  <Ionicons name="add" size={18} color="#000" />
                  <Text style={[sStyles.addPrefCtaText, { fontFamily: "Outfit_800ExtraBold" }]}>Get Started</Text>
                </View>
              </Pressable>
            )}
          </View>
        ) : (
          filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onPress={() => openRecipe(recipe)} />
          ))
        )}
      </ScrollView>

      <RecipeDetailModal recipe={selectedRecipe} visible={modalVisible} onClose={() => setModalVisible(false)} />
      <MealPreferenceModal
        visible={prefModalVisible}
        initial={savedPref}
        onClose={() => setPrefModalVisible(false)}
        onSave={savePref}
      />
    </View>
  );
}

const sStyles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  title: { fontSize: 28 },
  subtitle: { fontSize: 14, marginTop: 2 },
  countBadge: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, alignItems: "center" },
  countText: { fontSize: 22, lineHeight: 26 },
  countLabel: { fontSize: 11 },
  filterLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: 8, textTransform: "uppercase" },
  filterRow: { paddingBottom: 14, gap: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 13 },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  clearBtnText: { fontSize: 13 },
  emptyWrapper: { gap: 14, marginTop: 4 },
  emptyTop: {
    alignItems: "center",
    paddingVertical: 36,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 20,
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyText: { fontSize: 16 },
  emptyHint: { fontSize: 13, textAlign: "center", lineHeight: 19 },

  // Add preference card (no preference saved)
  addPrefCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 22,
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
  },
  addPrefIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  addPrefTitle: { fontSize: 20 },
  addPrefSub: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  addPrefCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 6,
  },
  addPrefCtaText: { fontSize: 15, color: "#000" },

  // Saved preference card
  prefCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    overflow: "hidden",
    gap: 14,
  },
  prefCardHeader: { gap: 4 },
  prefCardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  prefCardTitle: { fontSize: 18 },
  prefCardDate: { fontSize: 12, marginLeft: 28 },
  prefRows: { gap: 10 },
  prefRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  prefRowLabel: { fontSize: 12, width: 76 },
  prefRowValue: { fontSize: 13, flex: 1 },
  prefNoteBox: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 4 },
  prefNoteLabel: { fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" },
  prefNoteText: { fontSize: 13, lineHeight: 19 },
  prefBtnRow: { flexDirection: "row", gap: 10 },
  prefBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  prefBtnShare: { justifyContent: "center", borderWidth: 0 },
  prefBtnSecondary: { flex: 1, justifyContent: "center" },
  prefBtnDelete: { backgroundColor: "transparent" },
  prefBtnText: { fontSize: 14 },
});
