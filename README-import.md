# Leden Import Handleiding

## Overzicht

Deze handleiding beschrijft hoe je leden kunt importeren in het ledenbeheer systeem via CSV of Excel bestanden. Het systeem ondersteunt beide formaten en biedt gedetailleerde validatie om ervoor te zorgen dat alle gegevens correct worden geïmporteerd.

## Ondersteunde Bestandsformaten

- **CSV (.csv)** - Comma Separated Values
- **Excel (.xlsx, .xls)** - Microsoft Excel bestanden

## Templates Downloaden

Voor een succesvolle import is het belangrijk om de juiste template te gebruiken:

1. **CSV Template** - Download voor gebruik in teksteditors of eenvoudige spreadsheet programma's
2. **Excel Template** - Download voor gebruik in Microsoft Excel met voorbeelddata

Beide templates bevatten alle vereiste kolommen en voorbeelddata om je te helpen bij het invullen.

## Veld Specificaties

### Verplichte Velden (*)

Deze velden moeten altijd ingevuld worden en mogen niet leeg zijn:

#### **Lidnummer***
- **Beschrijving**: Uniek identificatienummer voor het lid
- **Format**: Tekst of nummer
- **Voorbeeld**: `001`, `L-123`, `2024-001`
- **Validatie**: Moet uniek zijn binnen de organisatie

#### **Voornaam***
- **Beschrijving**: Voornaam van het lid
- **Format**: Tekst
- **Voorbeeld**: `Ahmed`, `Fatima`, `Mohamed`
- **Validatie**: Minimaal 2 karakters

#### **Achternaam***
- **Beschrijving**: Achternaam van het lid
- **Format**: Tekst
- **Voorbeeld**: `Hassan`, `Al-Rashid`, `Van den Berg`
- **Validatie**: Minimaal 2 karakters

#### **Geslacht***
- **Beschrijving**: Geslacht van het lid
- **Toegestane waarden**: `M` (Man), `V` (Vrouw)
- **Voorbeeld**: `M` of `V`
- **Validatie**: Moet exact M of V zijn

#### **Geboortedatum***
- **Beschrijving**: Geboortedatum van het lid
- **Format**: DD/MM/YYYY
- **Voorbeeld**: `15/03/1980`, `01/12/1995`
- **Validatie**: Moet geldig datum formaat zijn

#### **Categorie***
- **Beschrijving**: Lidmaatschap categorie
- **Toegestane waarden**:
  - `STUDENT` - Voor studenten (vaak met korting)
  - `STANDAARD` - Regulier lidmaatschap
  - `SENIOR` - Voor senioren (vaak 65+)
- **Voorbeeld**: `STANDAARD`
- **Validatie**: Moet een van de toegestane waarden zijn

#### **Straat***
- **Beschrijving**: Straatnaam van het adres
- **Format**: Tekst
- **Voorbeeld**: `Kerkstraat`, `Avenue Louise`
- **Validatie**: Minimaal 2 karakters

#### **Nummer***
- **Beschrijving**: Huisnummer (met bus indien van toepassing)
- **Format**: Tekst/nummer
- **Voorbeeld**: `25`, `12A`, `100 bus 3`
- **Validatie**: Mag niet leeg zijn

#### **Postcode***
- **Beschrijving**: Postcode van de woonplaats
- **Format**: Nummer (België: 4 cijfers)
- **Voorbeeld**: `1000`, `2000`, `3000`
- **Validatie**: Voor België: 4 cijfers

#### **Stad***
- **Beschrijving**: Stad of gemeente
- **Format**: Tekst
- **Voorbeeld**: `Brussel`, `Antwerpen`, `Gent`
- **Validatie**: Minimaal 2 karakters

#### **Land***
- **Beschrijving**: Land van verblijf
- **Format**: Tekst
- **Voorbeeld**: `België`, `Nederland`, `Frankrijk`
- **Validatie**: Minimaal 2 karakters

#### **Betaalmethode***
- **Beschrijving**: Voorkeurswijze van betaling
- **Toegestane waarden**:
  - `SEPA` - SEPA automatische incasso (vereist IBAN)
  - `OVERSCHRIJVING` - Handmatige bankoverschrijving
  - `BANCONTACT` - Bancontact betaling
  - `CASH` - Contante betaling
- **Voorbeeld**: `SEPA`
- **Validatie**: Moet een van de toegestane waarden zijn

#### **Betalingsperiode***
- **Beschrijving**: Frequentie van contributie betaling
- **Toegestane waarden**:
  - `MONTHLY` - Maandelijkse betaling
  - `YEARLY` - Jaarlijkse betaling
- **Voorbeeld**: `MONTHLY`
- **Validatie**: Moet MONTHLY of YEARLY zijn

#### **Privacy akkoord***
- **Beschrijving**: Akkoord met privacyverklaring
- **Toegestane waarden**: `JA`
- **Voorbeeld**: `JA`
- **Validatie**: Moet altijd JA zijn (wettelijk vereist)

