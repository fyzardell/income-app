package models

import (
	"time"
)

type UserRole string

const (
	RoleCustomer UserRole = "customer"
	RoleCashier  UserRole = "cashier"
	RoleAdmin    UserRole = "admin"
)

type OrderStatus string

const (
	OrderStatusPendingPayment OrderStatus = "pending_payment"
	OrderStatusPlaced         OrderStatus = "placed"
	OrderStatusPreparing      OrderStatus = "preparing"
	OrderStatusReady          OrderStatus = "ready"
	OrderStatusCompleted      OrderStatus = "completed"
	OrderStatusCancelled      OrderStatus = "cancelled"
)

type PaymentStatus string

const (
	PaymentStatusPending          PaymentStatus = "pending"
	PaymentStatusPaid             PaymentStatus = "paid"
	PaymentStatusFailed           PaymentStatus = "failed"
	PaymentStatusExpired          PaymentStatus = "expired"
	PaymentStatusRefundPending    PaymentStatus = "refund_pending"
	PaymentStatusRefunded         PaymentStatus = "refunded"
	PaymentStatusPartiallyRefunded PaymentStatus = "partially_refunded"
)

type CancellationStatus string

const (
	CancellationRequested CancellationStatus = "requested"
	CancellationApproved  CancellationStatus = "approved"
	CancellationRejected  CancellationStatus = "rejected"
)

type SpeakerStatus string

const (
	SpeakerQueued  SpeakerStatus = "queued"
	SpeakerSent    SpeakerStatus = "sent"
	SpeakerFailed  SpeakerStatus = "failed"
	SpeakerRetried SpeakerStatus = "retried"
)

type User struct {
	ID             int64      `json:"id"`
	WhatsAppNumber string     `json:"whatsapp_number"`
	Name           string     `json:"name"`
	Role           UserRole   `json:"role"`
	PasswordHash   *string    `json:"-"`
	BranchID       *int64     `json:"branch_id,omitempty"` // For cashier assignment
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      *time.Time `json:"updated_at,omitempty"`
}

type Branch struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Address   string    `json:"address"`
	Phone     string    `json:"phone"`
	IsOpen    bool      `json:"is_open"`
	CreatedAt time.Time `json:"created_at"`
}

type DiningTable struct {
	ID        int64     `json:"id"`
	BranchID  int64     `json:"branch_id"`
	TableCode string    `json:"table_code"`
	QRToken   string    `json:"qr_token"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
}

type Category struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	Icon      string    `json:"icon"`
	SortOrder int       `json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
}

type ProductOption struct {
	ID              int64   `json:"id"`
	OptionGroupID   int64   `json:"option_group_id"`
	Name            string  `json:"name"`
	PriceAdjustment float64 `json:"price_adjustment"`
}

type ProductOptionGroup struct {
	ID           int64           `json:"id"`
	ProductID    *int64          `json:"product_id,omitempty"`
	CategoryID   *int64          `json:"category_id,omitempty"`
	Name         string          `json:"name"`
	IsRequired   bool            `json:"is_required"`
	MinSelection int             `json:"min_selection"`
	MaxSelection int             `json:"max_selection"`
	Options      []ProductOption `json:"options"`
}

type Product struct {
	ID             int64                `json:"id"`
	CategoryID     int64                `json:"category_id"`
	CategoryName   string               `json:"category_name,omitempty"`
	Name           string               `json:"name"`
	Description    string               `json:"description"`
	Image          string               `json:"image"`
	BasePrice      float64              `json:"base_price"`
	Price          float64              `json:"price"` // Branch-specific resolved price
	IsAvailable    bool                 `json:"is_available"` // Branch-specific availability
	IsSignature    bool                 `json:"is_signature"`
	SignatureBadge string               `json:"signature_badge,omitempty"`
	SignatureChips string               `json:"signature_chips,omitempty"`
	IsActive       bool                 `json:"is_active"`
	SortOrder      int                  `json:"sort_order"`
	OptionGroups   []ProductOptionGroup `json:"option_groups,omitempty"`
}

type OrderItemOption struct {
	ID                 int64   `json:"id"`
	OrderItemID        int64   `json:"order_item_id"`
	OptionID           *int64  `json:"option_id,omitempty"`
	GroupNameSnapshot  string  `json:"group_name_snapshot"`
	OptionNameSnapshot string  `json:"option_name_snapshot"`
	PriceAdjustment    float64 `json:"price_adjustment"`
}

type OrderItem struct {
	ID                  int64             `json:"id"`
	OrderID             int64             `json:"order_id"`
	ProductID           int64             `json:"product_id"`
	ProductNameSnapshot string            `json:"product_name_snapshot"`
	UnitPrice           float64           `json:"unit_price"`
	Quantity            int               `json:"quantity"`
	Subtotal            float64           `json:"subtotal"`
	Notes               string            `json:"notes,omitempty"`
	Options             []OrderItemOption `json:"options,omitempty"`
}

