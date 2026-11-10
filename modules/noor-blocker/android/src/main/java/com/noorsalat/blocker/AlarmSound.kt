package com.noorsalat.blocker

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

/**
 * Son du réveil Fajr joué par Android lui-même (et pas par l'appli) :
 * il sonne même si l'appli est fermée et l'écran verrouillé.
 * Le volume monte doucement, avec vibration. Fichier choisi par l'utilisateur, sinon l'alarme du téléphone.
 */
object AlarmSound {
  private var player: MediaPlayer? = null
  private var vibrator: Vibrator? = null
  private val handler = Handler(Looper.getMainLooper())
  private var volume = 0.1f

  private val ramp = object : Runnable {
    override fun run() {
      val p = player ?: return
      if (volume < 1f) {
        volume = (volume + 0.03f).coerceAtMost(1f)
        try { p.setVolume(volume, volume) } catch (_: Exception) {}
        handler.postDelayed(this, 2000)
      }
    }
  }

  private fun prefs(ctx: Context) = ctx.getSharedPreferences("noor_guard", Context.MODE_PRIVATE)

  fun setSound(ctx: Context, uri: String?) {
    prefs(ctx).edit().putString("alarm_sound", uri).apply()
  }

  fun isPlaying() = player != null

  fun start(ctx: Context) {
    if (player != null) return
    val attrs = AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_ALARM)
      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
      .build()
    val chosen = prefs(ctx).getString("alarm_sound", null)
    val candidates = listOfNotNull(
      chosen?.let { Uri.parse(it) },
      RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM),
      RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE),
    )
    for (u in candidates) {
      try {
        val mp = MediaPlayer()
        mp.setAudioAttributes(attrs)
        mp.setDataSource(ctx, u)
        mp.isLooping = true
        mp.prepare()
        volume = 0.1f
        mp.setVolume(volume, volume)
        mp.start()
        player = mp
        break
      } catch (_: Exception) { }
    }
    handler.removeCallbacks(ramp)
    handler.postDelayed(ramp, 2000)

    val v = if (Build.VERSION.SDK_INT >= 31) {
      (ctx.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
    } else {
      ctx.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }
    vibrator = v
    try {
      if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 800, 600), 0))
      else v.vibrate(longArrayOf(0, 800, 600), 0)
    } catch (_: Exception) {}
  }

  fun stop() {
    handler.removeCallbacks(ramp)
    try { player?.stop() } catch (_: Exception) {}
    try { player?.release() } catch (_: Exception) {}
    player = null
    try { vibrator?.cancel() } catch (_: Exception) {}
    vibrator = null
  }
}
