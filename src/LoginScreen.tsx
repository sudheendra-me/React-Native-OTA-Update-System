import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  NativeModules,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyOTABundle } from './otaHelper';
import { showToast } from './funcations';
import RNFS from 'react-native-fs';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const STORAGE_KEY = 'JS_BUNDLE_VERSION';
const OTA_DIR = `${RNFS.DocumentDirectoryPath}/ota`;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [storedVersion, setStoredVersion] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const {OTARestart} = NativeModules;

  useEffect(() => {
    loadStoredVersion();
  }, []);

  const loadStoredVersion = async () => {
    try {
      const version = await AsyncStorage.getItem(STORAGE_KEY);
      console.log('version::', version);
      setStoredVersion(Number(version) || 0);
    } catch (error) {
      console.log('Error loading stored version:', error);
    }
  };

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('Please enter username');
      return;
    }

    await updateCheck();
  };

  const updateCheck = async () => {
    try {
      setLoading(true);

      const upgradeDetails = {
        MethodName: 'AppUpgradeCheck',
        InputParam: {
          AppID: 'NIM',
          AppVersionNo: '1.0.6',
          PlatFormID: 'Android',
          UserID: 12,
          UserName: 'BUUSER',
        },
      };

      const response = await fetch(
        'https://vloandev.nimblelos.com:9015/api/v1/dynamic',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(upgradeDetails),
        }
      );

      if (response.status !== 200) {
        Alert.alert('Invalid server response');
        return;
      }

      const responseData = await response.json();
      console.log('Parsed Response:', responseData);

      const apiResponse = responseData?.Response?.[0];

      if (!apiResponse?.Status) {
        Alert.alert(apiResponse?.ErrorMessage || 'API Error');
        return;
      }

      if (!apiResponse?.AllowLogin) {
        Alert.alert('Force Update Required');
        return;
      }

      const bundle = responseData?.JSBundleDetails?.[0];
      const serverVersion = Number(bundle?.jsVersion || 0);

      if (bundle?.jsUrl && serverVersion > storedVersion) {
        showToast('New app version available. Updating now...');

        const res = await applyOTABundle({
          version: serverVersion?.toString(),
          url: bundle.jsUrl,
        });

        showToast(res?.toString() || 'No response from OTA helper');

        if (res) {
          await AsyncStorage.setItem(STORAGE_KEY, serverVersion.toString());
          setStoredVersion(serverVersion);
          showToast('App updated to latest version');
          OTARestart?.restartApp();
          return;
        } else {
          showToast('Failed to apply update. Please try again later.');
        }
      }

      navigation.replace('Home', { username });

    } catch (error) {
      console.log('Update Error:', error);
      Alert.alert('Server Unavailable');
    } finally {
      setLoading(false);
    }
  };


const resetLocalData = async () => {
  Alert.alert(
    'Reset OTA Data',
    'This will clear stored bundle version and downloaded OTA data. Continue?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        onPress: async () => {
          try {

            // Clear version storage
            await AsyncStorage.removeItem(STORAGE_KEY);
            await AsyncStorage.removeItem('bundle_name');

            // Delete OTA folder
            if (await RNFS.exists(OTA_DIR)) {
              await RNFS.unlink(OTA_DIR);
              console.log('OTA folder deleted');
            }

            setStoredVersion(0);

            showToast('OTA bundle reset successfully');

          } catch (error) {
            console.log('Reset error:', error);
          }
        },
      },
    ],
  );
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OTA Demo Login</Text>

      <TextInput
        placeholder="Enter Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      {/* RESET BUTTON */}

      <TouchableOpacity
        style={styles.resetButton}
        onPress={resetLocalData}
      >
        <Text style={styles.buttonText}>Reset OTA</Text>
      </TouchableOpacity>

      <Text style={styles.version}>
        Current JS Bundle Version: {storedVersion}
      </Text>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2E86DE',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#E74C3C',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  version: {
    marginTop: 30,
    textAlign: 'center',
    color: 'gray',
  },
});