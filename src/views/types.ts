import type { Dispatch, SetStateAction } from 'react';
import type { AppState } from '../types';

export interface ViewProps {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  selectedMonth: string;
  notify: (message: string) => void;
}
