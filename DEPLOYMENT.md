# IDARAH Ledenbeheer - Vercel Deployment Guide

## Stap 1: Vercel Account & Project Setup

1. **Ga naar [vercel.com](https://vercel.com)** en maak een account aan
2. **Connect je GitHub/GitLab repository** waar deze code staat
3. **Import het project** in Vercel dashboard

## Stap 2: Environment Variables instellen

In je Vercel project dashboard, ga naar **Settings > Environment Variables** en voeg toe:

### Database
```
DATABASE_URL = [jouw Neon database connection string]
```

### JWT & Security
```
JWT_SECRET = [genereer een random 32+ karakter string]
```

### Email (optioneel)
```
SENDGRID_API_KEY = [jouw SendGrid API key]
```

### App Settings
```
NODE_ENV = production
```

## Stap 3: Neon Database Setup

1. **Zorg dat je Neon database draait** en toegankelijk is vanuit externe verbindingen
2. **Run database migraties**:
   ```bash
   npm run db:push
   ```

## Stap 4: Deploy

1. **Push je code** naar je repository
2. **Vercel deployed automatisch** bij elke push naar main branch
3. **Check de build logs** in Vercel dashboard voor eventuele errors

## Stap 5: Domein instellen

1. **Ga naar Settings > Domains** in je Vercel project
2. **Voeg je eigen domein toe** (bijv. ledenbeheer.jouwmoskee.be)
3. **Update DNS records** zoals Vercel aangeeft

## Troubleshooting

### Build Errors
- Check of alle environment variables correct zijn ingesteld
- Zorg dat DATABASE_URL correct is en Neon database bereikbaar is

### Runtime Errors
- Check Function Logs in Vercel dashboard
- Verificeer dat alle secrets correct zijn ingesteld

### Performance
- Vercel optimaliseerd automatisch
- Edge functions zorgen voor snelle responstijden wereldwijd

## Productie URLs

Na deployment krijg je:
- **Preview URL**: `https://jouw-project-123.vercel.app`
- **Production URL**: `https://jouw-domein.be`

## Kosten

- **Vercel**: Gratis voor de meeste use cases, betaal alleen bij veel traffic
- **Neon**: Gratis tier is ruim voldoende voor kleine tot middelgrote organisaties

Je applicatie is nu live en schaalbaar! 🚀