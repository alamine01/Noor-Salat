package com.noorsalat.blocker

import android.app.AlarmManager
import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.Uri
import android.os.PowerManager
import android.os.Build
import android.os.Process
import android.provider.Settings
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NoorBlockerModule : Module() {
  private val ctx: Context
    get() = appContext.reactContext ?: throw IllegalStateException("No context")

  override fun definition() = ModuleDefinition {
    Name("NoorBlocker")

    // Statistiques d'usage : nécessaires pour savoir quelle appli est au premier plan.
    Function("hasUsageAccess") {
      val ops = ctx.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.packageName)
      } else {
        @Suppress("DEPRECATION")
        ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.packageName)
      }
      mode == AppOpsManager.MODE_ALLOWED
    }

    Function("openUsageAccessSettings") {
      ctx.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    // Superposition : permet de ramener l'écran de prière devant les autres applis.
    Function("canDrawOverlays") { Settings.canDrawOverlays(ctx) }

    Function("openOverlaySettings") {
      val i = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + ctx.packageName))
      ctx.startActivity(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    Function("canScheduleExactAlarms") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        (ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager).canScheduleExactAlarms()
      } else true
    }

    Function("openExactAlarmSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val i = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + ctx.packageName))
        ctx.startActivity(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      }
    }

    // Programme une alarme : kind = "block" (blocage prière) ou "fajr" (réveil).
    Function("scheduleAlarm") { id: Int, atMs: Double, kind: String, maxMinutes: Int ->
      PrayerAlarmReceiver.schedule(ctx, id, atMs.toLong(), kind, maxMinutes)
    }

    Function("cancelAlarm") { id: Int -> PrayerAlarmReceiver.cancel(ctx, id) }

    Function("cancelAllAlarms") { PrayerAlarmReceiver.cancelAll(ctx) }

    // Son du réveil Fajr (fichier local choisi), joué par Android même appli fermée.
    Function("setAlarmSound") { uri: String? -> AlarmSound.setSound(ctx, uri) }

    Function("stopAlarmSound") { AlarmSound.stop() }

    Function("isAlarmSounding") { AlarmSound.isPlaying() }

    Function("startGuard") { kind: String, maxMinutes: Int ->
      val i = Intent(ctx, PrayerGuardService::class.java)
        .putExtra(PrayerGuardService.EXTRA_KIND, kind)
        .putExtra(PrayerGuardService.EXTRA_MAX_MIN, maxMinutes)
      ContextCompat.startForegroundService(ctx, i)
    }

    Function("stopGuard") {
      PrayerGuardService.setActive(ctx, false)
      ctx.stopService(Intent(ctx, PrayerGuardService::class.java))
    }

    Function("isGuardActive") { PrayerGuardService.isActive(ctx) }

    Function("pendingKind") { PrayerGuardService.currentKind(ctx) }

    // Économie de batterie : certaines marques coupent les applis en arrière-plan.
    Function("isIgnoringBatteryOptimizations") {
      val pm = ctx.getSystemService(Context.POWER_SERVICE) as PowerManager
      pm.isIgnoringBatteryOptimizations(ctx.packageName)
    }

    Function("openBatterySettings") {
      try {
        ctx.startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      } catch (_: Exception) {
        ctx.startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      }
    }

    // Noor Filter : nom du DNS privé actif (null si aucun). Android 9 et plus.
    Function("getPrivateDnsHost") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        val cm = ctx.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val lp = cm.getLinkProperties(cm.activeNetwork)
        if (lp != null && lp.isPrivateDnsActive) lp.privateDnsServerName else null
      } else null
    }

    Function("openNetworkSettings") {
      try {
        ctx.startActivity(Intent(Settings.ACTION_WIRELESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      } catch (_: Exception) {
        ctx.startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      }
    }

    Function("getForegroundApp") { PrayerGuardService.topPackage(ctx) }
  }
}
