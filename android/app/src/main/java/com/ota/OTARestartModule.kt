package com.ota

import android.content.Intent
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class OTARestartModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "OTARestart"

    @ReactMethod
    fun restartApp() {
        val activity = currentActivity ?: run {
            Log.e("OTARestart", "No current activity found")
            return
        }

        val application = activity.application

        if (application !is ReactApplication) {
            Log.e("OTARestart", "Application is not a ReactApplication")
            return
        }

        val reactNativeHost = application.reactNativeHost

        // Skip in dev mode — Metro handles reloads
        if (reactNativeHost.useDeveloperSupport) {
            Log.d("OTARestart", "DEV mode — skipping OTA restart")
            return
        }

        activity.runOnUiThread {
            try {
                // Step 1: Destroy the current React instance
                // This forces ReactNativeHost to call getJSBundleFile() fresh
                val instanceManager: ReactInstanceManager =
                    reactNativeHost.reactInstanceManager

                instanceManager.onHostDestroy(activity)
                reactNativeHost.clear() // clears cached instance → forces reload from new bundle path

                // Step 2: Restart the Activity cleanly
                val intent = activity.packageManager
                    .getLaunchIntentForPackage(activity.packageName)
                    ?.apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                    }

                activity.startActivity(intent)
                activity.finish()

                // Step 3: Kill the process so nothing is cached in memory
                android.os.Process.killProcess(android.os.Process.myPid())

            } catch (e: Exception) {
                Log.e("OTARestart", "Restart failed: ${e.message}")
            }
        }
    }
}