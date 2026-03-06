import RNFS from 'react-native-fs';
import {NativeModules, Platform} from 'react-native';
import { showToast } from './funcations';

const {OTARestart} = NativeModules;

export interface OTABundle {
  version: string;
  url: string;
}

const OTA_DIR = `${RNFS.DocumentDirectoryPath}/ota`;
const OTA_BUNDLE = `${OTA_DIR}/index.android.bundle`;
const OTA_TMP = `${OTA_DIR}/index.android.bundle.tmp`;
const OTA_VERSION_FILE = `${OTA_DIR}/version.txt`;

export const applyOTABundle = async (bundle: OTABundle) => {
  try {
    if (Platform.OS !== 'android') return;

    await RNFS.mkdir(OTA_DIR);

    if (await RNFS.exists(OTA_VERSION_FILE)) {
      const currentVersion = await RNFS.readFile(OTA_VERSION_FILE, 'utf8');
      if (currentVersion === bundle.version) {
        console.log('Same OTA version already applied. Skipping.');
        return;
      }
    }

    const res = await RNFS.downloadFile({
      fromUrl: bundle.url,
      toFile: OTA_TMP,
      progress: (res) => {
        // const percent = (res.bytesWritten / res.contentLength) * 100;
        // console.log("Download progress:", percent);
        const percent = Math.min((res.bytesWritten / res.contentLength) * 100, 100).toFixed(1);
        console.log("Download progress:", percent + "%");
      }
    }).promise;

    if (res.statusCode !== 200) {
      showToast('Failed to download update. Please try again later.');
      throw new Error('OTA download failed');
    }

    // Replace existing OTA bundle (remove old one completely)
    if (await RNFS.exists(OTA_BUNDLE)) {
      await RNFS.unlink(OTA_BUNDLE);
    }

    await RNFS.moveFile(OTA_TMP, OTA_BUNDLE);

    // Save applied version
    await RNFS.writeFile(OTA_VERSION_FILE, bundle.version, 'utf8');

    console.log('OTA applied successfully');

    showToast('Update applied! Restarting app...');
    // OTARestart?.restartApp();
    return true;
  } catch (e) {
    console.log('OTA failed', e);
    showToast('Update failed. Please try again later.');
    // CRITICAL: Remove broken OTA bundle
    if (await RNFS.exists(OTA_BUNDLE)) {
      await RNFS.unlink(OTA_BUNDLE);
    }

    if (await RNFS.exists(OTA_TMP)) {
      await RNFS.unlink(OTA_TMP);
    }

    // Restart → App will load original APK bundle
    // OTARestart?.restartApp();
    return false;
  }
};


// import RNFS from 'react-native-fs';
// import {NativeModules, Platform} from 'react-native';
// import {log} from './logger';

// const {OTARestart} = NativeModules;

// export interface OTABundle {
//   version: string;
//   url: string;
//   checksum?: string;
// }

// // 🔥 MUST MATCH applicationContext.filesDir
// // const OTA_DIR = `${RNFS.LibraryDirectoryPath}/ota`;
// const OTA_DIR = `${RNFS.DocumentDirectoryPath}/ota`;
// const OTA_BUNDLE = `${OTA_DIR}/index.android.bundle`;
// const OTA_TMP = `${OTA_DIR}/index.android.bundle.tmp`;
// const OTA_OLD = `${OTA_DIR}/index.android.bundle.old`;

// export const applyOTABundle = async (bundle: OTABundle) => {
//   try {
//     // ❌ Never apply OTA in dev
//     // if (__DEV__) {
//     //   log('OTA skipped in DEV mode');
//     //   return;
//     // }
//     log('OTA bundle received', bundle);
//     if (Platform.OS !== 'android') return;

//     await RNFS.mkdir(OTA_DIR);

//     log(`OTA downloading v${bundle.version}`);

//     const res = await RNFS.downloadFile({
//       fromUrl: bundle.url,
//       toFile: OTA_TMP,
//     }).promise;

