# Offline site translation

The site translates visible Arabic and English text locally, including content
added dynamically to course pages. Page text is sent only to the local
translation process; it is not sent to a translation provider.

## Run locally

Install the Python dependencies once:

```powershell
python -m pip install -r requirements-translation.txt
```

In a separate terminal, start the translation server:

```powershell
npm run translation:server
```

Start the site with `npm run dev` in another terminal. On its first start, the
translation server downloads the Arabic-English and English-Arabic model files
(about 170 MB total) into the user cache. Model files are reused afterward, and
translation requests work without an internet connection.

The local server listens only on `127.0.0.1:5000`. If it is stopped or its
models are unavailable, the site displays a translation error instead of
silently pretending the page was translated.
