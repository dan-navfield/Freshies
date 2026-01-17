import { Stack } from 'expo-router';

export default function ParentRoutineLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        />
    );
}
