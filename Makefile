VERSION   := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
CLI_DIR   := cli
WEB_DIR   := web
BIN       := $(CLI_DIR)/tutor
TUTOR_HOME := $(HOME)/.tutor
APP_DIR   := $(TUTOR_HOME)/app
PORT      ?= 3000

LDFLAGS   := -ldflags "-s -w -X github.com/shayan-shojaei/open-tutor/internal/config.Version=$(VERSION)"

# ─── Colours ──────────────────────────────────────────────────────────────────
BOLD  := \033[1m
CYAN  := \033[36m
GREEN := \033[32m
RESET := \033[0m

.DEFAULT_GOAL := help

.PHONY: help build build-cli build-web web-deps test \
        dev package deploy-web init local-deploy start install clean

help: ## Show available targets
	@echo ""
	@echo "  $(BOLD)Open Tutor$(RESET) — local development targets"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-18s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "  Variables:  PORT=$(PORT)  VERSION=$(VERSION)"
	@echo ""

# ─── Build ────────────────────────────────────────────────────────────────────

build: build-cli build-web ## Build CLI binary and Next.js standalone output

build-cli: ## Compile → cli/tutor
	@echo "$(BOLD)Building CLI $(VERSION)...$(RESET)"
	cd $(CLI_DIR) && go build $(LDFLAGS) -o tutor .
	@echo "$(GREEN)✓ cli/tutor$(RESET)"

build-web: web-deps ## Build Next.js standalone output (web/.next/standalone/)
	@echo "$(BOLD)Building web app...$(RESET)"
	cd $(WEB_DIR) && npm run build
	@echo "$(GREEN)✓ web/.next/standalone$(RESET)"

web-deps: ## Install web npm dependencies
	@cd $(WEB_DIR) && npm install --silent

# ─── Test ─────────────────────────────────────────────────────────────────────

test: ## Run Go tests
	@echo "$(BOLD)Running tests...$(RESET)"
	cd $(CLI_DIR) && go test ./... -v

# ─── Local development ────────────────────────────────────────────────────────

dev: ## Start Next.js dev server (reads modules from ~/.tutor/modules/)
	@echo "$(BOLD)Starting dev server on http://localhost:$(PORT)$(RESET)"
	cd $(WEB_DIR) && PORT=$(PORT) npm run dev

# ─── Local install (full flow without a real GitHub release) ──────────────────

init: build-cli ## Create ~/.tutor/ directory structure (runs tutor init)
	./$(BIN) init

deploy-web: build-web ## Copy built web app into ~/.tutor/app/ (no tarball needed)
	@echo "$(BOLD)Deploying web app to $(APP_DIR)...$(RESET)"
	@mkdir -p $(APP_DIR)/.next
	@rm -rf $(APP_DIR)/.next $(APP_DIR)/node_modules $(APP_DIR)/server.js \
	        $(APP_DIR)/package.json $(APP_DIR)/public
	@cp -r $(WEB_DIR)/.next/standalone/. $(APP_DIR)/
	@cp -r $(WEB_DIR)/.next/static       $(APP_DIR)/.next/static
	@cp -r $(WEB_DIR)/public             $(APP_DIR)/public
	@echo "$(GREEN)✓ deployed to $(APP_DIR)$(RESET)"

local-deploy: init deploy-web ## Full local setup: init ~/.tutor/ + deploy web app
	@echo ""
	@echo "$(GREEN)$(BOLD)All set.$(RESET) Run $(CYAN)make start$(RESET) or $(CYAN)./cli/tutor start$(RESET)"

start: build-cli ## Build CLI and start the web app (PORT=3000)
	@echo "$(BOLD)Starting Open Tutor on port $(PORT)...$(RESET)"
	./$(BIN) start --port $(PORT)

# ─── Release packaging (mirrors what CI does on a tag push) ──────────────────

package: build-web ## Package web app as a release tarball → dist/
	@mkdir -p dist
	@cp -r $(WEB_DIR)/.next/static  $(WEB_DIR)/.next/standalone/.next/static
	@cp -r $(WEB_DIR)/public        $(WEB_DIR)/.next/standalone/public
	tar -czf dist/web-standalone-$(VERSION).tar.gz \
	  -C $(WEB_DIR)/.next/standalone .
	@cd dist && shasum -a 256 web-standalone-$(VERSION).tar.gz \
	  | awk '{print $$1}' > web-standalone-$(VERSION).sha256
	@echo "$(GREEN)✓ dist/web-standalone-$(VERSION).tar.gz$(RESET)"
	@echo "$(GREEN)✓ dist/web-standalone-$(VERSION).sha256$(RESET)"

# ─── Install CLI globally ────────────────────────────────────────────────────

install: build-cli ## Install tutor binary to $(GOPATH)/bin/
	@install -m 755 $(BIN) $$(go env GOPATH)/bin/tutor
	@echo "$(GREEN)✓ installed to $$(go env GOPATH)/bin/tutor$(RESET)"

# ─── Clean ────────────────────────────────────────────────────────────────────

clean: ## Remove build artifacts (binary, dist/, .next/)
	@rm -f $(BIN)
	@rm -rf dist/
	@rm -rf $(WEB_DIR)/.next/
	@echo "$(GREEN)✓ clean$(RESET)"
