# Front door of the project: every routine task has a target here.
# Run `make` (or `make help`) to list them.
#
# Recipes are indented with TABs (see .editorconfig).

# Recipes are single commands; fail fast and loudly.
SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c

# `make` with no arguments prints the help instead of running the first target.
.DEFAULT_GOAL := help

# ------------------------------------------------------------------------------
# Configuration (override on the command line, e.g. `make docs DOCS_PORT=8080`)
# ------------------------------------------------------------------------------
COMPOSE ?= docker compose
SERVICE ?= app

DOCKER_IMAGE ?= template-nextjs
DOCKER_TAG   ?= latest

# Inlined into the client bundle at build time — see the header of ./Dockerfile.
NEXT_PUBLIC_SITE_URL  ?= http://localhost:3000
NEXT_PUBLIC_SITE_NAME ?= Next.js Template

# Pinned so the docs render identically for everyone and in CI.
MKDOCS_IMAGE ?= squidfunk/mkdocs-material:9.7.7
DOCS_PORT    ?= 8000

# ##############################################################################
# General
# ##############################################################################
##@ General

.PHONY: help
help: ## Show this help message
	@awk 'BEGIN { FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n" } \
		/^[a-zA-Z0-9_-]+:.*##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } \
		/^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } \
		END { printf "\n" }' $(MAKEFILE_LIST)

.PHONY: setup
setup: ## Bootstrap a fresh clone: create .env, install deps and E2E browsers
	@test -f .env || { cp .env.example .env; echo "Created .env from .env.example"; }
	npm ci
	npm run test:e2e:install

.PHONY: install
install: ## Install dependencies from the lockfile (npm ci)
	npm ci

.PHONY: clean
clean: ## Delete every generated artifact (build output, coverage, node_modules)
	./scripts/clear-all.sh

# ##############################################################################
# Development
# ##############################################################################
##@ Development

.PHONY: dev
dev: ## Start the Next.js dev server on the host
	npm run dev

.PHONY: build
build: ## Build the production bundle
	npm run build

.PHONY: start
start: ## Serve a previously built production bundle
	npm run start

# ##############################################################################
# Quality
# ##############################################################################
##@ Quality

.PHONY: lint
lint: ## Run ESLint
	npm run lint

.PHONY: lint-fix
lint-fix: ## Run ESLint with autofix
	npm run lint:fix

.PHONY: format
format: ## Format the codebase with Prettier
	npm run format

.PHONY: format-check
format-check: ## Verify formatting without writing files
	npm run format:check

.PHONY: typecheck
typecheck: ## Type-check with tsc (no emit)
	npm run typecheck

.PHONY: test
test: ## Run the unit tests in watch mode (Vitest)
	npm run test

.PHONY: test-watch
test-watch: ## Alias for `make test` — Vitest in watch mode
	npm run test:watch

.PHONY: test-unit
test-unit: ## Run the unit tests once
	npm run test:unit

.PHONY: test-coverage
test-coverage: ## Run the unit tests once with a coverage report
	npm run test:coverage

.PHONY: test-e2e
test-e2e: ## Run the Playwright end-to-end tests
	npm run test:e2e

.PHONY: test-e2e-install
test-e2e-install: ## Install the Playwright browsers and their system deps
	npm run test:e2e:install

.PHONY: check
check: ## Full quality gate: format, lint, types, coverage and build
	@$(MAKE) --no-print-directory format-check
	@$(MAKE) --no-print-directory lint
	@$(MAKE) --no-print-directory typecheck
	@$(MAKE) --no-print-directory test-coverage
	@$(MAKE) --no-print-directory build

# ##############################################################################
# Docker
# ##############################################################################
##@ Docker

.PHONY: up
up: ## Build and start the dev container in the background
	$(COMPOSE) up --build --detach

.PHONY: down
down: ## Stop and remove the dev container and its network
	$(COMPOSE) down --remove-orphans

.PHONY: stop
stop: ## Stop the dev container without removing it
	$(COMPOSE) stop

.PHONY: restart
restart: ## Restart the dev container
	$(COMPOSE) restart $(SERVICE)

.PHONY: logs
logs: ## Follow the dev container logs
	$(COMPOSE) logs --follow $(SERVICE)

.PHONY: shell
shell: ## Open a shell inside the running dev container
	$(COMPOSE) exec $(SERVICE) bash

.PHONY: docker-build
docker-build: ## Build the production image (override DOCKER_IMAGE / DOCKER_TAG)
	docker build \
		--build-arg NEXT_PUBLIC_SITE_URL="$(NEXT_PUBLIC_SITE_URL)" \
		--build-arg NEXT_PUBLIC_SITE_NAME="$(NEXT_PUBLIC_SITE_NAME)" \
		--tag $(DOCKER_IMAGE):$(DOCKER_TAG) \
		.

.PHONY: docker-clean
docker-clean: ## Remove the dev stack (with volumes) and the production image
	-$(COMPOSE) down --volumes --remove-orphans
	-docker image rm $(DOCKER_IMAGE):$(DOCKER_TAG)

# ##############################################################################
# Documentation
# ##############################################################################
##@ Documentation

.PHONY: docs
docs: ## Serve the MkDocs site with live reload on http://localhost:8000
	docker run --rm -it \
		-p $(DOCS_PORT):8000 \
		-v $(CURDIR):/docs \
		$(MKDOCS_IMAGE)

.PHONY: docs-build
docs-build: ## Build the MkDocs site into ./site, failing on any warning
	docker run --rm \
		-v $(CURDIR):/docs \
		$(MKDOCS_IMAGE) build --strict
