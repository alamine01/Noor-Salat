package com.noorsalat.blocker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

/**
 * Gardien de prière : tant qu'il est actif, si une autre appli passe au premier plan,
 * il ramène l'écran NOOR SALAT (blocage ou réveil Fajr). Il s'arrête quand le tapis
 * est scanné (stopGuard) ou après maxMinutes par sécurité.
 */
class PrayerGuardService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private var kind = "block"
  private var endAt = 0L
  private var lastTop: String? = null

  private val tick = object : Runnable {
    override fun run() {
      if (!isActive(this@PrayerGuardService) || System.currentTimeMillis() > endAt) {
        setActive(this@PrayerGuardService, false)
        stopSelf()
        return
      }
      // On garde la dernière appli vue : si aucun événement récent, elle est toujours au premier plan.
      val top = topPackage(this@PrayerGuardService) ?: lastTop
      lastTop = top
      // Liste choisie par l'utilisateur : on ne bloque que ces applis. Liste vide : toutes (mode strict).
      val blocked = getBlocked(this@PrayerGuardService)
      // L'écran d'accueil du téléphone reste accessible (sinon « Fermer » ne mènerait nulle part), sauf au réveil Fajr.
      if (top != null && top != packageName && top !in ALLOWED && (kind == "fajr" || top != homePackage()) && (blocked.isEmpty() || top in blocked)) {
        // Réveil Fajr : l'écran du réveil. Prière et Focus : l'écran « appli en pause », comme sur iPhone.
        if (kind == "fajr") bringBack() else showShield(top)
      }
      handler.postDelayed(this, 1500)
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    kind = intent?.getStringExtra(EXTRA_KIND) ?: currentKind(this) ?: "block"
    val max = intent?.getIntExtra(EXTRA_MAX_MIN, 60) ?: 60
    endAt = System.currentTimeMillis() + max * 60_000L
    prefs(this).edit().putBoolean(KEY_ACTIVE, true).putString(KEY_KIND, kind).apply()

    val notif = buildNotification()
    val type = if (Build.VERSION.SDK_INT >= 34) ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE else 0
    ServiceCompat.startForeground(this, 4103, notif, type)

    // Réveil Fajr : le son est joué ici, même si l'appli est fermée.
    if (kind == "fajr") AlarmSound.start(this)
    // Au départ, seul le réveil Fajr passe devant tout. Pour la prière et le Focus, on attend
    // qu'une appli mise en pause soit ouverte (la notification annonce le blocage).
    if (kind == "fajr") bringBack()
    handler.removeCallbacks(tick)
    handler.postDelayed(tick, 1500)
    return START_STICKY
  }

  override fun onDestroy() {
    handler.removeCallbacks(tick)
    AlarmSound.stop()
    super.onDestroy()
  }

  private fun deepLink(): String = when (kind) {
    "fajr" -> "noorsalat://fajr-ring"
    "focus" -> "noorsalat://focus"
    else -> "noorsalat://block"
  }

  private fun openIntent(): Intent =
    Intent(Intent.ACTION_VIEW, Uri.parse(deepLink()))
      .setPackage(packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)

  private fun bringBack() {
    // Android n'autorise le lancement depuis l'arrière-plan qu'avec la permission de superposition.
    if (Settings.canDrawOverlays(this)) {
      try { startActivity(openIntent()) } catch (_: Exception) {}
    }
  }

  private var home: String? = null
  private fun homePackage(): String? {
    if (home == null) {
      home = try {
        packageManager.resolveActivity(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), 0)?.activityInfo?.packageName
      } catch (_: Exception) { null }
    }
    return home
  }

  private fun showShield(app: String) {
    if (!Settings.canDrawOverlays(this)) return bringBack()
    try {
      startActivity(
        Intent(this, ShieldActivity::class.java)
          .putExtra(ShieldActivity.EXTRA_KIND, kind)
          .putExtra(ShieldActivity.EXTRA_APP, app)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      )
    } catch (_: Exception) { return bringBack() }
    // Filet de sécurité : si Android a refusé d'afficher l'écran (règles d'arrière-plan),
    // l'appli bloquée est toujours devant : on ramène Noor Salat comme avant.
    handler.postDelayed({
      val now = topPackage(this) ?: return@postDelayed
      if (now == app) bringBack()
    }, 900)
  }

  private fun buildNotification(): Notification {
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      nm.createNotificationChannel(
        NotificationChannel(CHANNEL, "Heure de la prière", NotificationManager.IMPORTANCE_HIGH)
      )
    }
    val pi = PendingIntent.getActivity(this, 1, openIntent(), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
    val title = when (kind) {
      "fajr" -> "Réveil Fajr"
      "focus" -> "Session Focus en cours"
      else -> "Il est l'heure de prier"
    }
    return NotificationCompat.Builder(this, CHANNEL)
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentTitle(title)
      .setContentText(if (kind == "focus") "Tes applis sont en pause jusqu'à la fin de la session." else "Ta lumière t'attend — scanne ton tapis pour débloquer.")
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(if (kind == "fajr") NotificationCompat.CATEGORY_ALARM else NotificationCompat.CATEGORY_REMINDER)
      .setOngoing(true)
      .setContentIntent(pi)
      .setFullScreenIntent(pi, true)
      .build()
  }

  companion object {
    const val EXTRA_KIND = "kind"
    const val EXTRA_MAX_MIN = "maxMinutes"
    private const val CHANNEL = "noor_prayer"
    private const val KEY_ACTIVE = "active"
    private const val KEY_KIND = "kind"

    // Téléphone et urgences restent toujours accessibles.
    private val ALLOWED = setOf(
      "com.android.dialer", "com.google.android.dialer", "com.samsung.android.dialer",
      "com.android.phone", "com.android.server.telecom", "com.android.emergency",
      "com.google.android.apps.safetyhub", "com.android.systemui", "com.android.settings",
      "com.android.incallui", "com.samsung.android.incallui"
    )

    private fun prefs(ctx: Context) = ctx.getSharedPreferences("noor_guard", Context.MODE_PRIVATE)

    private const val KEY_BLOCKED = "blocked"
    fun getBlocked(ctx: Context): Set<String> = prefs(ctx).getStringSet(KEY_BLOCKED, emptySet()) ?: emptySet()
    fun setBlocked(ctx: Context, pkgs: Set<String>) { prefs(ctx).edit().putStringSet(KEY_BLOCKED, HashSet(pkgs)).apply() }

    fun isActive(ctx: Context) = prefs(ctx).getBoolean(KEY_ACTIVE, false)
    fun currentKind(ctx: Context): String? = if (isActive(ctx)) prefs(ctx).getString(KEY_KIND, null) else null
    fun setActive(ctx: Context, v: Boolean) { prefs(ctx).edit().putBoolean(KEY_ACTIVE, v).apply() }

    fun topPackage(ctx: Context): String? {
      val usm = ctx.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val now = System.currentTimeMillis()
      val events = usm.queryEvents(now - 10 * 60_000, now)
      val e = UsageEvents.Event()
      var last: String? = null
      while (events.hasNextEvent()) {
        events.getNextEvent(e)
        if (e.eventType == UsageEvents.Event.ACTIVITY_RESUMED) last = e.packageName
      }
      return last
    }
  }
}
