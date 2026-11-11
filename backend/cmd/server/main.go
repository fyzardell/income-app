package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"income-backend/internal/cache"
	"income-backend/internal/config"
	"income-backend/internal/database"
	"income-backend/internal/gateway"
	"income-backend/internal/handler"
	"income-backend/internal/middleware"
	"income-backend/internal/models"
	"income-backend/internal/repository"
	"income-backend/internal/service"
)

func main() {
	cfg := config.Load()
	log.Printf("[SERVER] Starting INCOME Coffee & Bakery Backend on port %s...", cfg.Port)

	// 1. Initialize MySQL database
	db, err := database.Connect(cfg.DBSource)
	if err != nil {
		log.Printf("[DATABASE] Warning: Failed to connect to MySQL: %v. Please make sure Laragon MySQL is running.", err)
		log.Println("[DATABASE] The server will still start, but database operations will return connection errors until MySQL is up.")
	} else {
		defer db.Close()
	}

	// 2. Initialize Redis Cache (with graceful in-memory fallback)
	cacheClient := cache.New(cfg.RedisHost, cfg.RedisPass, cfg.RedisDB)
	log.Printf("[CACHE] Cache system active using: %s", cacheClient.ProviderName())

	// 3. Initialize Repositories, Services, Gateway
	repo := repository.New(db)
	gw := gateway.NewMockGateway("income_gateway_secret_key_2026")
	svc := service.New(repo, cacheClient, gw, cfg.JWTSecret)
	h := handler.New(svc)

	// 4. Setup HTTP Router
	mux := http.NewServeMux()

	// --- Public endpoints ---
	mux.HandleFunc("/api/health", h.Health)
	mux.HandleFunc("/api/website/ticker", h.GetTicker)
	mux.HandleFunc("/api/website/testimonials", h.GetTestimonials)
	mux.HandleFunc("/api/branches", h.GetBranches)
	mux.HandleFunc("/api/tables/validate-qr", h.ValidateQR)
	mux.HandleFunc("/api/auth/otp/request", h.RequestOTP)
	mux.HandleFunc("/api/auth/otp/verify", h.VerifyOTP)
	mux.HandleFunc("/api/auth/staff/login", h.StaffLogin)
	mux.HandleFunc("/api/payments/webhook", h.PaymentWebhook)

	// Dynamic sub-routes
	mux.HandleFunc("/api/branches/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/tables") {
			h.GetBranchTables(w, r)
		} else if strings.HasSuffix(r.URL.Path, "/menu") {
			h.GetBranchMenu(w, r)
		} else {
			h.GetBranches(w, r)
		}
	})

	mux.HandleFunc("/api/orders/track/", h.TrackOrder)

	// --- Authenticated Customer Endpoints ---
	customerAuth := middleware.Auth(cfg.JWTSecret, false)
	mux.Handle("/api/customer/profile", customerAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPut {
			h.UpdateProfile(w, r)
		} else {
			h.GetProfile(w, r)
		}
	})))

	mux.Handle("/api/orders", customerAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			h.CreateOrder(w, r)
		} else {
			h.GetCustomerOrders(w, r)
		}
	})))

	mux.Handle("/api/orders/", customerAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/cancel") && r.Method == http.MethodPost {
			h.RequestCancellation(w, r)
		} else {
			http.NotFound(w, r)
		}
	})))

	// --- Cashier Endpoints ---
	cashierAuth := func(next http.Handler) http.Handler {
		return customerAuth(middleware.RequireRole(models.RoleCashier, models.RoleAdmin)(next))
	}

	mux.Handle("/api/cashier/orders", cashierAuth(http.HandlerFunc(h.GetCashierOrders)))
	mux.Handle("/api/cashier/orders/", cashierAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/status") && r.Method == http.MethodPut {
			h.UpdateOrderStatus(w, r)
		} else if strings.HasSuffix(r.URL.Path, "/confirm-cash") && r.Method == http.MethodPost {
			h.ConfirmCashPayment(w, r)
		} else if strings.HasSuffix(r.URL.Path, "/speaker") && r.Method == http.MethodPost {
			h.TriggerSpeaker(w, r)
		} else {
			http.NotFound(w, r)
		}
	})))

	mux.Handle("/api/cashier/speaker-logs", cashierAuth(http.HandlerFunc(h.GetSpeakerLogs)))
	mux.Handle("/api/cashier/products/", cashierAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/availability") && r.Method == http.MethodPut {
			h.ToggleProductAvailability(w, r)
		} else {
			http.NotFound(w, r)
		}
	})))

	mux.Handle("/api/cashier/cancellations", cashierAuth(http.HandlerFunc(h.GetCancellations)))
	mux.Handle("/api/cashier/cancellations/", cashierAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/decide") && r.Method == http.MethodPost {
			h.DecideCancellation(w, r)
		} else {
			http.NotFound(w, r)
		}
	})))

	// --- Admin Endpoints ---
	adminAuth := func(next http.Handler) http.Handler {
		return customerAuth(middleware.RequireRole(models.RoleAdmin)(next))
	}
	mux.Handle("/api/admin/reports", adminAuth(http.HandlerFunc(h.GetReports)))
	mux.Handle("/api/admin/price", adminAuth(http.HandlerFunc(h.UpdateBranchPrice)))
	mux.Handle("/api/admin/products", adminAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			h.CreateProduct(w, r)
		} else {
			http.NotFound(w, r)
		}
	})))
	mux.Handle("/api/admin/products/", adminAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodDelete {
			h.DeleteProduct(w, r)
		} else {
			http.NotFound(w, r)
		}
	})))

	// --- Serve Static Assets (images, logos) ---
	// Look for assets directory in parent or current dir
	assetsDir := "../assets"
	if _, err := os.Stat(assetsDir); os.IsNotExist(err) {
		assetsDir = "assets"
	}
	absAssets, _ := filepath.Abs(assetsDir)
	log.Printf("[SERVER] Serving static assets from %s", absAssets)
	fileServer := http.StripPrefix("/assets/", http.FileServer(http.Dir(absAssets)))
	mux.Handle("/assets/", fileServer)

	// --- Serve Frontend Dist if available (Single-page app mode) ---
	frontendDist := "dist"
	if fi, err := os.Stat(frontendDist); os.IsNotExist(err) || !fi.IsDir() {
		frontendDist = "../frontend/dist"
		if fi2, err2 := os.Stat(frontendDist); os.IsNotExist(err2) || !fi2.IsDir() {
			frontendDist = "frontend/dist"
		}
	}
	if fi, err := os.Stat(frontendDist); err == nil && fi.IsDir() {
		absDist, _ := filepath.Abs(frontendDist)
		log.Printf("[SERVER] Serving built React frontend from %s", absDist)
		distFS := http.FileServer(http.Dir(absDist))
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			if strings.HasPrefix(r.URL.Path, "/api/") || strings.HasPrefix(r.URL.Path, "/assets/") {
				http.NotFound(w, r)
				return
			}
			filePath := filepath.Join(absDist, filepath.Clean(r.URL.Path))
			if info, err := os.Stat(filePath); err == nil && !info.IsDir() {
				distFS.ServeHTTP(w, r)
				return
			}
			http.ServeFile(w, r, filepath.Join(absDist, "index.html"))
		})
	}

	// Combine Middlewares: Recoverer -> CORS -> Logger -> Mux
	handlerChain := middleware.Recoverer(middleware.CORS(middleware.RequestLogger(mux)))

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handlerChain,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown channel
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		fmt.Printf("\n=======================================================\n")
		fmt.Printf("   INCOME Coffee & Bakery Backend (Go) is Running!     \n")
		fmt.Printf("   - API URL:       http://localhost:%s/api/health      \n", cfg.Port)
		fmt.Printf("   - Database:      MySQL (%s)\n", cfg.DBDriver)
		fmt.Printf("   - Cache:         %s (%s)\n", cacheClient.ProviderName(), cfg.RedisHost)
		fmt.Printf("   - Frontend URL:  %s\n", cfg.FrontendURL)
		fmt.Printf("=======================================================\n\n")

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[SERVER] Could not listen on port %s: %v", cfg.Port, err)
		}
	}()

	<-stop
	log.Println("[SERVER] Shutting down gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("[SERVER] Server forced to shutdown: %v", err)
	}

	log.Println("[SERVER] Server exited cleanly.")
}
