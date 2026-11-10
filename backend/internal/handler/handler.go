package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"income-backend/internal/middleware"
	"income-backend/internal/models"
	"income-backend/internal/service"
)

type Handler struct {
	svc *service.Service
}

func New(svc *service.Service) *Handler {
	return &Handler{svc: svc}
}

// Helper methods
func jsonResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func errorResponse(w http.ResponseWriter, status int, message string) {
	jsonResponse(w, status, map[string]string{"error": message})
}

func getAuthUser(r *http.Request) *middleware.JWTClaims {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	if !ok {
		return nil
	}
	return claims
}

// ==================== HEALTH & WEBSITE ====================

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	jsonResponse(w, http.StatusOK, map[string]interface{}{
		"status":  "ok",
		"service": "INCOME Coffee & Bakery API",
		"version": "1.0.0",
	})
}

func (h *Handler) GetTicker(w http.ResponseWriter, r *http.Request) {
	items, err := h.svc.GetTickerItems(r.Context())
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	jsonResponse(w, http.StatusOK, items)
}

func (h *Handler) GetTestimonials(w http.ResponseWriter, r *http.Request) {
	list, err := h.svc.GetTestimonials(r.Context())
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	jsonResponse(w, http.StatusOK, list)
}

// ==================== BRANCHES & MENU ====================

func (h *Handler) GetBranches(w http.ResponseWriter, r *http.Request) {
	branches, err := h.svc.GetBranches(r.Context())
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	jsonResponse(w, http.StatusOK, branches)
}

func (h *Handler) GetBranchTables(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/branches/")
	idStr = strings.TrimSuffix(idStr, "/tables")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		errorResponse(w, http.StatusBadRequest, "Invalid branch ID")
		return
	}

	tables, err := h.svc.GetBranchTables(r.Context(), id)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	jsonResponse(w, http.StatusOK, tables)
}

func (h *Handler) ValidateQR(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	table, branch, err := h.svc.ValidateQRToken(r.Context(), token)
	if err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error())
		return
	}
	jsonResponse(w, http.StatusOK, map[string]interface{}{
		"table":  table,
		"branch": branch,
	})
}

func (h *Handler) GetBranchMenu(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/branches/")
	idStr = strings.TrimSuffix(idStr, "/menu")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		errorResponse(w, http.StatusBadRequest, "Invalid branch ID")
		return
	}

	menu, err := h.svc.GetBranchCatalog(r.Context(), id)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	jsonResponse(w, http.StatusOK, menu)
}

// ==================== AUTH ====================

func (h *Handler) RequestOTP(w http.ResponseWriter, r *http.Request) {
	var req models.OTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	otp, err := h.svc.RequestOTP(r.Context(), req.WhatsAppNumber)
	if err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	jsonResponse(w, http.StatusOK, map[string]interface{}{
		"message":   "Kode OTP berhasil dikirim ke WhatsApp",
		"debug_otp": otp, // Included for easy offline testing without live WA credentials
	})
}

func (h *Handler) VerifyOTP(w http.ResponseWriter, r *http.Request) {
	var req models.OTPVerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	user, token, err := h.svc.VerifyOTP(r.Context(), req.WhatsAppNumber, req.OTP, req.Name)
	if err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	jsonResponse(w, http.StatusOK, map[string]interface{}{
		"message": "Login berhasil",
		"token":   token,
		"user":    user,
	})
}

func (h *Handler) StaffLogin(w http.ResponseWriter, r *http.Request) {
	var req models.StaffLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, http.StatusBadRequest, "Format JSON tidak valid")
		return
	}

	user, token, err := h.svc.StaffLogin(r.Context(), req.WhatsAppNumber, req.Password)
	if err != nil {
		errorResponse(w, http.StatusUnauthorized, err.Error())
		return
	}

	jsonResponse(w, http.StatusOK, map[string]interface{}{
		"message": "Login staf berhasil",
		"token":   token,
		"user":    user,
	})
}

func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	user := getAuthUser(r)
	if user == nil {
		errorResponse(w, http.StatusUnauthorized, "Sesi tidak valid")
		return
	}
	jsonResponse(w, http.StatusOK, user)
}

func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userClaims := getAuthUser(r)
	var req models.ProfileUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, http.StatusBadRequest, "Format data tidak valid")
		return
	}

	user, err := h.svc.UpdateProfile(r.Context(), userClaims.UserID, req.Name)
	if err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error())
		return
	}
	jsonResponse(w, http.StatusOK, user)
}

