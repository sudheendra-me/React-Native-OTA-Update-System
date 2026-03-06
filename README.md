# React-Native-OTA-Update-System
React Native Android OTA update demo that downloads and applies JavaScript bundles dynamically without Play Store updates. Includes atomic bundle swap, rollback support, version-based updates, dev-mode protection, Kotlin native restart module, and React Native FS for bundle storage.

This repository contains a React Native OTA (Over-The-Air) update implementation for Android.

The project demonstrates how to dynamically download and apply updated JavaScript bundles without requiring users to update the application from the Play Store.

Key Features:
- OTA JS bundle download system
- Atomic bundle swap mechanism
- Rollback support for failed updates
- Native Android restart module
- Version-based OTA update handling
- Safe dev mode protection
- React Native FS based bundle storage

Project Structure:
- React Native frontend
- Android native module for app restart
- OTA helper utilities
- Logging system

OTA Flow:
1. App checks for new OTA bundle
2. Bundle is downloaded using react-native-fs
3. Temporary bundle is verified
4. Atomic swap replaces the existing bundle
5. App restarts to load the new JS bundle

Native Modules Included:
- OTARestartModule (restart app after OTA update)

Tech Stack:
- React Native
- TypeScript
- Kotlin (Android Native Modules)
- React Native FS

