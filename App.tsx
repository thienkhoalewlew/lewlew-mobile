import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { LogBox } from 'react-native';

// Suppress specific Mapbox warnings
LogBox.ignoreLogs([
  'new NativeEventEmitter() was called with a non-null argument',
  'EventEmitter.removeListener',
  'Sending `onAnimationStart` with no listeners registered',
  'Sending `onAnimationEnd` with no listeners registered',
  '`new NativeEventEmitter()` was called with a non-null argument without the required `addListener` method',
  '`new NativeEventEmitter()` was called with a non-null argument without the required `removeListeners` method',
]);

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});