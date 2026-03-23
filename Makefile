# ============================================================
# HRMS Narwasthu Group - Makefile
# Quick commands for Docker management
# ============================================================

.PHONY: help build up down restart logs status clean seed fresh

# Default target
help: ## Show this help
	@echo ============================================
	@echo   HRMS Narwasthu Group - Docker Commands
	@echo ============================================
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Docker Lifecycle ──────────────────────────────────────
build: ## Build all Docker images
	docker compose build --no-cache

up: ## Start all services
	docker compose up -d

down: ## Stop all services
	docker compose down

restart: ## Restart all services
	docker compose restart

start: build up ## Build and start everything
	@echo "🚀 HRMS Narwasthu Group is starting..."
	@echo "⏳ Waiting for services to initialize..."
	@timeout 30 2>/dev/null || sleep 30
	@echo ""
	@echo "============================================"
	@echo "  🎉 HRMS Narwasthu Group is READY!"
	@echo "============================================"
	@echo "  📊 Dashboard:  http://localhost:3000"
	@echo "  🔌 API:        http://localhost:8000/api"
	@echo "  💚 Health:     http://localhost:8000/api/health"
	@echo "  🌐 Unified:    http://localhost"
	@echo "============================================"

# ── Database ──────────────────────────────────────────────
migrate: ## Run database migrations
	docker compose exec backend php artisan migrate --force

seed: ## Run database seeders
	docker compose exec backend php artisan db:seed --force

fresh: ## Fresh migrate + seed (WARNING: drops all data)
	docker compose exec backend php artisan migrate:fresh --seed --force

backup: ## Backup database
	@mkdir -p backups
	docker compose exec mysql mysqldump -u root -p"$${MYSQL_ROOT_PASSWORD:-HrmsN@rwasthu2026!}" hrm_saas > backups/hrm_saas_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database backup saved to backups/"

# ── Maintenance ──────────────────────────────────────────
logs: ## Show all logs (follow)
	docker compose logs -f

logs-backend: ## Show backend logs
	docker compose logs -f backend

logs-frontend: ## Show frontend logs
	docker compose logs -f frontend

status: ## Show service status
	docker compose ps

shell: ## Open backend shell
	docker compose exec backend sh

tinker: ## Open Laravel Tinker
	docker compose exec backend php artisan tinker

redis-cli: ## Open Redis CLI
	docker compose exec redis redis-cli -a "$${REDIS_PASSWORD:-HrmsRedis2026!}"

# ── Cache ─────────────────────────────────────────────────
cache: ## Clear and rebuild all caches
	docker compose exec backend php artisan config:cache
	docker compose exec backend php artisan route:cache
	docker compose exec backend php artisan view:cache
	docker compose exec backend php artisan event:cache

cache-clear: ## Clear all caches
	docker compose exec backend php artisan config:clear
	docker compose exec backend php artisan route:clear
	docker compose exec backend php artisan view:clear
	docker compose exec backend php artisan cache:clear

# ── Cleanup ───────────────────────────────────────────────
clean: ## Remove all containers, images & volumes (DANGEROUS)
	docker compose down -v --rmi all --remove-orphans
	docker system prune -f

prune: ## Remove dangling images
	docker image prune -f
