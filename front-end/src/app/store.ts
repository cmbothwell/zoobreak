import {Action, configureStore, ThunkAction} from '@reduxjs/toolkit';
import tokensReducer from '../features/tokens/tokenSlice';

export const store = configureStore({
  reducer: {
    tokens: tokensReducer
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
