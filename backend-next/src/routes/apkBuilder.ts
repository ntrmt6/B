import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const router = Router();

const APK_BUILD_DIR = path.join(process.cwd(), 'apk-builds');
const ANDROID_HOME = '/opt/android-sdk';
const JAVA_HOME = '/usr/lib/jvm/java-17-openjdk-amd64';
const GRADLE_WRAPPER_DIR = '/opt/gradle-wrapper';
const MAX_BUILD_RECORDS = 1000; // Maximum number of build records to keep

if (!fs.existsSync(APK_BUILD_DIR)) {
  fs.mkdirSync(APK_BUILD_DIR, { recursive: true });
}

interface APKConfig {
  websiteUrl: string;
  startUrl: string;
  appName: string;
  shortName: string;
  packageName: string;
  appDescription: string;
  versionName: string;
  versionCode: number;
  appIcon: string;
  welcomeImage: string;
  themeColor: string;
  backgroundColor: string;
  displayMode: string;
  orientation: string;
  enableNotifications: boolean;
  enableOffline: boolean;
  enableDeepLinks: boolean;
}

const generateIcons = async (base64Image: string, outputDir: string): Promise<boolean> => {
  try {
    const base64Data = base64Image.replace(/^data:image\/[^;]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Check if it's SVG - convert to PNG first
    const isSvg = base64Image.includes('data:image/svg');
    
    let processableBuffer: Buffer = imageBuffer;
    if (isSvg) {
      // Convert SVG to PNG using sharp
      processableBuffer = await sharp(imageBuffer, { density: 300 })
        .png()
        .toBuffer();
    }
    
    const densities: Record<string, number> = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
    
    for (const [density, size] of Object.entries(densities)) {
      const resDir = path.join(outputDir, 'app', 'src', 'main', 'res', 'mipmap-' + density);
      fs.mkdirSync(resDir, { recursive: true });
      await sharp(processableBuffer)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(path.join(resDir, 'ic_launcher.png'));
    }
    return true;
  } catch (error) {
    console.error('[APK Builder] Icon processing error:', error);
    return false;
  }
};

const generateDefaultIcons = async (outputDir: string, themeColor: string): Promise<void> => {
  const hex = themeColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 99;
  const g = parseInt(hex.substring(2, 4), 16) || 102;
  const b = parseInt(hex.substring(4, 6), 16) || 241;
  
  const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
  const sizes: Record<string, number> = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  
  for (const d of densities) {
    const dir = path.join(outputDir, 'app', 'src', 'main', 'res', 'mipmap-' + d);
    fs.mkdirSync(dir, { recursive: true });
    await sharp({
      create: {
        width: sizes[d],
        height: sizes[d],
        channels: 4,
        background: { r, g, b, alpha: 1 }
      }
    }).png().toFile(path.join(dir, 'ic_launcher.png'));
  }
};

const generateSplashScreen = async (base64Image: string, outputDir: string): Promise<boolean> => {
  try {
    const base64Data = base64Image.replace(/^data:image\/[^;]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Check if it's SVG - convert to PNG first
    const isSvg = base64Image.includes('data:image/svg');
    
    let processableBuffer: Buffer = imageBuffer;
    if (isSvg) {
      processableBuffer = await sharp(imageBuffer, { density: 300 })
        .png()
        .toBuffer();
    }
    
    // Generate splash screen images for different densities
    const splashSizes: Record<string, { width: number; height: number }> = {
      'mdpi': { width: 320, height: 480 },
      'hdpi': { width: 480, height: 800 },
      'xhdpi': { width: 720, height: 1280 },
      'xxhdpi': { width: 1080, height: 1920 },
      'xxxhdpi': { width: 1440, height: 2560 }
    };
    
    for (const [density, size] of Object.entries(splashSizes)) {
      const drawableDir = path.join(outputDir, 'app', 'src', 'main', 'res', 'drawable-' + density);
      fs.mkdirSync(drawableDir, { recursive: true });
      await sharp(processableBuffer)
        .resize(size.width, size.height, { fit: 'cover', position: 'center' })
        .png()
        .toFile(path.join(drawableDir, 'splash_image.png'));
    }
    
    // Also create a default drawable folder with the splash image
    const defaultDrawableDir = path.join(outputDir, 'app', 'src', 'main', 'res', 'drawable');
    fs.mkdirSync(defaultDrawableDir, { recursive: true });
    await sharp(processableBuffer)
      .resize(1080, 1920, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(defaultDrawableDir, 'splash_image.png'));
    
    return true;
  } catch (error) {
    console.error('[APK Builder] Splash screen processing error:', error);
    return false;
  }
};

const generateDefaultSplash = async (outputDir: string, themeColor: string): Promise<void> => {
  const hex = themeColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 99;
  const g = parseInt(hex.substring(2, 4), 16) || 102;
  const b = parseInt(hex.substring(4, 6), 16) || 241;
  
  const splashSizes: Record<string, { width: number; height: number }> = {
    'mdpi': { width: 320, height: 480 },
    'hdpi': { width: 480, height: 800 },
    'xhdpi': { width: 720, height: 1280 },
    'xxhdpi': { width: 1080, height: 1920 },
    'xxxhdpi': { width: 1440, height: 2560 }
  };
  
  for (const [density, size] of Object.entries(splashSizes)) {
    const drawableDir = path.join(outputDir, 'app', 'src', 'main', 'res', 'drawable-' + density);
    fs.mkdirSync(drawableDir, { recursive: true });
    await sharp({
      create: {
        width: size.width,
        height: size.height,
        channels: 4,
        background: { r, g, b, alpha: 1 }
      }
    }).png().toFile(path.join(drawableDir, 'splash_image.png'));
  }
  
  const defaultDrawableDir = path.join(outputDir, 'app', 'src', 'main', 'res', 'drawable');
  fs.mkdirSync(defaultDrawableDir, { recursive: true });
  await sharp({
    create: {
      width: 1080,
      height: 1920,
      channels: 4,
      background: { r, g, b, alpha: 1 }
    }
  }).png().toFile(path.join(defaultDrawableDir, 'splash_image.png'));
};

const createAndroidProject = async (config: APKConfig, buildDir: string): Promise<void> => {
  const pkgPath = config.packageName.replace(/\./g, '/');
  const hostname = new URL(config.websiteUrl).hostname;
  
  const dirs = ['app/src/main/java/' + pkgPath, 'app/src/main/res/layout', 'app/src/main/res/values', 'gradle/wrapper'];
  dirs.forEach(dir => {
    fs.mkdirSync(path.join(buildDir, dir), { recursive: true });
  });
  
  fs.copyFileSync(path.join(GRADLE_WRAPPER_DIR, 'gradlew'), path.join(buildDir, 'gradlew'));
  fs.copyFileSync(path.join(GRADLE_WRAPPER_DIR, 'gradlew.bat'), path.join(buildDir, 'gradlew.bat'));
  fs.cpSync(path.join(GRADLE_WRAPPER_DIR, 'gradle'), path.join(buildDir, 'gradle'), { recursive: true });
  fs.chmodSync(path.join(buildDir, 'gradlew'), '755');
  
  const safeName = config.shortName.replace(/[^a-zA-Z0-9]/g, '');
  
  fs.writeFileSync(path.join(buildDir, 'settings.gradle'), 'rootProject.name = "' + safeName + '"\ninclude \':app\'');
  
  const rootBuildGradle = 'buildscript {\n    repositories { google(); mavenCentral() }\n    dependencies { classpath \'com.android.tools.build:gradle:8.1.0\' }\n}\nallprojects { repositories { google(); mavenCentral() } }';
  fs.writeFileSync(path.join(buildDir, 'build.gradle'), rootBuildGradle);

  fs.writeFileSync(path.join(buildDir, 'gradle.properties'), 'android.useAndroidX=true\nandroid.enableJetifier=true\norg.gradle.jvmargs=-Xmx4096m\n');
  fs.writeFileSync(path.join(buildDir, 'local.properties'), 'sdk.dir=' + ANDROID_HOME + '\n');

  const appBuildGradle = 'plugins { id \'com.android.application\' }\nandroid {\n    namespace \'' + config.packageName + '\'\n    compileSdk 34\n    defaultConfig {\n        applicationId "' + config.packageName + '"\n        minSdk 21\n        targetSdk 34\n        versionCode ' + config.versionCode + '\n        versionName "' + config.versionName + '"\n    }\n    buildTypes { release { minifyEnabled false } }\n    compileOptions {\n        sourceCompatibility JavaVersion.VERSION_17\n        targetCompatibility JavaVersion.VERSION_17\n    }\n}\ndependencies {\n    implementation \'androidx.appcompat:appcompat:1.6.1\'\n    implementation \'androidx.webkit:webkit:1.8.0\'\n    implementation \'androidx.swiperefreshlayout:swiperefreshlayout:1.1.0\'\n}';
  fs.writeFileSync(path.join(buildDir, 'app', 'build.gradle'), appBuildGradle);

  fs.writeFileSync(path.join(buildDir, 'app', 'proguard-rules.pro'), '');

  const screenOrientation = config.orientation === 'landscape' ? 'landscape' : 'portrait';
  const notifPerm = config.enableNotifications ? '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />' : '';
  
  const manifest = '<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n    <uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />\n    ' + notifPerm + '\n    <application\n        android:allowBackup="true"\n        android:icon="@mipmap/ic_launcher"\n        android:label="' + config.appName + '"\n        android:roundIcon="@mipmap/ic_launcher"\n        android:supportsRtl="true"\n        android:theme="@style/AppTheme"\n        android:usesCleartextTraffic="true">\n        <activity\n            android:name=".SplashActivity"\n            android:exported="true"\n            android:screenOrientation="' + screenOrientation + '"\n            android:theme="@style/SplashTheme">\n            <intent-filter>\n                <action android:name="android.intent.action.MAIN" />\n                <category android:name="android.intent.category.LAUNCHER" />\n            </intent-filter>\n        </activity>\n        <activity\n            android:name=".MainActivity"\n            android:exported="false"\n            android:screenOrientation="' + screenOrientation + '"\n            android:configChanges="orientation|screenSize|keyboardHidden" />\n    </application>\n</manifest>';
  fs.writeFileSync(path.join(buildDir, 'app', 'src', 'main', 'AndroidManifest.xml'), manifest);

  const themeColor = config.themeColor || '#6366F1';
  const bgColor = config.backgroundColor || '#FFFFFF';
  
  const styles = '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">\n        <item name="colorPrimary">' + themeColor + '</item>\n        <item name="colorPrimaryDark">' + themeColor + '</item>\n        <item name="colorAccent">' + themeColor + '</item>\n        <item name="android:windowBackground">' + bgColor + '</item>\n        <item name="android:statusBarColor">' + themeColor + '</item>\n    </style>\n    <style name="SplashTheme" parent="Theme.AppCompat.Light.NoActionBar">\n        <item name="android:windowBackground">@drawable/splash_background</item>\n        <item name="android:statusBarColor">' + themeColor + '</item>\n    </style>\n</resources>';
  fs.writeFileSync(path.join(buildDir, 'app', 'src', 'main', 'res', 'values', 'styles.xml'), styles);

  const colors = '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="colorPrimary">' + themeColor + '</color>\n    <color name="colorPrimaryDark">' + themeColor + '</color>\n    <color name="colorAccent">' + themeColor + '</color>\n    <color name="splashBackground">' + bgColor + '</color>\n</resources>';
  fs.writeFileSync(path.join(buildDir, 'app', 'src', 'main', 'res', 'values', 'colors.xml'), colors);

  // Create splash background drawable
  const drawableDir = path.join(buildDir, 'app', 'src', 'main', 'res', 'drawable');
  fs.mkdirSync(drawableDir, { recursive: true });
  const splashBackgroundXml = '<?xml version="1.0" encoding="utf-8"?>\n<layer-list xmlns:android="http://schemas.android.com/apk/res/android">\n    <item android:drawable="@color/splashBackground" />\n    <item>\n        <bitmap\n            android:gravity="center"\n            android:src="@drawable/splash_image" />\n    </item>\n</layer-list>';
  fs.writeFileSync(path.join(drawableDir, 'splash_background.xml'), splashBackgroundXml);

  const strings = '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="app_name">' + config.appName + '</string>\n</resources>';
  fs.writeFileSync(path.join(buildDir, 'app', 'src', 'main', 'res', 'values', 'strings.xml'), strings);

  const layoutXml = '<?xml version="1.0" encoding="utf-8"?>\n<androidx.swiperefreshlayout.widget.SwipeRefreshLayout\n    xmlns:android="http://schemas.android.com/apk/res/android"\n    android:id="@+id/swipe_refresh"\n    android:layout_width="match_parent"\n    android:layout_height="match_parent">\n    <WebView android:id="@+id/webview" android:layout_width="match_parent" android:layout_height="match_parent" />\n</androidx.swiperefreshlayout.widget.SwipeRefreshLayout>';
  fs.writeFileSync(path.join(buildDir, 'app', 'src', 'main', 'res', 'layout', 'activity_main.xml'), layoutXml);

  const fullUrl = config.websiteUrl + (config.startUrl || '');
  
  const mainActivity = 'package ' + config.packageName + ';\n\nimport android.annotation.SuppressLint;\nimport android.app.Activity;\nimport android.content.Intent;\nimport android.net.Uri;\nimport android.os.Bundle;\nimport android.view.KeyEvent;\nimport android.webkit.*;\nimport androidx.appcompat.app.AppCompatActivity;\nimport androidx.swiperefreshlayout.widget.SwipeRefreshLayout;\n\npublic class MainActivity extends AppCompatActivity {\n    private WebView webView;\n    private SwipeRefreshLayout swipeRefresh;\n    private static final String URL = "' + fullUrl + '";\n    private ValueCallback<Uri[]> uploadMsg;\n\n    @SuppressLint("SetJavaScriptEnabled")\n    @Override\n    protected void onCreate(Bundle b) {\n        super.onCreate(b);\n        setContentView(R.layout.activity_main);\n        webView = findViewById(R.id.webview);\n        swipeRefresh = findViewById(R.id.swipe_refresh);\n        WebSettings s = webView.getSettings();\n        s.setJavaScriptEnabled(true);\n        s.setDomStorageEnabled(true);\n        s.setDatabaseEnabled(true);\n        s.setAllowFileAccess(true);\n        s.setCacheMode(WebSettings.LOAD_DEFAULT);\n        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);\n        s.setUseWideViewPort(true);\n        s.setLoadWithOverviewMode(true);\n        s.setGeolocationEnabled(true);\n        \n        webView.setWebViewClient(new WebViewClient() {\n            @Override\n            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {\n                String url = r.getUrl().toString();\n                if (!url.contains("' + hostname + '")) {\n                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));\n                    return true;\n                }\n                return false;\n            }\n            @Override\n            public void onPageFinished(WebView v, String url) { swipeRefresh.setRefreshing(false); }\n        });\n        \n        webView.setWebChromeClient(new WebChromeClient() {\n            @Override\n            public void onGeolocationPermissionsShowPrompt(String o, GeolocationPermissions.Callback c) { c.invoke(o, true, false); }\n            @Override\n            public boolean onShowFileChooser(WebView w, ValueCallback<Uri[]> f, FileChooserParams p) {\n                uploadMsg = f;\n                try { startActivityForResult(p.createIntent(), 1); } catch (Exception e) { uploadMsg = null; return false; }\n                return true;\n            }\n        });\n        \n        swipeRefresh.setOnRefreshListener(() -> webView.reload());\n        swipeRefresh.setColorSchemeColors(getResources().getColor(R.color.colorPrimary));\n        webView.loadUrl(URL);\n    }\n    \n    @Override\n    protected void onActivityResult(int req, int res, Intent d) {\n        super.onActivityResult(req, res, d);\n        if (req == 1 && uploadMsg != null) {\n            Uri[] r = null;\n            if (res == Activity.RESULT_OK && d != null && d.getDataString() != null) r = new Uri[]{Uri.parse(d.getDataString())};\n            uploadMsg.onReceiveValue(r);\n            uploadMsg = null;\n        }\n    }\n    \n    @Override\n    public boolean onKeyDown(int k, KeyEvent e) {\n        if (k == KeyEvent.KEYCODE_BACK && webView.canGoBack()) { webView.goBack(); return true; }\n        return super.onKeyDown(k, e);\n    }\n    \n    @Override protected void onResume() { super.onResume(); webView.onResume(); }\n    @Override protected void onPause() { super.onPause(); webView.onPause(); }\n}';
  
  // Create SplashActivity for showing welcome image
  const splashActivity = 'package ' + config.packageName + ';\n\nimport android.content.Intent;\nimport android.os.Bundle;\nimport android.os.Handler;\nimport android.os.Looper;\nimport androidx.appcompat.app.AppCompatActivity;\n\npublic class SplashActivity extends AppCompatActivity {\n    private static final int SPLASH_DELAY = 2000;\n\n    @Override\n    protected void onCreate(Bundle savedInstanceState) {\n        super.onCreate(savedInstanceState);\n        new Handler(Looper.getMainLooper()).postDelayed(() -> {\n            startActivity(new Intent(SplashActivity.this, MainActivity.class));\n            finish();\n        }, SPLASH_DELAY);\n    }\n}';
  
  const javaDirs = pkgPath.split('/');
  fs.writeFileSync(path.join(buildDir, 'app', 'src', 'main', 'java', ...javaDirs, 'MainActivity.java'), mainActivity);
  fs.writeFileSync(path.join(buildDir, 'app', 'src', 'main', 'java', ...javaDirs, 'SplashActivity.java'), splashActivity);
};

const buildAPK = async (buildDir: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log('[APK Builder] Starting build...');
    
    const buildCmd = 'cd "' + buildDir + '" && export JAVA_HOME=' + JAVA_HOME + ' && export ANDROID_HOME=' + ANDROID_HOME + ' && export PATH=' + JAVA_HOME + '/bin:' + ANDROID_HOME + '/cmdline-tools/latest/bin:$PATH && ./gradlew assembleDebug --no-daemon -Dorg.gradle.java.home=' + JAVA_HOME;
    
    const buildProcess = exec(buildCmd, {
      env: {
        ...process.env,
        JAVA_HOME,
        ANDROID_HOME,
        ANDROID_SDK_ROOT: ANDROID_HOME,
      },
      maxBuffer: 100 * 1024 * 1024,
      timeout: 600000
    });
    
    buildProcess.stdout?.on('data', (data) => console.log('[APK]', data.toString().trim()));
    buildProcess.stderr?.on('data', (data) => console.error('[APK Error]', data.toString().trim()));
    
    buildProcess.on('close', (code) => {
      const apkPath = path.join(buildDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
      
      if (fs.existsSync(apkPath)) {
        console.log('[APK Builder] Found:', apkPath);
        return resolve(apkPath);
      }
      reject(new Error('Build failed (code ' + code + '). APK not found.'));
    });
    
    buildProcess.on('error', reject);
  });
};

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const config: APKConfig = req.body;
    
    if (!config.websiteUrl || !config.appName || !config.packageName) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    // Validate app icon
    if (!config.appIcon || config.appIcon.length < 100) {
      return res.status(400).json({ success: false, error: 'App icon is required' });
    }
    
    // Validate welcome image
    if (!config.welcomeImage || config.welcomeImage.length < 100) {
      return res.status(400).json({ success: false, error: 'Welcome/splash image is required' });
    }
    
    try { new URL(config.websiteUrl); } catch { return res.status(400).json({ success: false, error: 'Invalid URL' }); }
    
    const buildId = uuidv4();
    const buildDir = path.join(APK_BUILD_DIR, buildId);
    fs.mkdirSync(buildDir, { recursive: true });
    
    // Get user/tenant info from request if available
    const userInfo = {
      userId: (req as any).user?.id || 'anonymous',
      tenantId: (req as any).tenantId || 'public',
      userEmail: (req as any).user?.email || 'unknown',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    };
    
    console.log('[APK Builder] Build ' + buildId + ' for ' + config.appName + ' by user ' + userInfo.userId);
    
    await createAndroidProject(config, buildDir);
    
    // Handle icons - try custom icon first, fall back to default
    let iconSuccess = false;
    if (config.appIcon && config.appIcon.length > 100) {
      console.log('[APK Builder] Processing custom icon...');
      iconSuccess = await generateIcons(config.appIcon, buildDir);
    }
    
    if (!iconSuccess) {
      console.log('[APK Builder] Using default icon with theme color');
      await generateDefaultIcons(buildDir, config.themeColor || '#6366F1');
    }
    
    // Handle splash/welcome image
    let splashSuccess = false;
    if (config.welcomeImage && config.welcomeImage.length > 100) {
      console.log('[APK Builder] Processing welcome/splash image...');
      splashSuccess = await generateSplashScreen(config.welcomeImage, buildDir);
    }
    
    if (!splashSuccess) {
      console.log('[APK Builder] Using default splash screen with theme color');
      await generateDefaultSplash(buildDir, config.themeColor || '#6366F1');
    }
    
    const apkPath = await buildAPK(buildDir);
    const stats = fs.statSync(apkPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    const downloadDir = path.join(APK_BUILD_DIR, 'downloads');
    fs.mkdirSync(downloadDir, { recursive: true });
    
    const safeName = config.shortName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = safeName + '_v' + config.versionName + '.apk';
    const finalPath = path.join(downloadDir, fileName);
    fs.copyFileSync(apkPath, finalPath);
    
    // Save build record for super admin tracking
    try {
      const buildRecord = {
        buildId,
        appName: config.appName,
        packageName: config.packageName,
        websiteUrl: config.websiteUrl,
        versionName: config.versionName,
        versionCode: config.versionCode,
        fileName,
        fileSize: sizeMB + ' MB',
        userId: userInfo.userId,
        tenantId: userInfo.tenantId,
        userEmail: userInfo.userEmail,
        ipAddress: userInfo.ipAddress,
        status: 'completed',
        createdAt: new Date().toISOString()
      };
      
      // Store build record in a JSON file for now (can be moved to MongoDB later)
      const buildRecordsPath = path.join(APK_BUILD_DIR, 'build-records.json');
      let records: any[] = [];
      if (fs.existsSync(buildRecordsPath)) {
        try {
          records = JSON.parse(fs.readFileSync(buildRecordsPath, 'utf-8'));
        } catch (e) {
          records = [];
        }
      }
      records.unshift(buildRecord);
      // Keep only last MAX_BUILD_RECORDS records
      if (records.length > MAX_BUILD_RECORDS) records = records.slice(0, MAX_BUILD_RECORDS);
      fs.writeFileSync(buildRecordsPath, JSON.stringify(records, null, 2));
      
      console.log('[APK Builder] Build record saved for tracking');
    } catch (recordError) {
      console.error('[APK Builder] Failed to save build record:', recordError);
    }
    
    setTimeout(() => fs.rmSync(buildDir, { recursive: true, force: true }), 300000);
    
    console.log('[APK Builder] Done: ' + fileName);
    
    res.json({
      success: true,
      fileName,
      fileSize: sizeMB + ' MB',
      downloadUrl: '/api/apk-builder/download/' + buildId + '/' + fileName,
      buildId
    });
    
  } catch (error: any) {
    console.error('[APK Builder] Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Build failed' });
  }
});

