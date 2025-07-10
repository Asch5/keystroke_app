// Barrel exports for MakeUpWordGame modular components
export { MakeUpWordGame } from './MakeUpWordGame';
export { GameHeader } from './components/GameHeader';
export { GameArea } from './components/GameArea';
export { GameControls } from './components/GameControls';
export { CharacterButton } from './components/CharacterButton';
export { useGameState } from './hooks/useGameState';
export { useGameActions } from './hooks/useGameActions';
export type {
  MakeUpWordGameProps,
  GameState,
  WordData,
  GameActions,
  CharacterButtonProps,
} from './types';
