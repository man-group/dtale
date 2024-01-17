import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import { AppDispatch, MergeDispatch } from './helpers';
import { AppStoreState } from './reducers/app';
import { MergeStoreState } from './reducers/merge';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<AppStoreState> = useSelector;
export const useMergeDispatch = (): MergeDispatch => useDispatch<MergeDispatch>();
export const useMergeSelector: TypedUseSelectorHook<MergeStoreState> = useSelector;
