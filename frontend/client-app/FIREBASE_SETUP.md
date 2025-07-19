# Firebase Setup Instructions

## Problem
The current Firebase configuration is using invalid API keys, causing authentication to fail.

## Solution
You need to get the correct Firebase web app configuration from Firebase Console.

## Steps:

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/project/cro-generator

2. **Navigate to Project Settings:**
   - Click on the gear icon (⚙️) in the left sidebar
   - Select "Project settings"

3. **Find or Create Web App:**
   - Scroll down to "Your apps" section
   - If you see a web app (🌐), click on it
   - If no web app exists, click "Add app" → "Web" (🌐)

4. **Get Configuration:**
   - Copy the `firebaseConfig` object
   - It should look like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "cro-generator.firebaseapp.com",
     projectId: "cro-generator",
     storageBucket: "cro-generator.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456"
   };
   ```

5. **Update .env.local:**
   - Replace the values in `frontend/client-app/.env.local`
   - Make sure each value matches exactly

6. **Enable Authentication:**
   - In Firebase Console, go to "Authentication" → "Sign-in method"
   - Enable "Google" provider
   - Add your domain (localhost:3001) to authorized domains

## Current Invalid Config:
The current API key `AIzaSyBvOkBwNQI0GiYzqSG2pTruTkuiXgjXiLU` is not valid for this project.

## After Getting Real Config:
Restart the development server: `npm run dev`