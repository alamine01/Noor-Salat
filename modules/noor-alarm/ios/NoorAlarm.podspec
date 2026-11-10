Pod::Spec.new do |s|
  s.name           = 'NoorAlarm'
  s.version        = '1.0.0'
  s.summary        = 'Réveils AlarmKit (iOS 26+) pour Noor Salat'
  s.description    = 'Programme de vrais réveils iPhone (AlarmKit) pour le Fajr et le Tahajjud.'
  s.author         = ''
  s.homepage       = 'https://noorsalat.app'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  # AlarmKit n'existe qu'à partir d'iOS 26 : lien faible pour ne pas planter sur les iPhone plus anciens.
  s.weak_frameworks = 'AlarmKit'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.{h,m,swift}'
end
