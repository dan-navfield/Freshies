import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { globalStyles } from '../../src/theme/styles';
import PageHeader from '../../components/PageHeader';
import FloatingAIButton from '../../components/FloatingAIButton';

export default function RoutineScreen() {
  return (
    <ScrollView style={globalStyles.scrollContainer}>
      <PageHeader
        title="Routine"
        subtitle="Manage your family's skincare routines"
        showAvatar={true}
        showSearch={true}
        searchPlaceholder="Search routines, products..."
      />
      
      <View style={[globalStyles.px6, globalStyles.pt16]}>
        <Text style={[globalStyles.textBase, globalStyles.textCharcoal]}>
          Skincare routine tracker coming soon
        </Text>
      </View>

      {/* Floating AI Button */}
      <FloatingAIButton />
    </ScrollView>
  );
}
