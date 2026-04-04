import { Stack } from 'expo-router';
import { OnboardingProvider } from '@/context/onboarding';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack />
    </OnboardingProvider>
  );
}
