package com.noorsalat.blocker

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Le téléphone a redémarré, l'heure ou l'appli a changé : on réarme les alarmes de prière. */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    PrayerAlarmReceiver.restoreAll(context)
  }
}