//     if (res.statusCode !== 200) {
//       throw new Error('OTA download failed');
//     }

//     // Atomic swap
//     if (await RNFS.exists(OTA_BUNDLE)) {
//       await RNFS.unlink(OTA_OLD).catch(() => {});
//       await RNFS.moveFile(OTA_BUNDLE, OTA_OLD);
//     }

//     await RNFS.moveFile(OTA_TMP, OTA_BUNDLE);

//     log('OTA applied successfully');

//     // 🚀 Restart app (release only – guarded in native)
//     // OTARestart.restartApp();
//     if (OTARestart?.restartApp) {
//       OTARestart.restartApp();
//     } else {
//       log('Restart module not available');
//     }
//   } catch (e) {
//     log('OTA failed', e);

//     // Rollback
//     if (await RNFS.exists(OTA_OLD)) {
//       await RNFS.moveFile(OTA_OLD, OTA_BUNDLE);
//       OTARestart.restartApp();
//     }
//   }
// };

// import RNFS from 'react-native-fs';
// import {NativeModules, Platform} from 'react-native';
// // import AsyncStorage from '@react-native-async-storage/async-storage';
// import {log} from './logger';

// const {OTARestart} = NativeModules;

// export interface OTABundle {
//   version: string;
//   url: string;
//   checksum?: string; // optional
// }

// // const OTA_DIR = `${RNFS.DocumentDirectoryPath}/ota`;
// const OTA_DIR = `${RNFS.LibraryDirectoryPath}/ota`;
// const OTA_BUNDLE = `${OTA_DIR}/index.android.bundle`;
// const OTA_TMP = `${OTA_DIR}/index.android.bundle.tmp`;
// const OTA_OLD = `${OTA_DIR}/index.android.bundle.old`;
// const OTA_VERSION_KEY = 'OTA_APPLIED_VERSION';

// // ===============================
// // MAIN ENTRY
// // ===============================
// export const applyOTABundle = async (bundle: OTABundle) => {
//   try {
//     // ❌ Skip in dev mode
//     if (__DEV__) {
//       log('OTA skipped in DEV mode');
//       return;
//     }

//     if (Platform.OS !== 'android') return;

//     await RNFS.mkdir(OTA_DIR);

//     // Prevent re-applying same bundle
//     // const appliedVersion = await AsyncStorage.getItem(OTA_VERSION_KEY);
//     // if (appliedVersion === bundle.version) {
//     //   log('OTA already applied:', bundle.version);
//     //   return;
//     // }

//     log(`OTA downloading v${bundle.version}`);

//     const res = await RNFS.downloadFile({
//       fromUrl: bundle.url,
//       toFile: OTA_TMP,
//     }).promise;

//     if (res.statusCode !== 200) {
//       throw new Error('OTA download failed');
//     }

//     // ===== OPTIONAL CHECKSUM =====
//     // if (bundle.checksum) {
//     //   const hash = await computeSHA256(OTA_TMP);
//     //   if (hash !== bundle.checksum) {
//     //     throw new Error('OTA checksum mismatch');
//     //   }
//     // }

//     // ===== ATOMIC SWAP =====
//     if (await RNFS.exists(OTA_BUNDLE)) {
//       await RNFS.unlink(OTA_OLD).catch(() => {});
//       await RNFS.moveFile(OTA_BUNDLE, OTA_OLD);
//     }

//     await RNFS.moveFile(OTA_TMP, OTA_BUNDLE);

//     // await AsyncStorage.setItem(OTA_VERSION_KEY, bundle.version);

//     log('OTA applied successfully');

//     // Restart JS runtime
//     OTARestart.restartApp();
//   } catch (e) {
//     log('OTA failed', e);

//     // Rollback
//     if (await RNFS.exists(OTA_OLD)) {
//       await RNFS.moveFile(OTA_OLD, OTA_BUNDLE);
//       OTARestart.restartApp();
//     }
//   }
// };
