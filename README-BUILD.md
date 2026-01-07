# Building the Prontivus Mobile App

## Prerequisites

1. **Expo Account**: You need to be logged in to Expo
2. **EAS CLI**: Installed globally (`npm install -g eas-cli`)
3. **Expo Token**: Set as environment variable

## Quick Start

### Option 1: Automated Script (Recommended)

Run the complete setup and build script:

```powershell
cd E:\Work\New\mobile
.\setup-and-build.ps1
```

This script will:
1. Guide you through credential setup (one-time)
2. Automatically start the build after credentials are configured

### Option 2: Manual Steps

#### Step 1: Configure Android Credentials (One-time setup)

```powershell
cd E:\Work\New\mobile
$env:EXPO_TOKEN="wWVFdm65TuOOMVpSlXSr7IG5IhRFiSh7z1gaLE7c"
eas credentials:configure-build --platform android
```

**When prompted:**
- Select profile: `preview`
- Choose: `Generate a new Android Keystore`
- Confirm: `Yes`

#### Step 2: Build the App

After credentials are configured, run:

```powershell
cd E:\Work\New\mobile
$env:EXPO_TOKEN="wWVFdm65TuOOMVpSlXSr7IG5IhRFiSh7z1gaLE7c"
eas build --platform android --profile preview --wait
```

## Build Profiles

- **preview**: Internal distribution APK (for testing)
- **production**: Production APK (for release)

## Monitor Build Progress

You can check build status at:
https://expo.dev/accounts/sid_lesch/projects/prontivus-doctor-app/builds

## Troubleshooting

### Error: "Generate a new Android Keystore?"

This means credentials aren't configured. Run:
```powershell
eas credentials:configure-build --platform android
```

### Error: "Input is required, but stdin is not readable"

This happens when running in non-interactive mode. You need to run the credential configuration command in an interactive terminal.

### Build Takes Too Long

- Normal build time: 10-20 minutes
- First build may take longer (up to 30 minutes)
- Check the Expo dashboard for real-time progress

## Download APK

After the build completes, download the APK from:
https://expo.dev/accounts/sid_lesch/projects/prontivus-doctor-app/builds

## Notes

- Credential setup is a **one-time process**. After setup, future builds will work automatically.
- The keystore is stored securely on Expo's servers.
- Never commit keystore files to version control.
