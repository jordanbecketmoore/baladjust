**Actual Budget — BalAdjust**

A minimal Node.js utility for adjusting and inspecting account data for budgeting workflows.

**Contents**
- **Project:**: Simple CLI-focused budget adjustment helper.
- **Language:**: JavaScript (Node.js)
- **Files:**: `config.example.json`, `index.js`, `package.json`, `LICENSE`

**Quick Start**
- **Install:**: Run `npm install` to install dependencies defined in `package.json`.
- **Run:**: Use `node index.js` to run the main script. See any CLI options printed by the script if present.

**Configuration**
- **Example config:**: Copy `config.example.json` to `config.json` and update values to match your environment.
- **Accounts file:**: `accounts.json` contains the account data used by the script. Back up before editing.

**Usage**
- Typical flow: adjust `config.json` → run `node index.js` → review output.

**Development**
- Node version: Use a recent Node.js LTS (v18+ recommended).
- To add dependencies: run `npm install <pkg> --save`.