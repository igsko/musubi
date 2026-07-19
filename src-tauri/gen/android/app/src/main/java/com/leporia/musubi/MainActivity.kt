package com.leporia.musubi

import android.os.Bundle
import android.webkit.WebView
import android.webkit.JavascriptInterface
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    
    // inject JavaScript bridge named "AndroidStatusBar"
    webView.addJavascriptInterface(object {
        @JavascriptInterface
        fun setStatusBarTheme(isDark: Boolean) {
            runOnUiThread {
                val windowInsetsController = WindowCompat.getInsetsController(window, window.decorView)
                // if theme is dark (isDark == true), turn on a light status bar,
                // which forces Android to render light icons
                windowInsetsController.isAppearanceLightStatusBars = !isDark
            }
        }
    }, "AndroidStatusBar")
  }
}
