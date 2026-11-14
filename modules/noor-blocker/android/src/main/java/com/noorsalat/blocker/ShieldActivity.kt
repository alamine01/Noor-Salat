package com.noorsalat.blocker

import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import org.json.JSONArray

/**
 * Écran affiché par-dessus une appli mise en pause (comme l'écran Apple sur iPhone) :
 * un rappel tiré au hasard, « Je vais prier » (ouvre Noor Salat) et « Fermer » (retour à l'accueil du téléphone).
 */
class ShieldActivity : Activity() {
  private val bg = Color.parseColor("#07090F")
  private val gold = Color.parseColor("#E2C08D")
  private val text = Color.parseColor("#F4F1EA")
  private val dim = Color.parseColor("#A3A9B6")
  private val faint = Color.parseColor("#8B91A0")

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.statusBarColor = bg
    window.navigationBarColor = bg
    window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED)
    safeRender()
  }

  // Ne jamais planter (un plantage arrêterait aussi le gardien) : en cas d'erreur, on ouvre Noor Salat.
  private fun safeRender() {
    try { render() } catch (_: Throwable) { openNoor(intent.getStringExtra(EXTRA_KIND) == "focus") }
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    safeRender()
  }

  @Deprecated("Retour = Fermer")
  override fun onBackPressed() { goHome() }

  private fun dp(v: Int) = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v.toFloat(), resources.displayMetrics).toInt()

  private fun render() {
    val kind = intent.getStringExtra(EXTRA_KIND) ?: "block"
    val focus = kind == "focus"
    val appName = intent.getStringExtra(EXTRA_APP)?.let { pkg ->
      try { packageManager.getApplicationLabel(packageManager.getApplicationInfo(pkg, 0)).toString() } catch (_: Exception) { null }
    }

    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      setPadding(dp(28), dp(72), dp(28), dp(36))
      background = GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, intArrayOf(Color.parseColor("#161A2C"), bg, Color.parseColor("#05060B")))
    }

    // Globe doré qui respire.
    val orb = View(this).apply {
      background = GradientDrawable(GradientDrawable.Orientation.TL_BR, intArrayOf(Color.parseColor("#FFF4DC"), Color.parseColor("#F3D9A4"), Color.parseColor("#C9A26A"))).apply { shape = GradientDrawable.OVAL }
      elevation = dp(18).toFloat()
    }
    root.addView(orb, LinearLayout.LayoutParams(dp(92), dp(92)).apply { topMargin = dp(36) })
    for (prop in listOf("scaleX", "scaleY")) {
      ObjectAnimator.ofFloat(orb, prop, 1f, 1.1f).apply { duration = 3000; repeatMode = ValueAnimator.REVERSE; repeatCount = ValueAnimator.INFINITE; start() }
    }

    root.addView(label(if (focus) "SESSION FOCUS" else "C'EST L'HEURE DE PRIER", 11, gold, Typeface.DEFAULT_BOLD).apply { letterSpacing = 0.22f }, lp(top = 40))
    root.addView(label(if (appName != null) "« $appName » est en pause" else "Tes applis sont en pause", 30, text, Typeface.SERIF), lp(top = 12))
    root.addView(label(pickRappel(this, if (focus) "focus" else "priere") ?: "« La prière demeure, pour les croyants, une prescription à des temps déterminés. »\n— An-Nisa · 4:103", 18, dim, Typeface.create(Typeface.SERIF, Typeface.ITALIC)).apply { setLineSpacing(0f, 1.25f) }, lp(top = 26))

    root.addView(View(this), LinearLayout.LayoutParams(1, 0, 1f))

    root.addView(button(if (focus) "Ouvrir Noor Salat" else "Je vais prier", gold, bg) { openNoor(focus) }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(58)))
    root.addView(button("Fermer", Color.TRANSPARENT, dim, stroke = Color.parseColor("#2A2E3A")) { goHome() }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(52)).apply { topMargin = dp(10) })
    root.addView(label(if (focus) "Tes applis reviennent à la fin de la session." else "Le téléphone et les appels restent disponibles.", 12, faint, Typeface.DEFAULT), lp(top = 14))

    root.alpha = 0f
    setContentView(root)
    root.animate().alpha(1f).setDuration(350).start()
  }

  private fun lp(top: Int) = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { topMargin = dp(top) }

  private fun label(s: String, size: Int, color: Int, face: Typeface) = TextView(this).apply {
    text = s
    textSize = size.toFloat()
    setTextColor(color)
    typeface = face
    gravity = Gravity.CENTER
  }

  private fun button(s: String, fill: Int, color: Int, stroke: Int? = null, onClick: () -> Unit) = TextView(this).apply {
    text = s
    textSize = 16f
    setTextColor(color)
    typeface = Typeface.DEFAULT_BOLD
    gravity = Gravity.CENTER
    isClickable = true
    isFocusable = true
    contentDescription = s
    background = GradientDrawable().apply {
      cornerRadius = dp(20).toFloat()
      setColor(fill)
      if (stroke != null) setStroke(dp(1), stroke)
    }
    setOnClickListener { onClick() }
  }

  private fun openNoor(focus: Boolean) {
    val link = if (focus) "noorsalat://focus" else "noorsalat://block"
    try {
      startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(link)).setPackage(packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP))
    } catch (_: Exception) {}
    finish()
  }

  private fun goHome() {
    try {
      startActivity(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    } catch (_: Exception) {}
    finish()
  }

  companion object {
    const val EXTRA_KIND = "kind"
    const val EXTRA_APP = "app"

    private fun prefs(ctx: Context) = ctx.getSharedPreferences("noor_shield", Context.MODE_PRIVATE)

    /** Rappels envoyés par l'appli (src/lib/rappels.ts), un tableau JSON par liste. */
    fun setTexts(ctx: Context, priere: List<String>, focus: List<String>) {
      prefs(ctx).edit().putString("priere", JSONArray(priere).toString()).putString("focus", JSONArray(focus).toString()).apply()
    }

    /** Un rappel au hasard, jamais le même que la fois précédente. */
    fun pickRappel(ctx: Context, pool: String): String? {
      val arr = try { JSONArray(prefs(ctx).getString(pool, "[]")) } catch (_: Exception) { JSONArray() }
      if (arr.length() == 0) return null
      val last = prefs(ctx).getInt("last_$pool", -1)
      var i = (0 until arr.length()).random()
      if (arr.length() > 1 && i == last) i = (i + 1 + (0 until arr.length() - 1).random()) % arr.length()
      prefs(ctx).edit().putInt("last_$pool", i).apply()
      return arr.optString(i)
    }
  }
}
