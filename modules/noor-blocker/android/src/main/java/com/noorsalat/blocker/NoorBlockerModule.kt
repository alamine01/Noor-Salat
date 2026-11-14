package com.noorsalat.blocker

import android.app.AlarmManager
import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.util.Base64
import java.io.ByteArrayOutputStream
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
  /** Icône d'appli en PNG base64 (72 px) pour la liste de choix. */
  private fun iconData(d: Drawable): String? = try {
    val size = 72
    val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    d.setBounds(0, 0, size, size)
    d.draw(Canvas(bmp))
    val out = ByteArrayOutputStream()
    bmp.compress(Bitmap.CompressFormat.PNG, 100, out)
    "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
  } catch (_: Exception) { null }

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

    // Choix des applis à mettre en pause (vide = toutes, sauf téléphone et urgences).
    AsyncFunction("getLaunchableApps") {
      val pm = ctx.packageManager
      val launcher = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      val seen = HashSet<String>()
      val apps = ArrayList<Map<String, Any?>>()
      for (ri in pm.queryIntentActivities(launcher, 0)) {
        val pkg = ri.activityInfo.packageName
        if (pkg == ctx.packageName || !seen.add(pkg)) continue
        apps.add(mapOf("package" to pkg, "label" to ri.loadLabel(pm).toString(), "icon" to iconData(ri.loadIcon(pm))))
      }
      apps.sortedBy { (it["label"] as String).lowercase() }
    }

    Function("setBlockedApps") { pkgs: List<String> -> PrayerGuardService.setBlocked(ctx, pkgs.toSet()) }

    Function("getBlockedApps") { PrayerGuardService.getBlocked(ctx).toList() }

    // Rappels de l'écran « appli en pause » (tirés au hasard par ShieldActivity).
    Function("setShieldTexts") { priere: List<String>, focus: List<String> -> ShieldActivity.setTexts(ctx, priere, focus) }
  }
}
