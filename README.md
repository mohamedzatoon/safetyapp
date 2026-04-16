# BuildSafe AI

A dark-mode construction safety inspection demo built with Next.js.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`

## Test on iPhone

1. Run `npm run dev`
2. Make sure your laptop and iPhone are on the same Wi-Fi
3. Find your computer IP address
4. Open `http://YOUR-IP:3000` on the iPhone browser

## Share it with someone else

Deploy on Vercel:

1. Create a GitHub repo
2. Upload these files
3. Import the repo into Vercel
4. Deploy
5. Send the generated link

## Live analysis

The frontend supports two modes:
- Demo mode: stable for testing
- Live mode: calls `/api/analyze`

The included `/api/analyze` route is only a placeholder. Replace it with real OpenAI Vision logic when ready.
