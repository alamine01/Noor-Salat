package com.noorsalat.blocker

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.content.ContextCompat

/** Reçoit l'alarme (prière, Fajr, Focus) et lance le gardien. */
class PrayerAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val kind = intent.getStringExtra(PrayerGuardService.EXTRA_KIND) ?: "block"
    val max = intent.getIntExtra(PrayerGuardService.EXTRA_MAX_MIN, 60)
    val id = intent.getIntExtra(EXTRA_ID, -1)
    if (id >= 0) forget(context, id)
    val svc = Intent(context, PrayerGuardService::class.java)
      .putExtra(PrayerGuardService.EXTRA_KIND, kind)
      .putExtra(PrayerGuardService.EXTRA_MAX_MIN, max)
    ContextCompat.startForegroundService(context, svc)
  }

  companion object {
    private const val EXTRA_ID = "alarmId"
    private fun store(ctx: Context) = ctx.getSharedPreferences("noor_alarms", Context.MODE_PRIVATE)

    private fun pending(ctx: Context, id: Int, kind: String?, max: Int): PendingIntent {
      val i = Intent(ctx, PrayerAlarmReceiver::class.java)
      if (kind != null) {
        i.putExtra(PrayerGuardService.EXTRA_KIND, kind).putExtra(PrayerGuardService.EXTRA_MAX_MIN, max).putExtra(EXTRA_ID, id)
      }
      return PendingIntent.getBroadcast(ctx, id, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    private fun arm(ctx: Context, id: Int, atMs: Long, kind: String, max: Int) {
      val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val pi = pending(ctx, id, kind, max)
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms()) {
        am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMs, pi)
      } else {
        // Sans permission d'alarme exacte : Android peut décaler de quelques minutes.
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMs, pi)
      }
    }

    /** Programme l'alarme et la garde en mémoire, pour la reprogrammer après un redémarrage. */
    fun schedule(ctx: Context, id: Int, atMs: Long, kind: String, max: Int) {
      arm(ctx, id, atMs, kind, max)
      store(ctx).edit().putString(id.toString(), "$atMs|$kind|$max").apply()
    }

    fun cancel(ctx: Context, id: Int) {
      val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      am.cancel(pending(ctx, id, null, 0))
      forget(ctx, id)
    }

    /** Annule toutes les alarmes connues (avant de tout reprogrammer). */
    fun cancelAll(ctx: Context) {
      for (k in store(ctx).all.keys) k.toIntOrNull()?.let { cancel(ctx, it) }
    }

    private fun forget(ctx: Context, id: Int) {
      store(ctx).edit().remove(id.toString()).apply()
    }

    /** Après un redémarrage ou un changement d'heure : on réarme les alarmes à venir. */
    fun restoreAll(ctx: Context) {
      val now = System.currentTimeMillis()
      for ((k, v) in store(ctx).all) {
        val id = k.toIntOrNull() ?: continue
        val parts = (v as? String)?.split("|") ?: continue
        val at = parts.getOrNull(0)?.toLongOrNull() ?: continue
        val kind = parts.getOrNull(1) ?: "block"
        val max = parts.getOrNull(2)?.toIntOrNull() ?: 60
        if (at > now) arm(ctx, id, at, kind, max) else forget(ctx, id)
      }
    }
  }
}