// ==================== ORDERS ====================

func (h *Handler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	userClaims := getAuthUser(r)
	if userClaims == nil {
		errorResponse(w, http.StatusUnauthorized, "Harap login terlebih dahulu sebelum memesan")
		return
	}

	var req models.CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, http.StatusBadRequest, "Format order tidak valid: "+err.Error())
		return
	}

	order, err := h.svc.CreateOrder(r.Context(), userClaims.UserID, req)
	if err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	jsonResponse(w, http.StatusCreated, order)
}

func (h *Handler) GetCustomerOrders(w http.ResponseWriter, r *http.Request) {
	userClaims := getAuthUser(r)
	orders, err := h.svc.GetUserOrders(r.Context(), userClaims.UserID)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	jsonResponse(w, http.StatusOK, orders)
}

func (h *Handler) TrackOrder(w http.ResponseWriter, r *http.Request) {
	orderNumber := strings.TrimPrefix(r.URL.Path, "/api/orders/track/")
	order, err := h.svc.GetOrderByNumber(r.Context(), orderNumber)
	if err != nil {
		errorResponse(w, http.StatusNotFound, "Pesanan tidak ditemukan")
		return
	}
	jsonResponse(w, http.StatusOK, order)
}

func (h *Handler) RequestCancellation(w http.ResponseWriter, r *http.Request) {
	userClaims := getAuthUser(r)
	parts := strings.Split(r.URL.Path, "/")
	// /api/orders/:id/cancel
	if len(parts) < 4 {
		errorResponse(w, http.StatusBadRequest, "Invalid URL")
		return
	}
	orderID, _ := strconv.ParseInt(parts[3], 10, 64)

	var body struct {
		Reason string `json:"reason"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	if body.Reason == "" {
		body.Reason = "Dibatalkan oleh pelanggan"
	}

	req, err := h.svc.RequestCancellation(r.Context(), orderID, userClaims.UserID, body.Reason)
	if err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error())
		return
	}
	jsonResponse(w, http.StatusOK, req)
}

// ==================== CASHIER ACTIONS ====================

func (h *Handler) GetCashierOrders(w http.ResponseWriter, r *http.Request) {
	userClaims := getAuthUser(r)
	branchID := int64(0)
	if userClaims.BranchID != nil {
		branchID = *userClaims.BranchID
	}
	if bParam := r.URL.Query().Get("branch_id"); bParam != "" && userClaims.Role == models.RoleAdmin {
		branchID, _ = strconv.ParseInt(bParam, 10, 64)
	}

	statusFilter := r.URL.Query().Get("status")
	orders, err := h.svc.GetBranchOrders(r.Context(), branchID, statusFilter)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	jsonResponse(w, http.StatusOK, orders)
}

func (h *Handler) UpdateOrderStatus(w http.ResponseWriter, r *http.Request) {
	userClaims := getAuthUser(r)
	parts := strings.Split(r.URL.Path, "/")
	// /api/cashier/orders/:id/status
	if len(parts) < 5 {
		errorResponse(w, http.StatusBadRequest, "Invalid URL")
		return
	}
	orderID, _ := strconv.ParseInt(parts[4], 10, 64)

	var body struct {
		Status models.OrderStatus `json:"status"`
		Notes  string             `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		errorResponse(w, http.StatusBadRequest, "Format status tidak valid")
		return
	}

	if err := h.svc.AdvanceOrderStatus(r.Context(), orderID, body.Status, userClaims.UserID, body.Notes); err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	jsonResponse(w, http.StatusOK, map[string]string{"message": "Status berhasil diperbarui"})
}

func (h *Handler) ConfirmCashPayment(w http.ResponseWriter, r *http.Request) {
	userClaims := getAuthUser(r)
	parts := strings.Split(r.URL.Path, "/")
	// /api/cashier/orders/:id/confirm-cash
	orderID, _ := strconv.ParseInt(parts[4], 10, 64)

	if err := h.svc.ConfirmCashPayment(r.Context(), orderID, userClaims.UserID); err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	jsonResponse(w, http.StatusOK, map[string]string{"message": "Pembayaran cash berhasil dikonfirmasi"})
}

func (h *Handler) TriggerSpeaker(w http.ResponseWriter, r *http.Request) {
	userClaims := getAuthUser(r)
	parts := strings.Split(r.URL.Path, "/")
	// /api/cashier/orders/:id/speaker
	orderID, _ := strconv.ParseInt(parts[4], 10, 64)

	announcement, err := h.svc.TriggerSpeakerAnnouncement(r.Context(), orderID, userClaims.UserID)
	if err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	jsonResponse(w, http.StatusOK, announcement)
}