type Order struct {
	ID                   int64         `json:"id"`
	OrderNumber          string        `json:"order_number"`
	UserID               int64         `json:"user_id"`
	BranchID             int64         `json:"branch_id"`
	BranchName           string        `json:"branch_name,omitempty"`
	DiningTableID        int64         `json:"dining_table_id"`
	TableCode            string        `json:"table_code,omitempty"`
	CustomerNameSnapshot string        `json:"customer_name_snapshot"`
	OrderStatus          OrderStatus   `json:"order_status"`
	PaymentStatus        PaymentStatus `json:"payment_status"`
	Subtotal             float64       `json:"subtotal"`
	TaxAmount            float64       `json:"tax_amount"`
	TotalAmount          float64       `json:"total_amount"`
	Notes                string        `json:"notes,omitempty"`
	CreatedAt            time.Time     `json:"created_at"`
	UpdatedAt            *time.Time    `json:"updated_at,omitempty"`
	Items                []OrderItem   `json:"items,omitempty"`
	Payment              *Payment      `json:"payment,omitempty"`
}

type Payment struct {
	ID                    int64         `json:"id"`
	OrderID               int64         `json:"order_id"`
	Method                string        `json:"method"` // cash, qris, bank_transfer, ewallet
	Provider              string        `json:"provider"`
	ProviderTransactionID *string       `json:"provider_transaction_id,omitempty"`
	Amount                float64       `json:"amount"`
	Status                PaymentStatus `json:"status"`
	PaymentURL            string        `json:"payment_url,omitempty"`
	QRString              string        `json:"qr_string,omitempty"`
	VANumber              string        `json:"va_number,omitempty"`
	CreatedAt             time.Time     `json:"created_at"`
	UpdatedAt             *time.Time    `json:"updated_at,omitempty"`
}

type OrderStatusHistory struct {
	ID        int64     `json:"id"`
	OrderID   int64     `json:"order_id"`
	ChangedBy *int64    `json:"changed_by,omitempty"`
	OldStatus string    `json:"old_status"`
	NewStatus string    `json:"new_status"`
	Notes     string    `json:"notes,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type CancellationRequest struct {
	ID            int64              `json:"id"`
	OrderID       int64              `json:"order_id"`
	OrderNumber   string             `json:"order_number,omitempty"`
	RequestedBy   int64              `json:"requested_by"`
	RequesterName string             `json:"requester_name,omitempty"`
	DecidedBy     *int64             `json:"decided_by,omitempty"`
	DeciderName   string             `json:"decider_name,omitempty"`
	Reason        string             `json:"reason"`
	DecisionNotes string             `json:"decision_notes,omitempty"`
	Status        CancellationStatus `json:"status"`
	CreatedAt     time.Time          `json:"created_at"`
	DecidedAt     *time.Time         `json:"decided_at,omitempty"`
}

type SpeakerAnnouncement struct {
	ID           int64         `json:"id"`
	OrderID      int64         `json:"order_id"`
	OrderNumber  string        `json:"order_number,omitempty"`
	CustomerName string        `json:"customer_name,omitempty"`
	TableCode    string        `json:"table_code,omitempty"`
	TriggeredBy  int64         `json:"triggered_by"`
	StaffName    string        `json:"staff_name,omitempty"`
	Message      string        `json:"message"`
	Status       SpeakerStatus `json:"status"`
	AttemptCount int           `json:"attempt_count"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    *time.Time    `json:"updated_at,omitempty"`
}

type TickerItem struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Price     string `json:"price"`
	IsDown    bool   `json:"is_down"`
	SortOrder int    `json:"sort_order"`
}

type Testimonial struct {
	ID          int    `json:"id"`
	Quote       string `json:"quote"`
	AuthorName  string `json:"author_name"`
	AuthorTitle string `json:"author_title"`
	SortOrder   int    `json:"sort_order"`
}

// Request and Response DTOs
type OTPRequest struct {
	WhatsAppNumber string `json:"whatsapp_number"`
}

type OTPVerifyRequest struct {
	WhatsAppNumber string `json:"whatsapp_number"`
	OTP            string `json:"otp"`
	Name           string `json:"name,omitempty"`
}

type StaffLoginRequest struct {
	WhatsAppNumber string `json:"whatsapp_number"`
	Password       string `json:"password"`
}

type ProfileUpdateRequest struct {
	Name string `json:"name"`
}

type CreateOrderItemOptionDTO struct {
	OptionID int64 `json:"option_id"`
}

type CreateOrderItemDTO struct {
	ProductID int64                      `json:"product_id"`
	Quantity  int                        `json:"quantity"`
	Notes     string                     `json:"notes"`
	Options   []CreateOrderItemOptionDTO `json:"options"`
}

type CreateOrderRequest struct {
	BranchID      int64                `json:"branch_id"`
	TableCode     string               `json:"table_code"`
	QRToken       string               `json:"qr_token"`
	PaymentMethod string               `json:"payment_method"` // cash, qris, bank_transfer, ewallet
	Notes         string               `json:"notes"`
	Items         []CreateOrderItemDTO `json:"items"`
}

type WebhookPayload struct {
	EventID        string  `json:"event_id"`
	TransactionID  string  `json:"transaction_id"`
	OrderNumber    string  `json:"order_number"`
	Amount         float64 `json:"amount"`
	Currency       string  `json:"currency"`
	PaymentStatus  string  `json:"payment_status"` // paid, failed, expired
	Signature      string  `json:"signature"`
	RawPayloadJSON string  `json:"raw_payload_json,omitempty"`
}

