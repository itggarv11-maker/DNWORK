# StuBro AI - Vite + React Project

This project is configured for deployment on Vercel.

## Running the Project Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Your Environment Variable
- Create a new file named `.env.local` in the root of the project.
- Inside this file, add your Gemini API key:
```
VITE_API_KEY=YOUR_GEMINI_API_KEY_HERE
```
Replace `YOUR_GEMINI_API_KEY_HERE` with your actual key.

### 3. Run the Development Server
```bash
npm run dev
```
This will start a local server, typically at `http://localhost:5173`.

## Building for Production

```bash
npm run build
```
This command creates a `dist` folder with optimized files for deployment.

## Deployment to Vercel

1.  **Connect Your Git Repository:** Connect your project's Git repository (e.g., from GitHub, GitLab) to a new project on Vercel.

2.  **Configure Project:** Vercel should automatically detect that this is a Vite project and configure the build settings correctly:
    - **Framework Preset:** `Vite`
    - **Build Command:** `npm run build` or `vite build`
    - **Output Directory:** `dist`

3.  **Set Your Environment Variable (CRITICAL):**
    - In your Vercel project dashboard, go to **Settings > Environment Variables**.
    - Add a new variable:
        - **Name:** `VITE_API_KEY`
        - **Value:** Paste your secret Gemini API key here.
    - Ensure the variable is available for all environments (Production, Preview, Development).
    - Save the variable.

4.  **Deploy:** Trigger a new deployment from the "Deployments" tab in Vercel. Vercel will build your project using the environment variable and deploy it. The included `vercel.toml` file will handle routing for this single-page application.
