package com.ota

import android.app.Application
import android.util.Log
import java.io.File

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

  private fun getOtaBundlePath(): String? {
    val otaBundle = File(filesDir, "ota/index.android.bundle")
    return if (otaBundle.exists()) {
      Log.d("OTA", "✅ OTA bundle found: ${otaBundle.absolutePath}")
      otaBundle.absolutePath
    } else {
      Log.d("OTA", "📦 No OTA bundle, using APK default")
      null
    }
  }

  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {

      override fun getPackages(): List<ReactPackage> =
        PackageList(this).packages.toMutableList().also {
          it.add(OTARestartPackage())
        }

      override fun getJSMainModuleName(): String = "index"
      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
      override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }

  override val reactHost: ReactHost by lazy {
    val otaPath = if (!BuildConfig.DEBUG) getOtaBundlePath() else null

    if (otaPath != null) {
      // ✅ OTA bundle exists — load it via custom ReactHost
      Log.d("OTA", "🚀 New Arch loading OTA bundle: $otaPath")

      val packages = PackageList(reactNativeHost).packages.toMutableList().also {
        it.add(OTARestartPackage())
      }

      DefaultReactHost.getDefaultReactHost(
        context = applicationContext,
        packageList = packages,
        jsMainModulePath = "index",
        jsBundleAssetPath = "index.android.bundle",
        jsBundleFilePath = otaPath,
        isHermesEnabled = BuildConfig.IS_HERMES_ENABLED,
        useDevSupport = false,
      )
    } else {
      // ✅ No OTA — use completely default behavior, no interference
      Log.d("OTA", "📦 Using default ReactHost")
      DefaultReactHost.getDefaultReactHost(applicationContext, reactNativeHost)
    }
  }

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load()
    }
  }
}