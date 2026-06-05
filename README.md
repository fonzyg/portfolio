# Alfonso Avila Portfolio

Static software engineering portfolio site for Alfonso Avila.

## Projects Featured

- OakVault
- AAA IT Toolkit
- Mom's Clothing Biz
- Trading Bot

## Live Links

- Portfolio: deploy as a DigitalOcean App Platform static site
- OakVault: https://oakvaultcyber.com/
- AAA IT Toolkit: https://serveratutahwithaaaservices.com/

## Run Locally

This is a static site. Open `index.html` directly in a browser, or serve the folder locally:

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173`.

## Deploy

Recommended production target: DigitalOcean App Platform as a static site.

1. Create a public GitHub repository named `portfolio`.
2. Push this repository to `https://github.com/fonzyg/portfolio.git`.
3. In DigitalOcean, create a new App Platform app from the GitHub repo.
4. Use these resource settings:
   - Resource type: Static Site
   - Branch: main
   - Source directory: `/`
   - Build command: leave blank
   - Output directory: `/` or `.`
   - Route: `/`