func (h *Handler) GetSpeakerLogs(w http.ResponseWriter, r *http.Request) {
	userClaims := getAuthUser(r)
	branchID := int64(1)
	if userClaims.BranchID != nil {
		branchID = *userClaims.BranchID
	}
	logs, err := h.svc.GetSpeakerAnnouncements(r.Context(), branchID)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	jsonResponse(w, http.StatusOK, logs)
}

func (h *Handler) ToggleProductAvailability(w http.ResponseWriter, r *http.Request) {
	userClaims := getAuthUser(r)
	parts := strings.Split(r.URL.Path, "/")
	// /api/cashier/products/:id/availability
	productID, _ := strconv.ParseInt(parts[4], 10, 64)

	var body struct {
		IsAvailable bool  `json:"is_available"`
		BranchID    int64 `json:"branch_id"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)

	branchID := body.BranchID
	if userClaims.BranchID != nil {
		branchID = *userClaims.BranchID
	}

	if err := h.svc.ToggleProductAvailability(r.Context(), branchID, productID, body.IsAvailable); err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	jsonResponse(w, http.StatusOK, map[string]interface{}{
		"message":      "Ketersediaan produk berhasil diperbarui",
		"product_id":   productID,
		"is_available": body.IsAvailable,
	})
}

func (h *Handler) GetCancellations(w http.ResponseWriter, r *http.Request) {
	userClaims := getAuthUser(r)
	branchID := int64(0)
	if userClaims.BranchID != nil {
		branchID = *userClaims.BranchID
	}
	list, err := h.svc.GetCancellationRequests(r.Context(), branchID)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	jsonResponse(w, http.StatusOK, list)
}

func (h *Handler) DecideCancellation(w http.ResponseWriter, r *http.Request) {
	userClaims := getAuthUser(r)
	parts := strings.Split(r.URL.Path, "/")
	// /api/cashier/cancellations/:id/decide
	reqID, _ := strconv.ParseInt(parts[4], 10, 64)

	var body struct {
		Approve bool   `json:"approve"`
		Notes   string `json:"notes"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)

	if err := h.svc.DecideCancellation(r.Context(), reqID, userClaims.UserID, body.Approve, body.Notes); err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	jsonResponse(w, http.StatusOK, map[string]string{"message": "Keputusan pembatalan berhasil disimpan"})
}

// ==================== ADMIN ACTIONS ====================

func (h *Handler) GetReports(w http.ResponseWriter, r *http.Request) {
	reports, err := h.svc.GetReports(r.Context())
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	jsonResponse(w, http.StatusOK, reports)
}

func (h *Handler) UpdateBranchPrice(w http.ResponseWriter, r *http.Request) {
	var body struct {
		BranchID  int64   `json:"branch_id"`
		ProductID int64   `json:"product_id"`
		Price     float64 `json:"price"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		errorResponse(w, http.StatusBadRequest, "Invalid data")
		return
	}

	if err := h.svc.UpdateBranchPrice(r.Context(), body.BranchID, body.ProductID, body.Price); err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	jsonResponse(w, http.StatusOK, map[string]string{"message": "Harga cabang berhasil diperbarui"})
}

func (h *Handler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	var p models.Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		errorResponse(w, http.StatusBadRequest, "Invalid product data")
		return
	}

	created, err := h.svc.CreateProduct(r.Context(), &p)
	if err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	jsonResponse(w, http.StatusCreated, created)
}

func (h *Handler) DeleteProduct(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	// /api/admin/products/:id
	if len(parts) < 5 {
		errorResponse(w, http.StatusBadRequest, "Invalid URL")
		return
	}
	productID, _ := strconv.ParseInt(parts[4], 10, 64)

	if err := h.svc.DeleteProduct(r.Context(), productID); err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	jsonResponse(w, http.StatusOK, map[string]string{"message": "Produk berhasil dihapus"})
}

// ==================== PAYMENT WEBHOOK ====================

func (h *Handler) PaymentWebhook(w http.ResponseWriter, r *http.Request) {
	var payload models.WebhookPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		errorResponse(w, http.StatusBadRequest, "Invalid webhook body")
		return
	}

	if err := h.svc.ProcessPaymentWebhook(r.Context(), payload); err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	jsonResponse(w, http.StatusOK, map[string]string{"status": "processed"})
}
