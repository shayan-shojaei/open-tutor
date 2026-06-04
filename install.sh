#!/usr/bin/env bash
set -euo pipefail

REPO="shayan-shojaei/open-tutor"
INSTALL_DIR="${TUTOR_INSTALL_DIR:-$HOME/.local/bin}"
BINARY_NAME="tutor"

# ── helpers ────────────────────────────────────────────────────────────────────

info()  { printf '\033[1;34m==> \033[0m%s\n' "$*"; }
ok()    { printf '\033[1;32m  ✓ \033[0m%s\n' "$*"; }
die()   { printf '\033[1;31merror: \033[0m%s\n' "$*" >&2; exit 1; }

need() {
  command -v "$1" >/dev/null 2>&1 || die "'$1' is required but not installed."
}

check_node() {
  if command -v node >/dev/null 2>&1; then
    ok "Node.js found: $(node --version)"
    return
  fi
  printf '\n  \033[1;31merror:\033[0m Node.js is required but was not found.\n'
  case "$(uname -s)" in
    Darwin)
      printf '  Install it with Homebrew: \033[1mbrew install node\033[0m\n'
      printf '  Or via nvm:               \033[1mnvm install --lts\033[0m\n' ;;
    Linux)
      printf '  Install it via nvm:       \033[1mnvm install --lts\033[0m\n'
      printf '  Or via your package manager (apt/dnf/pacman).\n' ;;
  esac
  printf '  See https://nodejs.org for all options.\n\n'
  exit 1
}

# ── detect platform ────────────────────────────────────────────────────────────

detect_platform() {
  local os arch
  os="$(uname -s)"
  arch="$(uname -m)"

  case "$os" in
    Linux)
      case "$arch" in
        x86_64) echo "linux-amd64" ;;
        *)       die "Unsupported Linux architecture: $arch" ;;
      esac ;;
    Darwin)
      case "$arch" in
        x86_64) echo "darwin-amd64" ;;
        arm64)  echo "darwin-arm64" ;;
        *)       die "Unsupported macOS architecture: $arch" ;;
      esac ;;
    *)
      die "Unsupported OS: $os (Windows users: download tutor-windows-amd64.exe from the Releases page)" ;;
  esac
}

# ── resolve latest version ─────────────────────────────────────────────────────

latest_version() {
  need curl
  curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" \
    | grep '"tag_name"' \
    | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/'
}

# ── main ───────────────────────────────────────────────────────────────────────

main() {
  need curl
  check_node

  local version="${TUTOR_VERSION:-}"
  if [[ -z "$version" ]]; then
    info "Fetching latest release..."
    version="$(latest_version)"
  fi
  ok "Version: $version"

  local platform
  platform="$(detect_platform)"
  ok "Platform: $platform"

  local url="https://github.com/${REPO}/releases/download/${version}/tutor-${platform}"
  local tmp
  tmp="$(mktemp)"

  info "Downloading CLI binary..."
  curl -fsSL "$url" -o "$tmp"
  chmod +x "$tmp"

  info "Installing to ${INSTALL_DIR}/${BINARY_NAME}..."
  mkdir -p "$INSTALL_DIR"
  mv "$tmp" "${INSTALL_DIR}/${BINARY_NAME}"
  ok "Installed tutor $(${INSTALL_DIR}/${BINARY_NAME} --version 2>/dev/null || echo "$version")"

  if [[ ":$PATH:" != *":${INSTALL_DIR}:"* ]]; then
    printf '\n  \033[1;33mNote:\033[0m %s is not on your PATH.\n' "${INSTALL_DIR}"
    printf '  Add this to your shell profile (~/.bashrc, ~/.zshrc, etc.):\n\n'
    printf '    export PATH="$HOME/.local/bin:$PATH"\n\n'
  fi

  info "Initialising tutor directory..."
  "${INSTALL_DIR}/${BINARY_NAME}" init

  info "Downloading web app..."
  "${INSTALL_DIR}/${BINARY_NAME}" install

  printf '\n  All done! Run \033[1mtutor start\033[0m to launch Open Tutor.\n\n'
}

main "$@"
