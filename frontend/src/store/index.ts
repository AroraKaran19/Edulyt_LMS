import { configureStore } from '@reduxjs/toolkit';
import { coursesApi } from './coursesApi';

export const store = configureStore({
    reducer: {
        [coursesApi.reducerPath]: coursesApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(coursesApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 