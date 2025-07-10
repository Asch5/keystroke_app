// Barrel exports for TTSControls modular components
export { TTSControls } from './TTSControls';
export { QualitySelection } from './components/QualitySelection';
export { VoiceGenderSelection } from './components/VoiceGenderSelection';
export { GenerationOptions } from './components/GenerationOptions';
export { UsageStats } from './components/UsageStats';
export { GenerationProgress } from './components/GenerationProgress';
export { TTSActions } from './components/TTSActions';
export { useTTSState } from './hooks/useTTSState';
export type {
  TTSControlsProps,
  TTSStats,
  QualityLevel,
  QualityLevelType,
  VoiceGender,
  TTSSettings,
} from './types';
