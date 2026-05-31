#!/usr/bin/env bash
set -euo pipefail

REPO="shayan-shojaei/open-tutor"
INSTALL_DIR="/usr/local/bin"
BINARY_NAME="tutor"

# ── helpers ────────────────────────────────────────────────────────────────────

info()  { printf '\033[1;34m==> \033[0m%s\n' "$*"; }
ok()    { printf '\033[1;32m  ✓ \033[0m%s\n' "$*"; }
die()   { printf '\033[1;31merror: \033[0m%s\n' "$*" >&2; exit 1; }

need() {
  command -v "$1" >/dev/null 2>&1 || die "'$1' is required but not installed."
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
  if [[ -w "$INSTALL_DIR" ]]; then
    mv "$tmp" "${INSTALL_DIR}/${BINARY_NAME}"
  else
    sudo mv "$tmp" "${INSTALL_DIR}/${BINARY_NAME}"
  fi
  ok "Installed tutor $(${INSTALL_DIR}/${BINARY_NAME} --version 2>/dev/null || echo "$version")"

  info "Initialising tutor directory..."
  "${INSTALL_DIR}/${BINARY_NAME}" init

  info "Downloading web app..."
  "${INSTALL_DIR}/${BINARY_NAME}" install

  echo ""
  echo "  All done! Run \033[1mtutor start\033[0m to launch Open Tutor."
  echo ""
}

main "$@"
