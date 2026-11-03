# Auria

Calendario del ciclo e diario dell'emicrania. React + TypeScript + Vite, installabile come app (PWA).
I dati restano solo sul telefono (localStorage).

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm install` | Scarica le librerie (la prima volta, o dopo aver cambiato `package.json`) |
| `npm run dev -- --host` | Server di sviluppo, anche dal telefono sullo stesso Wi-Fi |
| `npm test` | Test della logica (Vitest). `q` per uscire |
| `npm run lint` | Controllo dello stile (ESLint) |
| `npm run build` | Costruisce l'app finale in `dist/` |

Ogni push su `main` viene testato, costruito e pubblicato da GitHub Actions (`.github/workflows/deploy.yml`)
su https://nadia579.github.io/auria/

## Dove mettere le mani

```
src/
├── App.tsx              chi possiede i dati, quale pagina mostrare
├── index.css            colori e misure (token): cambia qui il viola, l'oro, la misura delle icone
├── hooks/
│   └── useNavigation.ts pagine e tasto indietro di Android
├── lib/                 la logica, senza interfaccia (testata in logic.test.ts)
│   ├── storage.ts       modello dati e migrazione
│   ├── dates.ts         date come chiavi "2026-10-25"
│   ├── cycle.ts         periodi, medie, previsioni, finestra fertile
│   ├── contraception.ts cerotto / pillola / anello, con ricalibrazione
│   ├── migraine.ts      elenchi (sintomi, cause...) e aiuti per gli attacchi
│   ├── stats.ts         statistiche ed emicrania-ciclo
│   ├── lock.ts          PIN e impronta
│   └── files.ts         backup e promemoria .ics
├── components/          le schermate e i pezzi riutilizzabili
└── icons/auria/         le TUE icone SVG: il nome del file diventa ~icons/auria/<nome>
```

Cose frequenti:
- **Aggiungere un sintomo**: un file SVG in `src/icons/auria`, un import e una riga in `components/Symptoms.tsx`
- **Aggiungere una causa dell'emicrania**: una parola nell'elenco `TRIGGERS` di `lib/migraine.ts`
- **Cambiare colori**: `src/index.css`, sezione `:root` (chiaro) e `@media (prefers-color-scheme: dark)` (scuro)
- **Cambiare un campo dei dati**: `lib/storage.ts`, e in `migrate()` il valore per i dati già salvati
