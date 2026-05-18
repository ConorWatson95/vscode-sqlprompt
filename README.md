# SQL Prompt for VS Code

SQL Server IntelliSense extension (LSP-based) — schema-aware autocomplete simile a Redgate SQL Prompt.

## Prerequisiti

- Node.js >= 18
- VS Code >= 1.75
- Estensione **ms-mssql.mssql** (SQL Server for VS Code) — viene installata automaticamente come dipendenza

## Integrazione con ms-mssql

SQL Prompt usa la **connessione attiva nel file corrente** gestita dall'estensione ms-mssql, senza richiedere credenziali separate.

### Workflow

1. Apri un file `.sql`
2. Connettiti al database tramite il tasto nella status bar di ms-mssql (o `Ctrl+Shift+P` → **MS SQL: Connect**)
3. SQL Prompt rileva automaticamente la connessione e carica lo schema
4. L'IntelliSense con alias è subito disponibile

Ogni volta che porti il focus su un file `.sql` diverso con una connessione ms-mssql diversa, lo schema si aggiorna automaticamente.

### Comandi disponibili

| Comando | Descrizione |
|---------|-------------|
| `SQL Prompt: Connect to Database` | Apre il dialog di connessione ms-mssql per il file corrente |
| `SQL Prompt: Disconnect` | Disconnette il Language Server |
| `SQL Prompt: Reload Schema` | Forza il ricaricamento dello schema |

---

## ⚠️ Disabilitare l'IntelliSense di ms-mssql

L'estensione ms-mssql fornisce il proprio IntelliSense per i file `.sql`. Se entrambe le estensioni sono attive, l'elenco di completamento mostra voci doppie: quelle di ms-mssql (senza alias) e quelle di SQL Prompt (con alias `AS od`).

Per evitare i duplicati e garantire che vengano inseriti gli alias, **disabilita l'IntelliSense di ms-mssql**:

### Opzione A — Workspace settings (consigliato)

Aggiungi in `.vscode/settings.json` del progetto:

```json
{
  "mssql.intelliSense.enableIntellisense": false
}
```

### Opzione B — User settings (globale)

Apri `Ctrl+,` → cerca `mssql intellisense` → disabilita **Mssql: Enable Intellisense**.

Oppure aggiungi in `settings.json` utente:

```json
{
  "mssql.intelliSense.enableIntellisense": false
}
```

> Dopo aver modificato il setting, potrebbe essere necessario ricaricare la finestra (`Ctrl+Shift+P` → **Developer: Reload Window**).

---

## Come funziona l'IntelliSense

Quando scrivi in un file `.sql`:

```sql
SELECT * FROM |
```

Dopo `FROM` (o `JOIN`), l'estensione propone tutte le tabelle con schema prefix e alias automatico:

- `dbo.ORDINI_DETTAGLIO AS od`
- `dbo.OrderDetails AS od`
- `dbo.Orders AS o`

**Logica alias:**
- `ORDINI_DETTAGLIO` → `od` (prima lettera di ogni parola separata da `_`)
- `OrderDetails` → `od` (lettere maiuscole in PascalCase)
- `Orders` → `o` (parola singola → prima lettera)

L'alias viene inserito anche quando si digita la parte iniziale del nome (es. `FROM dbo.Ord` → selezionando la voce si ottiene `dbo.Orders AS o`).

---

## Architettura

```
vscode-sqlprompt/
├── package.json              # Extension manifest
├── tsconfig.json             # Root TS project references
├── client/                   # Language Client (VS Code extension)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── extension.ts      # Entry point: avvia il Language Server
├── server/                   # Language Server (processo separato)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts         # LSP server: gestisce completion
│       └── schemaLoader.ts   # Connessione SQL Server e caricamento schema
└── .vscode/
    ├── launch.json           # Debug configurations
    └── tasks.json            # Build tasks
```

## Flusso

```
┌─────────────────────┐                          ┌──────────────────────┐
│   VS Code (Client)  │ ◄── LSP / IPC ─────────► │   Language Server    │
│                     │                          │                      │
│  extension.ts       │  sqlPrompt/updateConnection  server.ts          │
│  - legge connessione│ ──────────────────────►  │  - riconnette        │
│    da ms-mssql API  │                          │  - ricarica schema   │
│  - watch editor     │  onCompletion request    │                      │
│    focus            │ ──────────────────────►  │  schemaLoader.ts     │
│                     │  CompletionItem[]        │  - sql.connect(str)  │
│                     │ ◄──────────────────────  │  - query sys.tables  │
└─────────────────────┘                          └──────────────────────┘
         │
         │  ms-mssql API
         ▼
┌─────────────────────┐
│  ms-mssql extension │
│  (connessione file) │
└─────────────────────┘
```

## Setup sviluppo

```bash
cd ~/Development/vscode-sqlprompt
npm install   # installa root + client + server
npx tsc -b    # compila
```