router.get('/download/:buildId/:filename', (req: Request, res: Response) => {
  const { filename } = req.params;
  const filePath = path.join(APK_BUILD_DIR, 'downloads', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'File not found' });
  }
  
  res.download(filePath, filename);
});

router.get('/status', (_req: Request, res: Response) => {
  exec('which java', (e, o) => {
    res.json({
      status: 'operational',
      java: o ? o.includes('java') : false,
      androidSdk: fs.existsSync(ANDROID_HOME),
      buildDir: fs.existsSync(APK_BUILD_DIR),
      gradleWrapper: fs.existsSync(path.join(GRADLE_WRAPPER_DIR, 'gradlew'))
    });
  });
});

// ========== SUPER ADMIN APK BUILD TRACKING ==========

// Get all APK builds (for Super Admin)
router.get('/builds', (_req: Request, res: Response) => {
  try {
    const buildRecordsPath = path.join(APK_BUILD_DIR, 'build-records.json');
    
    if (!fs.existsSync(buildRecordsPath)) {
      return res.json({ success: true, data: [], total: 0 });
    }
    
    const records = JSON.parse(fs.readFileSync(buildRecordsPath, 'utf-8'));
    
    res.json({
      success: true,
      data: records,
      total: records.length
    });
  } catch (error: any) {
    console.error('[APK Builder] Error fetching builds:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch builds' });
  }
});

