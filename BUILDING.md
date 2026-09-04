# Building an installable Android APK

This produces a real `.apk` file you can copy to your phone and install
directly (no Play Store, no Expo Go) — for sideloading during development.

## One-time setup

Needs Android Studio installed with its SDK (Settings → Languages & Frameworks
→ Android SDK, to see/change the install path) — you already have this.

```bash
npx expo prebuild -p android   # generates the android/ folder (gitignored, regenerate anytime)
```

If you ever change `app.json` (icon, package name, plugins, etc.), re-run
prebuild with `--clean` to regenerate from scratch.

## Build the APK

```bash
npm run build:apk
```

This runs `gradlew assembleDebug` under the hood. First run downloads
Gradle itself plus the Android NDK (~1–2 GB total) — expect 5–15 minutes
depending on your connection; every run after that is much faster.

The APK lands at:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Install it on your phone

**Option A — cable + adb** (fastest, if USB debugging is on):
```bash
"%ANDROID_HOME%\platform-tools\adb.exe" install -r android/app/build/outputs/apk/debug/app-debug.apk
```

**Option B — copy the file over** (USB transfer, or upload somewhere and
download on the phone), then tap it in your Files app. Android will ask to
allow installs from that source the first time — that's expected for a
sideloaded debug build, not a red flag.

**Option C — open the whole project in Android Studio** and hit the green
Run ▶ button with your phone (USB debugging on) or an emulator selected —
same APK, Android Studio just builds+installs+launches it for you in one step.

## Troubleshooting

- **"Failed to install SDK components" / NDK errors** — delete
  `%LOCALAPPDATA%\Android\Sdk\.temp` and re-run. A previous interrupted
  download can leave a stale temp folder that makes the next unzip fail
  with `FileAlreadyExistsException` (hit this exact issue getting the first
  build working).
- **Gradle can't find the SDK** — check `android/local.properties` has a
  `sdk.dir=` line pointing at your actual SDK path (Android Studio → Settings
  → Languages & Frameworks → Android SDK shows the path).
- **Old JDK errors** — command-line `gradlew` needs a modern JDK (17+), not
  whatever plain `java -version` might show on your PATH. Android Studio
  ships its own — point `JAVA_HOME` at it for this one build if needed, e.g.
  `"%ProgramFiles%\Android\Android Studio\jbr"`.