Premi **F5** in VS Code per avviare l'Extension Development Host.

## Fallback: connessione manuale via settings

Se ms-mssql non è connesso, il Language Server tenta di usare `sqlPrompt.connection` da `settings.json` (comportamento precedente):

```json
{
  "sqlPrompt.connection": {
    "server": "localhost",
    "database": "MioDatabase",
    "user": "sa",
    "password": "LatuaPassword123",
    "port": 1433,
    "trustServerCertificate": true
  }
}
```

## Prossimi sviluppi

- [ ] Completamento colonne dopo alias (es. `od.` → colonne di ORDINI_DETTAGLIO)
- [ ] Snippet per INSERT, UPDATE, DELETE
- [ ] Supporto multi-database
- [ ] Stored procedures e views nell'IntelliSense
- [ ] Hover con info colonna
- [ ] Go to Definition su tabelle

```
vscode-sqlprompt/
├── package.json              # Extension manifest
├── tsconfig.json             # Root TS project references
├── client/                   # Language Client (VS Code extension)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── extension.ts      # Entry point: avvia il Language Server
├── server/                   # Language Server (processo separato)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts         # LSP server: gestisce completion
│       └── schemaLoader.ts   # Connessione SQL Server e caricamento schema
└── .vscode/
    ├── launch.json           # Debug configurations
    └── tasks.json            # Build tasks
```

## Flusso LSP

```
┌─────────────────────┐         LSP/IPC          ┌──────────────────────┐
│   VS Code (Client)  │ ◄──────────────────────► │   Language Server    │
│                     │                          │                      │
│  extension.ts       │   onCompletion request   │  server.ts           │
│  - avvia server     │ ──────────────────────►  │  - analizza contesto │
│  - comandi utente   │                          │  - propone tabelle   │
│                     │   CompletionItem[]       │                      │
│                     │ ◄──────────────────────  │  schemaLoader.ts     │
│                     │                          │  - connessione MSSQL │
└─────────────────────┘                          │  - query sys.tables  │
                                                 └──────────────────────┘
```

## Installazione e Primo Avvio

### Prerequisiti

- Node.js >= 18
- VS Code >= 1.75
- Un'istanza SQL Server raggiungibile

### Setup

```bash
cd ~/Development/vscode-sqlprompt

# Installa dipendenze (root + client + server)
npm install

# Compila
npx tsc -b
```

### Esecuzione in Development Mode

1. Apri la cartella `vscode-sqlprompt` in VS Code
2. Premi **F5** (o Run > Start Debugging)
3. Si apre una nuova finestra VS Code (Extension Development Host)
4. In quella finestra, apri un file `.sql`

### Configurazione Connessione

Aggiungi in `settings.json` (User o Workspace):

```json
{
  "sqlPrompt.connection": {
    "server": "localhost",
    "database": "MioDatabase",
    "user": "sa",
    "password": "LatuaPassword123",
    "port": 1433,
    "trustServerCertificate": true
  }
}
```

Oppure usa il comando **SQL Prompt: Connect to Database** (Ctrl+Shift+P) che ti guida interattivamente.

### Comandi Disponibili

| Comando | Descrizione |
|---------|-------------|
| `SQL Prompt: Connect to Database` | Connetti al database |
| `SQL Prompt: Disconnect` | Disconnetti |
| `SQL Prompt: Reload Schema` | Ricarica lo schema |

## Come Funziona l'IntelliSense

Quando scrivi in un file `.sql`:

```sql
SELECT * FROM |
```

Dopo `FROM` (o `JOIN`), l'estensione propone tutte le tabelle con:
- Schema prefix: `dbo.ORDINI_DETTAGLIO`
- Alias automatico: `AS od`

**Logica alias:**
- `ORDINI_DETTAGLIO` → `od` (prima lettera di ogni parola separata da `_`)
- `OrderDetails` → `od` (lettere maiuscole in PascalCase)
- `Orders` → `o` (parola singola → prima lettera)

Il completion inserisce: `dbo.ORDINI_DETTAGLIO AS od`

## Installazione come VSIX (pacchetto)

Per installare l'estensione permanentemente:

```bash
# Installa vsce (tool di packaging)
npm install -g @vscode/vsce

# Crea il pacchetto
cd ~/Development/vscode-sqlprompt
vsce package

# Installa il .vsix generato
code --install-extension vscode-sqlprompt-0.1.0.vsix
```

## Prossimi Sviluppi

- [ ] Join propone tabelle correlate (FK) e ON clause precompilata
- [ ] Completamento colonne dopo alias (es. `od.` → colonne di ORDINI_DETTAGLIO)
- [ ] Snippet per INSERT, UPDATE, DELETE
- [ ] Stored procedures e views nell'IntelliSense
- [ ] Hover con info colonna
- [ ] Go to Definition su tabelle
- [ ] Formattazione con stili redgate
- [ ] Supporto multi-database