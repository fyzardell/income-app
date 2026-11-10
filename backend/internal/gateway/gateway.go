package gateway

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/rand"
	"time"

	"income-backend/internal/models"
)

type PaymentGateway interface {
	CreateTransaction(order *models.Order, method string) (*models.Payment, error)
	VerifyWebhookSignature(orderNumber, status, receivedSig string, amount float64) bool
	GenerateSignature(orderNumber, status string, amount float64) string
}

type MockPaymentGateway struct {
	serverKey string
}

func NewMockGateway(serverKey string) *MockPaymentGateway {
	if serverKey == "" {
		serverKey = "income_gateway_secret_key_2026"
	}
	return &MockPaymentGateway{
		serverKey: serverKey,
	}
}

func (g *MockPaymentGateway) CreateTransaction(order *models.Order, method string) (*models.Payment, error) {
	rand.Seed(time.Now().UnixNano())
	txID := fmt.Sprintf("TXN-%s-%d", order.OrderNumber, rand.Intn(9999))

	payment := &models.Payment{
		OrderID:               order.ID,
		Method:                method,
		Provider:              "INCOME-Gateway-Simulator",
		ProviderTransactionID: &txID,
		Amount:                order.TotalAmount,
		Status:                models.PaymentStatusPending,
		CreatedAt:             time.Now(),
	}

	switch method {
	case "qris":
		// Standard EMVCo/QRIS mock payload format
		payment.QRString = fmt.Sprintf("00020101021226670016ID.CO.INCOME.WWW011893600911002%05d5204581453033605802ID5919INCOME COFFEE BAKERY6006SERANG62070703A016304%X", rand.Intn(99999), rand.Intn(65535))
		payment.PaymentURL = fmt.Sprintf("/payment/simulator?order=%s&method=qris&amount=%.0f", order.OrderNumber, order.TotalAmount)
	case "bank_transfer":
		// Simulated BCA / Mandiri Virtual Account
		payment.VANumber = fmt.Sprintf("88012%08d", rand.Intn(99999999))
		payment.PaymentURL = fmt.Sprintf("/payment/simulator?order=%s&method=bank_transfer&va=%s&amount=%.0f", order.OrderNumber, payment.VANumber, order.TotalAmount)
	case "ewallet":
		payment.PaymentURL = fmt.Sprintf("/payment/simulator?order=%s&method=ewallet&amount=%.0f", order.OrderNumber, order.TotalAmount)
	case "cash":
		payment.Provider = "cashier"
		payment.Status = models.PaymentStatusPending
	default:
		payment.Method = "cash"
		payment.Provider = "cashier"
	}

	return payment, nil
}

func (g *MockPaymentGateway) GenerateSignature(orderNumber, status string, amount float64) string {
	raw := fmt.Sprintf("%s:%s:%.2f:%s", orderNumber, status, amount, g.serverKey)
	h := hmac.New(sha256.New, []byte(g.serverKey))
	h.Write([]byte(raw))
	return hex.EncodeToString(h.Sum(nil))
}

func (g *MockPaymentGateway) VerifyWebhookSignature(orderNumber, status, receivedSig string, amount float64) bool {
	expected := g.GenerateSignature(orderNumber, status, amount)
	return hmac.Equal([]byte(expected), []byte(receivedSig))
}

