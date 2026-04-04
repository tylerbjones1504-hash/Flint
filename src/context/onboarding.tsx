import React, { createContext, useContext, useState } from 'react';
import type {
  Gender,
  SexualOrientation,
  RelationshipGoal,
  FaithTradition,
  PreferenceImportance,
  PoliticsSpectrum,
} from '@/types/database';

export type OnboardingPrompt = {
  template_id: string | null;
  prompt_text: string;
  answer_text: string;
};

export type OnboardingData = {
  // Step 1: Basic info
  display_name: string;
  birth_date: string; // YYYY-MM-DD
  gender: Gender | null;
  sexual_orientation: SexualOrientation | null;
  // Step 2: Relationship goal
  relationship_goal: RelationshipGoal | null;
  // Step 3: Faith
  faith: FaithTradition | null;
  faith_importance: PreferenceImportance | null;
  faith_subgroup_id: string | null;
  // Step 4: Politics
  politics: PoliticsSpectrum | null;
  // Step 5: Bio
  bio: string;
  // Step 6: Prompts (0–3)
  prompts: OnboardingPrompt[];
  // Step 7: Preferences
  preferred_age_min: number;
  preferred_age_max: number;
  max_distance_km: number;
  preferred_genders: Gender[];
};

const defaultData: OnboardingData = {
  display_name: '',
  birth_date: '',
  gender: null,
  sexual_orientation: null,
  relationship_goal: null,
  faith: null,
  faith_importance: null,
  faith_subgroup_id: null,
  politics: null,
  bio: '',
  prompts: [],
  preferred_age_min: 18,
  preferred_age_max: 35,
  max_distance_km: 50,
  preferred_genders: [],
};

type OnboardingContextType = {
  data: OnboardingData;
  update: (partial: Partial<OnboardingData>) => void;
  reset: () => void;
};

const OnboardingContext = createContext<OnboardingContextType>({
  data: defaultData,
  update: () => {},
  reset: () => {},
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData);

  const update = (partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const reset = () => setData(defaultData);

  return (
    <OnboardingContext.Provider value={{ data, update, reset }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => useContext(OnboardingContext);
