# Installing Open Tutor

Open Tutor runs entirely on your own computer — no accounts, no internet connection needed after setup, and nothing is sent anywhere.

This guide will walk you through every step, even if you have never used a terminal before.

---

## Before You Begin

Open Tutor needs **Node.js 18 or newer** to run the web interface.

**Check if you already have it:**

Open a terminal (see the sections below for how) and type:

```
node --version
```

If you see a version number like `v20.11.0`, you are all set. If you see an error, download and install Node.js first:

**[Download Node.js (LTS version)](https://nodejs.org/en/download)**

Choose the installer for your operating system and run it. No special options are needed — just click through the defaults.

---

## macOS

### 1. Open Terminal

Press **Command + Space**, type `Terminal`, and press Enter. A black or white window will appear.

### 2. Run the installer

Paste this line into the terminal window and press Enter:

```bash
curl -fsSL https://raw.githubusercontent.com/shayan-shojaei/open-tutor/main/install.sh | bash
```

The script will:
- Download the `tutor` command to `~/.local/bin/`
- Set up the `~/.tutor/` folder on your machine
- Download the web app

> **Tip:** If you see `tutor: command not found` after installation, close the terminal and open a new one. If it still doesn't work, see [Troubleshooting](#troubleshooting).

---

## Windows

### 1. Open PowerShell

Press **Windows + S**, type `PowerShell`, and click **Windows PowerShell**. Do **not** run it as Administrator — a normal window is fine.

### 2. Allow scripts (one-time setup)

Paste this and press Enter:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Type `Y` and press Enter when prompted.

### 3. Run the installer

Paste this and press Enter:

```powershell
irm https://raw.githubusercontent.com/shayan-shojaei/open-tutor/main/install.ps1 | iex
```

The script will:
- Check for Node.js (and offer to install it via winget if missing)
- Download `tutor.exe` to `%USERPROFILE%\.local\bin\`
- Add that folder to your PATH so the `tutor` command works
- Set up the `~/.tutor/` folder and download the web app

> **Tip:** After installation, close PowerShell and open a new one for the `tutor` command to be available.

---

## Linux

### 1. Open a terminal

Most desktop environments have a terminal in the applications menu. You can also press **Ctrl + Alt + T** on many distributions.

### 2. Run the installer

```bash
curl -fsSL https://raw.githubusercontent.com/shayan-shojaei/open-tutor/main/install.sh | bash
```

The installer places `tutor` in `~/.local/bin/`. If your shell does not include that folder, add this line to `~/.bashrc` or `~/.zshrc` and restart the terminal:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

---

## Starting the App

Once installed, run:

```
tutor start
```

Then open your browser and go to:

```
http://localhost:3000
```

You will see the Open Tutor home screen with your installed modules.

> **Tip:** The app runs in the background. You can close the terminal — the app keeps running until you stop it.

---

## Installing Learning Modules

Modules are courses, flashcard decks, and quizzes. You can search for and install them with two commands.

**Search for modules by topic:**

```
tutor module search calculus
```

**Install a module:**

```
tutor module install open-tutor-sample-modules calculus-3
```

Replace `calculus-3` with the module ID shown in the search results. After installing, refresh your browser to see the new content.

---

## Stopping the App

```
tutor stop
```

---

## Updating Open Tutor

To download the latest version of the web app:

```
tutor upgrade
```

---

## Uninstalling

```
tutor uninstall
```

You will be asked whether to also delete your learning modules and settings:

- **No (default)** — Removes the app only. Your modules and progress are kept. You can reinstall later with `tutor install`.
- **Yes** — Removes everything under `~/.tutor/`, including all your modules, progress, and settings.

After uninstalling, you can also delete the `tutor` binary itself:

- **macOS / Linux:** `rm ~/.local/bin/tutor`
- **Windows:** Delete `%USERPROFILE%\.local\bin\tutor.exe`

---

## Troubleshooting

### `tutor: command not found`

The install directory is not in your PATH. Try opening a new terminal window. If the problem persists, add the install directory to your PATH:

- **macOS / Linux:** Add `export PATH="$HOME/.local/bin:$PATH"` to `~/.zshrc` or `~/.bashrc`, then restart the terminal.
- **Windows:** Open PowerShell and run `$env:PATH` to inspect the value. The installer should have added `%USERPROFILE%\.local\bin` automatically — if not, add it manually via **System Properties → Environment Variables**.

### `node: command not found`

Node.js is not installed. See [Before You Begin](#before-you-begin) for the download link.

### Port 3000 is already in use

Start the app on a different port:

```
tutor start --port 3001
```

Then visit `http://localhost:3001` instead.

### Windows: script cannot be loaded

If PowerShell shows a message about scripts being disabled, run this first:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try the install command again.

### The browser shows nothing after `tutor start`

Wait a few seconds and refresh — the server may still be starting up. If it still doesn't load, check the log:

```
cat ~/.tutor/tutor.log
```

If you see a Node.js error, make sure Node.js 18 or newer is installed (`node --version`).
