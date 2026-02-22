# Actual Budget — BalAdjust

A minimal Node.js utility for adjusting and inspecting account data for budgeting workflows.

## Contents
- **Project:**: Simple CLI-focused budget adjustment helper.
- **Language:**: JavaScript (Node.js)
- **Files:**: `config.example.json`, `index.js`, `package.json`, `LICENSE`

## Quick Start
- **Install:**: Run `npm install` to install dependencies defined in `package.json`.
- **Run:**: Use `node index.js` to run the main script. See any CLI options printed by the script if present.

## Configuration
- **Example config:**: Copy `config.example.json` to `config.json` and update values to match your environment.

## Usage
Typical flow: adjust `config.json` → run `node index.js` → review output.

## Docker Deployment
The containerized baladjust runs on a cron schedule. 
Set `CRON` environment variable to the cron schedule on which you want the baladjust to run. 
If SimpleFin access URL or setup token are not set in `config.json`, you can set them using the `SIMPLEFIN_ACCESSURL` and `SIMPLEFIN_SETUPTOKEN` environment variables, respectively. Access URL will be respected over setup tokens. 
TOOD: pattern for importing and/or generating configs