// Get APK builds statistics (for Super Admin dashboard)
router.get('/builds/stats', (_req: Request, res: Response) => {
  try {
    const buildRecordsPath = path.join(APK_BUILD_DIR, 'build-records.json');
    
    if (!fs.existsSync(buildRecordsPath)) {
      return res.json({
        success: true,
        data: {
          totalBuilds: 0,
          todayBuilds: 0,
          uniqueUsers: 0,
          uniqueTenants: 0
        }
      });
    }
    
    const records = JSON.parse(fs.readFileSync(buildRecordsPath, 'utf-8'));
    
    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const todayBuilds = records.filter((r: any) => r.createdAt?.startsWith(today)).length;
    const uniqueUsers = new Set(records.map((r: any) => r.userId).filter(Boolean)).size;
    const uniqueTenants = new Set(records.map((r: any) => r.tenantId).filter((t: string) => t && t !== 'public')).size;
    
    res.json({
      success: true,
      data: {
        totalBuilds: records.length,
        todayBuilds,
        uniqueUsers,
        uniqueTenants
      }
    });
  } catch (error: any) {
    console.error('[APK Builder] Error fetching build stats:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch build stats' });
  }
});

// Delete APK build record (for Super Admin)
router.delete('/builds/:buildId', (req: Request, res: Response) => {
  try {
    const { buildId } = req.params;
    const buildRecordsPath = path.join(APK_BUILD_DIR, 'build-records.json');
    
    if (!fs.existsSync(buildRecordsPath)) {
      return res.status(404).json({ success: false, error: 'No build records found' });
    }
    
    let records = JSON.parse(fs.readFileSync(buildRecordsPath, 'utf-8'));
    const initialLength = records.length;
    records = records.filter((r: any) => r.buildId !== buildId);
    
    if (records.length === initialLength) {
      return res.status(404).json({ success: false, error: 'Build record not found' });
    }
    
    fs.writeFileSync(buildRecordsPath, JSON.stringify(records, null, 2));
    
    res.json({ success: true, message: 'Build record deleted' });
  } catch (error: any) {
    console.error('[APK Builder] Error deleting build:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete build' });
  }
});

export default router;