### Optionele Velden

Deze velden mogen leeg gelaten worden:

#### **E-mail**
- **Beschrijving**: E-mailadres van het lid
- **Format**: Geldig e-mailadres
- **Voorbeeld**: `ahmed@email.com`, `contact@mosque.be`
- **Validatie**: Als ingevuld, moet geldig e-mailadres formaat hebben

#### **Telefoon**
- **Beschrijving**: Telefoonnummer van het lid
- **Format**: Internationaal formaat aanbevolen
- **Voorbeeld**: `+32123456789`, `0123456789`
- **Validatie**: Geen specifieke validatie

#### **IBAN**
- **Beschrijving**: Bankrekeningnummer voor SEPA betalingen
- **Format**: Geldig IBAN formaat
- **Voorbeeld**: `BE68539007547034`
- **Validatie**: 
  - Verplicht als betaalmethode SEPA is
  - Moet geldig IBAN formaat hebben

#### **Actief rol interesse**
- **Beschrijving**: Interest in actieve rol binnen de organisatie
- **Toegestane waarden**: `JA`, `NEE`
- **Standaard**: `NEE`
- **Voorbeeld**: `JA`

#### **Rol beschrijving**
- **Beschrijving**: Beschrijving van gewenste rol of vaardigheden
- **Format**: Vrije tekst
- **Voorbeeld**: `IT ondersteuning`, `Evenementen organiseren`

#### **Foto/video toestemming**
- **Beschrijving**: Toestemming voor foto's en video's
- **Toegestane waarden**: `JA`, `NEE`
- **Standaard**: `NEE`
- **Voorbeeld**: `JA`

#### **Nieuwsbrief**
- **Beschrijving**: Inschrijving voor nieuwsbrief
- **Toegestane waarden**: `JA`, `NEE`
- **Standaard**: `NEE`
- **Voorbeeld**: `JA`

#### **WhatsApp lijst**
- **Beschrijving**: Toevoeging aan WhatsApp communicatie groepen
- **Toegestane waarden**: `JA`, `NEE`
- **Standaard**: `NEE`
- **Voorbeeld**: `NEE`

## Import Proces

### Stap 1: Template Downloaden
1. Klik op "CSV Template" of "Excel Template"
2. Sla het bestand op naar je computer
3. Open het bestand in je favoriete programma

### Stap 2: Gegevens Invullen
1. Vul de gegevens in volgens de specificaties hierboven
2. Gebruik de voorbeelddata als referentie
3. Zorg ervoor dat alle verplichte velden (*) zijn ingevuld
4. Controleer de formaten en toegestane waarden

### Stap 3: Bestand Uploaden
1. Sla je bestand op (behoud het CSV/Excel formaat)
2. Upload het bestand via de import functie
3. Het systeem controleert automatisch alle gegevens

### Stap 4: Validatie Controleren
- Bekijk eventuele foutmeldingen
- Corrigeer fouten in je bestand
- Upload opnieuw indien nodig

### Stap 5: Import Bevestigen
- Controleer de preview van te importeren leden
- Bevestig de import
- Wacht tot het proces voltooid is

## Veelvoorkomende Fouten

### Formaat Fouten
- **Geboortedatum**: Gebruik DD/MM/YYYY formaat
- **Geslacht**: Alleen M of V toegestaan
- **E-mail**: Controleer @ en geldig domein
- **IBAN**: Controleer geldig IBAN formaat

### Verplichte Velden
- Alle velden met * moeten ingevuld zijn
- Privacy akkoord moet altijd JA zijn
- IBAN is verplicht bij betaalmethode SEPA

### Categorie Fouten
- Gebruik exact: STUDENT, STANDAARD, of SENIOR
- Let op hoofdletters/kleine letters

### Betaalmethode Fouten
- Gebruik exact: SEPA, OVERSCHRIJVING, BANCONTACT, of CASH
- Bij SEPA is IBAN verplicht

## Tips voor Succesvolle Import

1. **Gebruik de template**: Start altijd met de gedownloade template
2. **Test met kleine groep**: Probeer eerst een paar leden te importeren
3. **Controleer unieke lidnummers**: Zorg dat elk lidnummer uniek is
4. **Consistente formaten**: Gebruik consistente datum- en tekstformaten
5. **Backup maken**: Maak een backup voordat je grote imports doet

## Ondersteuning

Als je problemen ondervindt met de import:
1. Controleer deze handleiding voor veld specificaties
2. Download een nieuwe template en vergelijk met je bestand
3. Test met een klein bestand eerst
4. Neem contact op met de systeembeheerder bij blijvende problemen

## Technische Opmerkingen

- Maximum bestandsgrootte: Geen specifieke limiet, maar grote bestanden kunnen langer duren
- Ondersteunde karaktersets: UTF-8 (ondersteunt alle karakters)
- Excel versies: .xlsx (Excel 2007+) en .xls (oudere versies)
- CSV formaat: Komma gescheiden, UTF-8 encoding aanbevolen