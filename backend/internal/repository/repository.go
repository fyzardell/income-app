package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"income-backend/internal/models"
)

type Repository struct {
	db          *sql.DB
	memUsers    map[string]*models.User
	memOTPs     map[string]memOTP
	nextID      int64
}

type memOTP struct {
	id        int64
	hash      string
	attempts  int
	expiresAt time.Time
}

func New(db *sql.DB) *Repository {
	r := &Repository{
		db:       db,
		memUsers: make(map[string]*models.User),
		memOTPs:  make(map[string]memOTP),
		nextID:   10,
	}

	// Seed default demo staff in memory fallback
	hashDemo := "$2a$10$wT0/4R5r1YQ5L9bL4h8Hte5HkHqG8B4zZ/wJ9qY2F5sN8K1P0pAiu"
	br1 := int64(1)
	br2 := int64(2)
	r.memUsers["081111111111"] = &models.User{ID: 1, WhatsAppNumber: "081111111111", Name: "Admin Pusat (INCOME)", Role: models.RoleAdmin, PasswordHash: &hashDemo}
	r.memUsers["082222222222"] = &models.User{ID: 2, WhatsAppNumber: "082222222222", Name: "Kasir Budi (Serang)", Role: models.RoleCashier, PasswordHash: &hashDemo, BranchID: &br1}
	r.memUsers["083333333333"] = &models.User{ID: 3, WhatsAppNumber: "083333333333", Name: "Kasir Siti (Cilegon)", Role: models.RoleCashier, PasswordHash: &hashDemo, BranchID: &br2}
	r.memUsers["081234567890"] = &models.User{ID: 4, WhatsAppNumber: "081234567890", Name: "Rizky Ramadhan", Role: models.RoleCustomer}

	return r
}

// ==================== USERS & AUTH ====================

func (r *Repository) FindUserByPhone(ctx context.Context, phone string) (*models.User, error) {
	if r.db == nil {
		if u, found := r.memUsers[phone]; found {
			return u, nil
		}
		return nil, fmt.Errorf("user not found")
	}
	query := `
		SELECT u.id, u.whatsapp_number, u.name, u.role, u.password_hash, sba.branch_id, u.created_at
		FROM users u
		LEFT JOIN staff_branch_assignments sba ON u.id = sba.user_id
		WHERE u.whatsapp_number = ?
		LIMIT 1
	`
	var u models.User
	var branchID sql.NullInt64
	var pwd sql.NullString
	err := r.db.QueryRowContext(ctx, query, phone).Scan(
		&u.ID, &u.WhatsAppNumber, &u.Name, &u.Role, &pwd, &branchID, &u.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	if pwd.Valid {
		u.PasswordHash = &pwd.String
	}
	if branchID.Valid {
		u.BranchID = &branchID.Int64
	}
	return &u, nil
}

func (r *Repository) FindUserByID(ctx context.Context, id int64) (*models.User, error) {
	if r.db == nil {
		for _, u := range r.memUsers {
			if u.ID == id {
				return u, nil
			}
		}
		return nil, fmt.Errorf("user not found")
	}
	query := `
		SELECT u.id, u.whatsapp_number, u.name, u.role, sba.branch_id, u.created_at
		FROM users u
		LEFT JOIN staff_branch_assignments sba ON u.id = sba.user_id
		WHERE u.id = ?
		LIMIT 1
	`
	var u models.User
	var branchID sql.NullInt64
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&u.ID, &u.WhatsAppNumber, &u.Name, &u.Role, &branchID, &u.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	if branchID.Valid {
		u.BranchID = &branchID.Int64
	}
	return &u, nil
}

func (r *Repository) CreateCustomer(ctx context.Context, phone, name string) (*models.User, error) {
	if r.db == nil {
		r.nextID++
		u := &models.User{
			ID:             r.nextID,
			WhatsAppNumber: phone,
			Name:           name,
			Role:           models.RoleCustomer,
			CreatedAt:      time.Now(),
		}
		r.memUsers[phone] = u
		return u, nil
	}
	query := `INSERT INTO users (whatsapp_number, name, role) VALUES (?, ?, 'customer')`
	res, err := r.db.ExecContext(ctx, query, phone, name)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	return r.FindUserByID(ctx, id)
}

func (r *Repository) UpdateUserName(ctx context.Context, id int64, name string) error {
	if r.db == nil {
		for _, u := range r.memUsers {
			if u.ID == id {
				u.Name = name
				return nil
			}
		}
		return nil
	}
	_, err := r.db.ExecContext(ctx, "UPDATE users SET name = ? WHERE id = ?", name, id)
	return err
}

func (r *Repository) SaveOTP(ctx context.Context, phone, otpHash string, expiresAt time.Time) error {
	if r.db == nil {
		r.nextID++
		r.memOTPs[phone] = memOTP{
			id:        r.nextID,
			hash:      otpHash,
			attempts:  0,
			expiresAt: expiresAt,
		}
		return nil
	}
	query := `INSERT INTO otp_verifications (whatsapp_number, otp_hash, expires_at) VALUES (?, ?, ?)`
	_, err := r.db.ExecContext(ctx, query, phone, otpHash, expiresAt)
	return err
}

func (r *Repository) GetLatestOTP(ctx context.Context, phone string) (int64, string, int, time.Time, error) {
	if r.db == nil {
		if o, found := r.memOTPs[phone]; found {
			return o.id, o.hash, o.attempts, o.expiresAt, nil
		}
		return 0, "", 0, time.Time{}, fmt.Errorf("otp not found")
	}
	query := `
		SELECT id, otp_hash, attempts, expires_at 
		FROM otp_verifications 
		WHERE whatsapp_number = ? AND is_used = 0 
		ORDER BY id DESC LIMIT 1
	`
	var id int64
	var hash string
	var attempts int
	var exp time.Time
	err := r.db.QueryRowContext(ctx, query, phone).Scan(&id, &hash, &attempts, &exp)
	return id, hash, attempts, exp, err
}

func (r *Repository) IncrementOTPAttempts(ctx context.Context, id int64) error {
	if r.db == nil {
		for phone, o := range r.memOTPs {
			if o.id == id {
				o.attempts++
				r.memOTPs[phone] = o
				return nil
			}
		}
		return nil
	}
	_, err := r.db.ExecContext(ctx, "UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?", id)
	return err
}

func (r *Repository) MarkOTPUsed(ctx context.Context, id int64) error {
	if r.db == nil {
		for phone, o := range r.memOTPs {
			if o.id == id {
				delete(r.memOTPs, phone)
				return nil
			}
		}
		return nil
	}
	_, err := r.db.ExecContext(ctx, "UPDATE otp_verifications SET is_used = 1 WHERE id = ?", id)
	return err
}

// ==================== BRANCHES & TABLES ====================

func (r *Repository) GetAllBranches(ctx context.Context) ([]models.Branch, error) {
	if r.db == nil {
		return []models.Branch{
			{ID: 1, Name: "INCOME — Serang Pusat", Address: "Jl. Veteran No. 42, Serang, Banten", Phone: "+62 812-3456-7890", IsOpen: true, CreatedAt: time.Now()},
			{ID: 2, Name: "INCOME — Cilegon Branch", Address: "Jl. Ahmad Yani No. 18, Cilegon, Banten", Phone: "+62 813-9876-5432", IsOpen: true, CreatedAt: time.Now()},
		}, nil
	}
	query := `SELECT id, name, address, phone, is_open, created_at FROM branches ORDER BY id ASC`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var branches []models.Branch
	for rows.Next() {
		var b models.Branch
		if err := rows.Scan(&b.ID, &b.Name, &b.Address, &b.Phone, &b.IsOpen, &b.CreatedAt); err != nil {
			return nil, err
		}
		branches = append(branches, b)
	}
	return branches, nil
}

func (r *Repository) GetBranchByID(ctx context.Context, branchID int64) (*models.Branch, error) {
	if r.db == nil {
		branches, _ := r.GetAllBranches(ctx)
		for _, b := range branches {
			if b.ID == branchID {
				return &b, nil
			}
		}
		return &branches[0], nil
	}
	query := `SELECT id, name, address, phone, is_open, created_at FROM branches WHERE id = ?`
	var b models.Branch
	err := r.db.QueryRowContext(ctx, query, branchID).Scan(&b.ID, &b.Name, &b.Address, &b.Phone, &b.IsOpen, &b.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *Repository) ToggleBranchOpen(ctx context.Context, branchID int64, isOpen bool) error {
	_, err := r.db.ExecContext(ctx, "UPDATE branches SET is_open = ? WHERE id = ?", isOpen, branchID)
	return err
}

func (r *Repository) GetTablesByBranch(ctx context.Context, branchID int64) ([]models.DiningTable, error) {
	if r.db == nil {
		return []models.DiningTable{
			{ID: 1, BranchID: branchID, TableCode: "Meja 01", QRToken: "inc_srg_tb01_7f8a9e", IsActive: true},
			{ID: 2, BranchID: branchID, TableCode: "Meja 02", QRToken: "inc_srg_tb02_3b4c5d", IsActive: true},
			{ID: 3, BranchID: branchID, TableCode: "Meja 03", QRToken: "inc_srg_tb03_8e9f0a", IsActive: true},
			{ID: 4, BranchID: branchID, TableCode: "Meja 04", QRToken: "inc_srg_tb04_1a2b3c", IsActive: true},
			{ID: 5, BranchID: branchID, TableCode: "Meja VIP 01", QRToken: "inc_srg_tbvip_9d8e7f", IsActive: true},
		}, nil
	}
	query := `SELECT id, branch_id, table_code, qr_token, is_active, created_at FROM dining_tables WHERE branch_id = ? ORDER BY id ASC`
	rows, err := r.db.QueryContext(ctx, query, branchID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tables []models.DiningTable
	for rows.Next() {
		var t models.DiningTable
		if err := rows.Scan(&t.ID, &t.BranchID, &t.TableCode, &t.QRToken, &t.IsActive, &t.CreatedAt); err != nil {
			return nil, err
		}
		tables = append(tables, t)
	}
	return tables, nil
}

func (r *Repository) GetTableByToken(ctx context.Context, qrToken string) (*models.DiningTable, error) {
	if r.db == nil {
		tables, _ := r.GetTablesByBranch(ctx, 1)
		for _, t := range tables {
			if t.QRToken == qrToken {
				return &t, nil
			}
		}
		return &tables[0], nil
	}
	query := `SELECT id, branch_id, table_code, qr_token, is_active, created_at FROM dining_tables WHERE qr_token = ? AND is_active = 1`
	var t models.DiningTable
	err := r.db.QueryRowContext(ctx, query, qrToken).Scan(&t.ID, &t.BranchID, &t.TableCode, &t.QRToken, &t.IsActive, &t.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *Repository) CreateTable(ctx context.Context, branchID int64, tableCode, qrToken string) (*models.DiningTable, error) {
	query := `INSERT INTO dining_tables (branch_id, table_code, qr_token, is_active) VALUES (?, ?, ?, 1)`
	res, err := r.db.ExecContext(ctx, query, branchID, tableCode, qrToken)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	return &models.DiningTable{
		ID:        id,
		BranchID:  branchID,
		TableCode: tableCode,
		QRToken:   qrToken,
		IsActive:  true,
		CreatedAt: time.Now(),
	}, nil
}

func (r *Repository) RegenerateTableQR(ctx context.Context, tableID int64, newToken string) error {
	_, err := r.db.ExecContext(ctx, "UPDATE dining_tables SET qr_token = ? WHERE id = ?", newToken, tableID)
	return err
}

// ==================== CATEGORIES & PRODUCTS ====================

func (r *Repository) GetAllCategories(ctx context.Context) ([]models.Category, error) {
	query := `SELECT id, name, slug, icon, sort_order, created_at FROM categories ORDER BY sort_order ASC, id ASC`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cats []models.Category
	for rows.Next() {
		var c models.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.Icon, &c.SortOrder, &c.CreatedAt); err != nil {
			return nil, err
		}
		cats = append(cats, c)
	}
	return cats, nil
}

func (r *Repository) GetProductsByBranch(ctx context.Context, branchID int64) ([]models.Product, error) {
	if r.db == nil {
		return []models.Product{
			{ID: 1, CategoryID: 1, CategoryName: "Coffee", Name: "Gula Aren Latte", Description: "Palm sugar meets slow espresso. A little sweet, a little bold — the entry that opened the book.", Image: "/assets/img/gula_aren.jpg", BasePrice: 45000, Price: 45000, IsAvailable: true, IsSignature: true, SignatureBadge: "Signature Coffee", SignatureChips: "Sweet,Creamy,Bold", IsActive: true, SortOrder: 1},
			{ID: 2, CategoryID: 1, CategoryName: "Coffee", Name: "Caramel Latte", Description: "Silky espresso with buttery handcrafted caramel infusion.", Image: "/assets/img/caramel.jpg", BasePrice: 42000, Price: 42000, IsAvailable: true, IsActive: true, SortOrder: 2},
			{ID: 3, CategoryID: 1, CategoryName: "Coffee", Name: "Espresso", Description: "Pure, concentrated extraction of single-origin beans.", Image: "/assets/img/gula_aren.jpg", BasePrice: 25000, Price: 25000, IsAvailable: true, IsActive: true, SortOrder: 3},
			{ID: 4, CategoryID: 1, CategoryName: "Coffee", Name: "Americano", Description: "Espresso diluted with hot artisanal mineral water, clean and crisp.", Image: "/assets/img/caramel.jpg", BasePrice: 28000, Price: 28000, IsAvailable: true, IsActive: true, SortOrder: 4},
			{ID: 5, CategoryID: 1, CategoryName: "Coffee", Name: "Cappuccino", Description: "Harmonious third: espresso, steamed milk, and velvety microfoam.", Image: "/assets/img/gula_aren.jpg", BasePrice: 35000, Price: 35000, IsAvailable: true, IsActive: true, SortOrder: 5},
			{ID: 6, CategoryID: 1, CategoryName: "Coffee", Name: "Mocha", Description: "Dark couverture Belgian chocolate paired with rich espresso.", Image: "/assets/img/caramel.jpg", BasePrice: 38000, Price: 38000, IsAvailable: true, IsActive: true, SortOrder: 6},
			{ID: 7, CategoryID: 1, CategoryName: "Coffee", Name: "Cold Brew", Description: "Steeped for 18 hours in cold filtered water, smooth and low acid.", Image: "/assets/img/gula_aren.jpg", BasePrice: 33000, Price: 33000, IsAvailable: true, IsActive: true, SortOrder: 7},
			{ID: 8, CategoryID: 3, CategoryName: "Non-Coffee", Name: "Matcha Latte", Description: "Ceremonial grade Uji matcha whisked with fresh whole milk.", Image: "/assets/img/caramel.jpg", BasePrice: 40000, Price: 40000, IsAvailable: true, IsActive: true, SortOrder: 8},
			{ID: 9, CategoryID: 2, CategoryName: "Bakery", Name: "Butter Croissant", Description: "Laminated, baked, and gone before noon. Every batch closed out while the oven is still warm.", Image: "/assets/img/caramel.jpg", BasePrice: 35000, Price: 35000, IsAvailable: true, IsSignature: true, SignatureBadge: "Signature Bakery", SignatureChips: "Flaky,Warm,Buttery", IsActive: true, SortOrder: 9},
			{ID: 10, CategoryID: 2, CategoryName: "Bakery", Name: "Almond Croissant", Description: "Twice-baked with almond frangipane cream and toasted sliced almonds.", Image: "/assets/img/gula_aren.jpg", BasePrice: 42000, Price: 42000, IsAvailable: true, IsActive: true, SortOrder: 10},
			{ID: 11, CategoryID: 2, CategoryName: "Bakery", Name: "Pain au Chocolat", Description: "French viennoiserie pastry enclosing twin batons of bittersweet chocolate.", Image: "/assets/img/caramel.jpg", BasePrice: 38000, Price: 38000, IsAvailable: true, IsActive: true, SortOrder: 11},
			{ID: 12, CategoryID: 2, CategoryName: "Bakery", Name: "Banana Bread", Description: "Moist loaf baked with ripe cavendish bananas and fragrant walnuts.", Image: "/assets/img/gula_aren.jpg", BasePrice: 30000, Price: 30000, IsAvailable: true, IsActive: true, SortOrder: 12},
			{ID: 13, CategoryID: 2, CategoryName: "Bakery", Name: "Cinnamon Roll", Description: "Warm pillowy spiral with brown sugar ceylon cinnamon and cream cheese glaze.", Image: "/assets/img/caramel.jpg", BasePrice: 32000, Price: 32000, IsAvailable: true, IsActive: true, SortOrder: 13},
			{ID: 14, CategoryID: 2, CategoryName: "Bakery", Name: "Chocolate Cookie", Description: "Crispy edges, chewy gooey center with Valrhona 70% dark chocolate chunks.", Image: "/assets/img/gula_aren.jpg", BasePrice: 22000, Price: 22000, IsAvailable: true, IsActive: true, SortOrder: 14},
			{ID: 15, CategoryID: 2, CategoryName: "Bakery", Name: "Sourdough Loaf", Description: "Naturally leavened 36-hour slow fermentation with blistered crust.", Image: "/assets/img/caramel.jpg", BasePrice: 55000, Price: 55000, IsAvailable: true, IsActive: true, SortOrder: 15},
		}, nil
	}
	query := `
		SELECT p.id, p.category_id, c.name, p.name, COALESCE(p.description, ''), p.image, 
		       p.base_price, COALESCE(bp.price, p.base_price) AS resolved_price,
		       COALESCE(bp.is_available, 1) AS is_available,
		       p.is_signature, COALESCE(p.signature_badge, ''), COALESCE(p.signature_chips, ''), 
		       p.is_active, p.sort_order
		FROM products p
		JOIN categories c ON p.category_id = c.id
		LEFT JOIN branch_products bp ON p.id = bp.product_id AND bp.branch_id = ?
		WHERE p.is_active = 1
		ORDER BY p.sort_order ASC, p.id ASC
	`
	rows, err := r.db.QueryContext(ctx, query, branchID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var p models.Product
		if err := rows.Scan(
			&p.ID, &p.CategoryID, &p.CategoryName, &p.Name, &p.Description, &p.Image,
			&p.BasePrice, &p.Price, &p.IsAvailable,
			&p.IsSignature, &p.SignatureBadge, &p.SignatureChips,
			&p.IsActive, &p.SortOrder,
		); err != nil {
			return nil, err
		}
		products = append(products, p)
	}

	// Fetch option groups and options for all products
	for i := range products {
		groups, err := r.GetOptionGroupsForProduct(ctx, products[i].ID, products[i].CategoryID)
		if err == nil {
			products[i].OptionGroups = groups
		}
	}

	return products, nil
}

func (r *Repository) GetOptionGroupsForProduct(ctx context.Context, productID, categoryID int64) ([]models.ProductOptionGroup, error) {
	query := `
		SELECT id, product_id, category_id, name, is_required, min_selection, max_selection
		FROM product_option_groups
		WHERE (product_id = ? OR product_id IS NULL) 
		  AND (category_id = ? OR category_id IS NULL)
		ORDER BY id ASC
	`
	rows, err := r.db.QueryContext(ctx, query, productID, categoryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []models.ProductOptionGroup
	for rows.Next() {
		var g models.ProductOptionGroup
		var pid, cid sql.NullInt64
		if err := rows.Scan(&g.ID, &pid, &cid, &g.Name, &g.IsRequired, &g.MinSelection, &g.MaxSelection); err != nil {
			return nil, err
		}
		if pid.Valid {
			g.ProductID = &pid.Int64
		}
		if cid.Valid {
			g.CategoryID = &cid.Int64
		}

		// Options
		optQuery := `SELECT id, option_group_id, name, price_adjustment FROM product_options WHERE option_group_id = ? ORDER BY id ASC`
		optRows, err := r.db.QueryContext(ctx, optQuery, g.ID)
		if err == nil {
			for optRows.Next() {
				var opt models.ProductOption
				if err := optRows.Scan(&opt.ID, &opt.OptionGroupID, &opt.Name, &opt.PriceAdjustment); err == nil {
					g.Options = append(g.Options, opt)
				}
			}
			optRows.Close()
		}

		groups = append(groups, g)
	}
	return groups, nil
}

func (r *Repository) ToggleProductBranchAvailability(ctx context.Context, branchID, productID int64, isAvailable bool) error {
	query := `
		INSERT INTO branch_products (branch_id, product_id, price, is_available)
		SELECT ?, ?, base_price, ? FROM products WHERE id = ?
		ON DUPLICATE KEY UPDATE is_available = VALUES(is_available)
	`
	_, err := r.db.ExecContext(ctx, query, branchID, productID, isAvailable, productID)
	return err
}

func (r *Repository) UpdateBranchProductPrice(ctx context.Context, branchID, productID int64, price float64) error {
	query := `
		INSERT INTO branch_products (branch_id, product_id, price, is_available)
		VALUES (?, ?, ?, 1)
		ON DUPLICATE KEY UPDATE price = VALUES(price)
	`
	_, err := r.db.ExecContext(ctx, query, branchID, productID, price)
	return err
}

func (r *Repository) CreateProduct(ctx context.Context, p *models.Product) (*models.Product, error) {
	if r.db == nil {
		r.nextID++
		p.ID = r.nextID
		return p, nil
	}
	query := `
		INSERT INTO products (category_id, name, description, image, base_price, is_active, sort_order)
		VALUES (?, ?, ?, ?, ?, 1, ?)
	`
	res, err := r.db.ExecContext(ctx, query, p.CategoryID, p.Name, p.Description, p.Image, p.BasePrice, p.SortOrder)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	p.ID = id

	// Also insert default branch_products for all branches
	_, _ = r.db.ExecContext(ctx, `
		INSERT INTO branch_products (branch_id, product_id, price, is_available)
		SELECT id, ?, ?, 1 FROM branches
	`, id, p.BasePrice)

	return p, nil
}

func (r *Repository) DeleteProduct(ctx context.Context, productID int64) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.ExecContext(ctx, "DELETE FROM products WHERE id = ?", productID)
	return err
}

// ==================== ORDERS & TRANSACTIONS ====================

func (r *Repository) CreateOrderTx(ctx context.Context, order *models.Order) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Insert order
	orderQuery := `
		INSERT INTO orders (
			order_number, user_id, branch_id, dining_table_id, 
			customer_name_snapshot, order_status, payment_status, 
			subtotal, tax_amount, total_amount, notes
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	res, err := tx.ExecContext(ctx, orderQuery,
		order.OrderNumber, order.UserID, order.BranchID, order.DiningTableID,
		order.CustomerNameSnapshot, order.OrderStatus, order.PaymentStatus,
		order.Subtotal, order.TaxAmount, order.TotalAmount, order.Notes,
	)
	if err != nil {
		return fmt.Errorf("failed to insert order: %w", err)
	}

	orderID, _ := res.LastInsertId()
	order.ID = orderID

	// 2. Insert items and options
	for _, item := range order.Items {
		itemQuery := `
			INSERT INTO order_items (
				order_id, product_id, product_name_snapshot, 
				unit_price, quantity, subtotal, notes
			) VALUES (?, ?, ?, ?, ?, ?, ?)
		`
		itemRes, err := tx.ExecContext(ctx, itemQuery,
			orderID, item.ProductID, item.ProductNameSnapshot,
			item.UnitPrice, item.Quantity, item.Subtotal, item.Notes,
		)
		if err != nil {
			return fmt.Errorf("failed to insert order item: %w", err)
		}
		itemID, _ := itemRes.LastInsertId()

		for _, opt := range item.Options {
			optQuery := `
				INSERT INTO order_item_options (
					order_item_id, option_id, group_name_snapshot, 
					option_name_snapshot, price_adjustment
				) VALUES (?, ?, ?, ?, ?)
			`
			_, err := tx.ExecContext(ctx, optQuery,
				itemID, opt.OptionID, opt.GroupNameSnapshot,
				opt.OptionNameSnapshot, opt.PriceAdjustment,
			)
			if err != nil {
				return fmt.Errorf("failed to insert item option: %w", err)
			}
		}
	}

	// 3. Insert payment record
	if order.Payment != nil {
		payQuery := `
			INSERT INTO payments (
				order_id, method, provider, provider_transaction_id, 
				amount, status, payment_url, qr_string, va_number
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`
		payRes, err := tx.ExecContext(ctx, payQuery,
			orderID, order.Payment.Method, order.Payment.Provider,
			order.Payment.ProviderTransactionID, order.Payment.Amount,
			order.Payment.Status, order.Payment.PaymentURL,
			order.Payment.QRString, order.Payment.VANumber,
		)
		if err != nil {
			return fmt.Errorf("failed to insert payment: %w", err)
		}
		payID, _ := payRes.LastInsertId()
		order.Payment.ID = payID
	}

	// 4. Record initial status history
	historyQuery := `
		INSERT INTO order_status_history (order_id, changed_by, old_status, new_status, notes)
		VALUES (?, ?, 'none', ?, ?)
	`
	_, _ = tx.ExecContext(ctx, historyQuery, orderID, order.UserID, string(order.OrderStatus), "Order dibuat oleh customer")

	return tx.Commit()
}

func (r *Repository) GetOrderByID(ctx context.Context, orderID int64) (*models.Order, error) {
	query := `
		SELECT o.id, o.order_number, o.user_id, o.branch_id, b.name, o.dining_table_id, dt.table_code,
		       o.customer_name_snapshot, o.order_status, o.payment_status, 
		       o.subtotal, o.tax_amount, o.total_amount, COALESCE(o.notes, ''), o.created_at, o.updated_at
		FROM orders o
		JOIN branches b ON o.branch_id = b.id
		JOIN dining_tables dt ON o.dining_table_id = dt.id
		WHERE o.id = ?
	`
	var o models.Order
	err := r.db.QueryRowContext(ctx, query, orderID).Scan(
		&o.ID, &o.OrderNumber, &o.UserID, &o.BranchID, &o.BranchName, &o.DiningTableID, &o.TableCode,
		&o.CustomerNameSnapshot, &o.OrderStatus, &o.PaymentStatus,
		&o.Subtotal, &o.TaxAmount, &o.TotalAmount, &o.Notes, &o.CreatedAt, &o.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Load items
	items, err := r.GetOrderItems(ctx, o.ID)
	if err == nil {
		o.Items = items
	}

	// Load payment
	pay, err := r.GetPaymentByOrderID(ctx, o.ID)
	if err == nil {
		o.Payment = pay
	}

	return &o, nil
}

func (r *Repository) GetOrderByNumber(ctx context.Context, orderNumber string) (*models.Order, error) {
	var id int64
	err := r.db.QueryRowContext(ctx, "SELECT id FROM orders WHERE order_number = ?", orderNumber).Scan(&id)
	if err != nil {
		return nil, err
	}
	return r.GetOrderByID(ctx, id)
}

func (r *Repository) GetOrderItems(ctx context.Context, orderID int64) ([]models.OrderItem, error) {
	query := `
		SELECT id, order_id, product_id, product_name_snapshot, unit_price, quantity, subtotal, COALESCE(notes, '')
		FROM order_items
		WHERE order_id = ?
		ORDER BY id ASC
	`
	rows, err := r.db.QueryContext(ctx, query, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.OrderItem
	for rows.Next() {
		var it models.OrderItem
		if err := rows.Scan(&it.ID, &it.OrderID, &it.ProductID, &it.ProductNameSnapshot, &it.UnitPrice, &it.Quantity, &it.Subtotal, &it.Notes); err != nil {
			return nil, err
		}

		// Options
		optRows, err := r.db.QueryContext(ctx, `
			SELECT id, order_item_id, option_id, group_name_snapshot, option_name_snapshot, price_adjustment 
			FROM order_item_options WHERE order_item_id = ?
		`, it.ID)
		if err == nil {
			for optRows.Next() {
				var opt models.OrderItemOption
				var optID sql.NullInt64
				if err := optRows.Scan(&opt.ID, &opt.OrderItemID, &optID, &opt.GroupNameSnapshot, &opt.OptionNameSnapshot, &opt.PriceAdjustment); err == nil {
					if optID.Valid {
						opt.OptionID = &optID.Int64
					}
					it.Options = append(it.Options, opt)
				}
			}
			optRows.Close()
		}

		items = append(items, it)
	}
	return items, nil
}

func (r *Repository) GetPaymentByOrderID(ctx context.Context, orderID int64) (*models.Payment, error) {
	query := `
		SELECT id, order_id, method, provider, provider_transaction_id, amount, status, 
		       COALESCE(payment_url, ''), COALESCE(qr_string, ''), COALESCE(va_number, ''), created_at, updated_at
		FROM payments
		WHERE order_id = ?
		ORDER BY id DESC LIMIT 1
	`
	var p models.Payment
	var txID sql.NullString
	err := r.db.QueryRowContext(ctx, query, orderID).Scan(
		&p.ID, &p.OrderID, &p.Method, &p.Provider, &txID, &p.Amount, &p.Status,
		&p.PaymentURL, &p.QRString, &p.VANumber, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if txID.Valid {
		p.ProviderTransactionID = &txID.String
	}
	return &p, nil
}

func (r *Repository) GetOrdersByBranch(ctx context.Context, branchID int64, statusFilter string) ([]models.Order, error) {
	query := `
		SELECT o.id, o.order_number, o.user_id, o.branch_id, b.name, o.dining_table_id, dt.table_code,
		       o.customer_name_snapshot, o.order_status, o.payment_status, 
		       o.subtotal, o.tax_amount, o.total_amount, COALESCE(o.notes, ''), o.created_at, o.updated_at
		FROM orders o
		JOIN branches b ON o.branch_id = b.id
		JOIN dining_tables dt ON o.dining_table_id = dt.id
		WHERE (o.branch_id = ? OR ? = 0)
	`
	args := []interface{}{branchID, branchID}
	if statusFilter != "" && statusFilter != "all" {
		query += " AND o.order_status = ?"
		args = append(args, statusFilter)
	}
	query += " ORDER BY o.id DESC LIMIT 100"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(
			&o.ID, &o.OrderNumber, &o.UserID, &o.BranchID, &o.BranchName, &o.DiningTableID, &o.TableCode,
			&o.CustomerNameSnapshot, &o.OrderStatus, &o.PaymentStatus,
			&o.Subtotal, &o.TaxAmount, &o.TotalAmount, &o.Notes, &o.CreatedAt, &o.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items, _ := r.GetOrderItems(ctx, o.ID)
		o.Items = items
		pay, _ := r.GetPaymentByOrderID(ctx, o.ID)
		o.Payment = pay
		orders = append(orders, o)
	}
	return orders, nil
}

func (r *Repository) GetOrdersByUser(ctx context.Context, userID int64) ([]models.Order, error) {
	query := `
		SELECT o.id, o.order_number, o.user_id, o.branch_id, b.name, o.dining_table_id, dt.table_code,
		       o.customer_name_snapshot, o.order_status, o.payment_status, 
		       o.subtotal, o.tax_amount, o.total_amount, COALESCE(o.notes, ''), o.created_at, o.updated_at
		FROM orders o
		JOIN branches b ON o.branch_id = b.id
		JOIN dining_tables dt ON o.dining_table_id = dt.id
		WHERE o.user_id = ?
		ORDER BY o.id DESC LIMIT 20
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(
			&o.ID, &o.OrderNumber, &o.UserID, &o.BranchID, &o.BranchName, &o.DiningTableID, &o.TableCode,
			&o.CustomerNameSnapshot, &o.OrderStatus, &o.PaymentStatus,
			&o.Subtotal, &o.TaxAmount, &o.TotalAmount, &o.Notes, &o.CreatedAt, &o.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items, _ := r.GetOrderItems(ctx, o.ID)
		o.Items = items
		pay, _ := r.GetPaymentByOrderID(ctx, o.ID)
		o.Payment = pay
		orders = append(orders, o)
	}
	return orders, nil
}

func (r *Repository) UpdateOrderStatus(ctx context.Context, orderID int64, newStatus models.OrderStatus, changedBy *int64, notes string) error {
	var oldStatus string
	err := r.db.QueryRowContext(ctx, "SELECT order_status FROM orders WHERE id = ?", orderID).Scan(&oldStatus)
	if err != nil {
		return err
	}

	_, err = r.db.ExecContext(ctx, "UPDATE orders SET order_status = ? WHERE id = ?", string(newStatus), orderID)
	if err != nil {
		return err
	}

	// Insert status history
	_, _ = r.db.ExecContext(ctx, `
		INSERT INTO order_status_history (order_id, changed_by, old_status, new_status, notes)
		VALUES (?, ?, ?, ?, ?)
	`, orderID, changedBy, oldStatus, string(newStatus), notes)

	return nil
}

func (r *Repository) UpdatePaymentStatus(ctx context.Context, orderID int64, paymentStatus models.PaymentStatus) error {
	_, err := r.db.ExecContext(ctx, "UPDATE orders SET payment_status = ? WHERE id = ?", string(paymentStatus), orderID)
	if err != nil {
		return err
	}
	_, err = r.db.ExecContext(ctx, "UPDATE payments SET status = ? WHERE order_id = ?", string(paymentStatus), orderID)
	return err
}

func (r *Repository) GetOrderStatusHistory(ctx context.Context, orderID int64) ([]models.OrderStatusHistory, error) {
	query := `
		SELECT id, order_id, changed_by, old_status, new_status, COALESCE(notes, ''), created_at
		FROM order_status_history
		WHERE order_id = ?
		ORDER BY id ASC
	`
	rows, err := r.db.QueryContext(ctx, query, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.OrderStatusHistory
	for rows.Next() {
		var h models.OrderStatusHistory
		var cb sql.NullInt64
		if err := rows.Scan(&h.ID, &h.OrderID, &cb, &h.OldStatus, &h.NewStatus, &h.Notes, &h.CreatedAt); err != nil {
			return nil, err
		}
		if cb.Valid {
			h.ChangedBy = &cb.Int64
		}
		list = append(list, h)
	}
	return list, nil
}

// ==================== SPEAKER ANNOUNCEMENTS ====================

func (r *Repository) CreateSpeakerAnnouncement(ctx context.Context, orderID, triggeredBy int64, message string) (*models.SpeakerAnnouncement, error) {
	query := `
		INSERT INTO speaker_announcements (order_id, triggered_by, message, status, attempt_count)
		VALUES (?, ?, ?, 'sent', 1)
	`
	res, err := r.db.ExecContext(ctx, query, orderID, triggeredBy, message)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	return &models.SpeakerAnnouncement{
		ID:           id,
		OrderID:      orderID,
		TriggeredBy:  triggeredBy,
		Message:      message,
		Status:       models.SpeakerSent,
		AttemptCount: 1,
		CreatedAt:    time.Now(),
	}, nil
}

func (r *Repository) GetSpeakerAnnouncementsByBranch(ctx context.Context, branchID int64) ([]models.SpeakerAnnouncement, error) {
	query := `
		SELECT sa.id, sa.order_id, o.order_number, o.customer_name_snapshot, dt.table_code,
		       sa.triggered_by, u.name, sa.message, sa.status, sa.attempt_count, sa.created_at
		FROM speaker_announcements sa
		JOIN orders o ON sa.order_id = o.id
		JOIN dining_tables dt ON o.dining_table_id = dt.id
		JOIN users u ON sa.triggered_by = u.id
		WHERE o.branch_id = ?
		ORDER BY sa.id DESC LIMIT 30
	`
	rows, err := r.db.QueryContext(ctx, query, branchID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.SpeakerAnnouncement
	for rows.Next() {
		var sa models.SpeakerAnnouncement
		if err := rows.Scan(
			&sa.ID, &sa.OrderID, &sa.OrderNumber, &sa.CustomerName, &sa.TableCode,
			&sa.TriggeredBy, &sa.StaffName, &sa.Message, &sa.Status, &sa.AttemptCount, &sa.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, sa)
	}
	return list, nil
}

// ==================== CANCELLATION REQUESTS ====================

func (r *Repository) CreateCancellationRequest(ctx context.Context, orderID, requestedBy int64, reason string) (*models.CancellationRequest, error) {
	query := `
		INSERT INTO cancellation_requests (order_id, requested_by, reason, status)
		VALUES (?, ?, ?, 'requested')
	`
	res, err := r.db.ExecContext(ctx, query, orderID, requestedBy, reason)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	return &models.CancellationRequest{
		ID:          id,
		OrderID:     orderID,
		RequestedBy: requestedBy,
		Reason:      reason,
		Status:      models.CancellationRequested,
		CreatedAt:   time.Now(),
	}, nil
}

func (r *Repository) GetCancellationRequestsByBranch(ctx context.Context, branchID int64) ([]models.CancellationRequest, error) {
	query := `
		SELECT cr.id, cr.order_id, o.order_number, cr.requested_by, u1.name, 
		       cr.decided_by, COALESCE(u2.name, ''), cr.reason, COALESCE(cr.decision_notes, ''),
		       cr.status, cr.created_at, cr.decided_at
		FROM cancellation_requests cr
		JOIN orders o ON cr.order_id = o.id
		JOIN users u1 ON cr.requested_by = u1.id
		LEFT JOIN users u2 ON cr.decided_by = u2.id
		WHERE (o.branch_id = ? OR ? = 0)
		ORDER BY cr.id DESC LIMIT 50
	`
	rows, err := r.db.QueryContext(ctx, query, branchID, branchID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.CancellationRequest
	for rows.Next() {
		var cr models.CancellationRequest
		var decBy sql.NullInt64
		if err := rows.Scan(
			&cr.ID, &cr.OrderID, &cr.OrderNumber, &cr.RequestedBy, &cr.RequesterName,
			&decBy, &cr.DeciderName, &cr.Reason, &cr.DecisionNotes,
			&cr.Status, &cr.CreatedAt, &cr.DecidedAt,
		); err != nil {
			return nil, err
		}
		if decBy.Valid {
			cr.DecidedBy = &decBy.Int64
		}
		list = append(list, cr)
	}
	return list, nil
}

func (r *Repository) DecideCancellation(ctx context.Context, reqID, deciderID int64, approve bool, notes string) error {
	status := models.CancellationRejected
	if approve {
		status = models.CancellationApproved
	}

	now := time.Now()
	_, err := r.db.ExecContext(ctx, `
		UPDATE cancellation_requests 
		SET decided_by = ?, status = ?, decision_notes = ?, decided_at = ?
		WHERE id = ?
	`, deciderID, string(status), notes, now, reqID)
	if err != nil {
		return err
	}

	if approve {
		// Also update order status to cancelled
		var orderID int64
		_ = r.db.QueryRowContext(ctx, "SELECT order_id FROM cancellation_requests WHERE id = ?", reqID).Scan(&orderID)
		if orderID > 0 {
			_ = r.UpdateOrderStatus(ctx, orderID, models.OrderStatusCancelled, &deciderID, "Pembatalan disetujui oleh kasir: "+notes)
		}
	}

	return nil
}

// ==================== WEBHOOK IDEMPOTENCY ====================

func (r *Repository) RecordWebhookEvent(ctx context.Context, paymentID *int64, eventID, eventType, payload string) (bool, error) {
	// Returns true if inserted (not processed yet), false if already processed
	query := `
		INSERT INTO payment_webhook_events (payment_id, provider_event_id, event_type, payload, processed)
		VALUES (?, ?, ?, ?, 1)
		ON DUPLICATE KEY UPDATE processed = processed
	`
	res, err := r.db.ExecContext(ctx, query, paymentID, eventID, eventType, payload)
	if err != nil {
		return false, err
	}
	rowsAffected, _ := res.RowsAffected()
	return rowsAffected > 0, nil
}

// ==================== TICKER & TESTIMONIALS ====================

func (r *Repository) GetTickerItems(ctx context.Context) ([]models.TickerItem, error) {
	if r.db == nil {
		return []models.TickerItem{
			{ID: 1, Name: "Gula Aren", Price: "45K", IsDown: false, SortOrder: 1},
			{ID: 2, Name: "Croissant", Price: "35K", IsDown: false, SortOrder: 2},
			{ID: 3, Name: "Espresso", Price: "25K", IsDown: true, SortOrder: 3},
			{ID: 4, Name: "Sourdough", Price: "55K", IsDown: false, SortOrder: 4},
			{ID: 5, Name: "Cold Brew", Price: "33K", IsDown: false, SortOrder: 5},
			{ID: 6, Name: "Cinnamon Roll", Price: "32K", IsDown: true, SortOrder: 6},
		}, nil
	}
	query := `SELECT id, name, price, is_down, sort_order FROM ticker_items ORDER BY sort_order ASC`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.TickerItem
	for rows.Next() {
		var it models.TickerItem
		if err := rows.Scan(&it.ID, &it.Name, &it.Price, &it.IsDown, &it.SortOrder); err == nil {
			list = append(list, it)
		}
	}
	return list, nil
}

func (r *Repository) GetTestimonials(ctx context.Context) ([]models.Testimonial, error) {
	if r.db == nil {
		return []models.Testimonial{
			{ID: 1, Quote: "Best gula aren latte in Serang, hands down. I come back every weekend.", AuthorName: "Rizky", AuthorTitle: "Mahasiswa", SortOrder: 1},
			{ID: 2, Quote: "The croissant sells out fast — come early or cry. Trust me.", AuthorName: "Salsa", AuthorTitle: "Content Creator", SortOrder: 2},
			{ID: 3, Quote: "Tempat paling nyaman buat kerja. Kopinya konsisten, rotinya hangat.", AuthorName: "Bagus", AuthorTitle: "Young Professional", SortOrder: 3},
		}, nil
	}
	query := `SELECT id, quote, author_name, author_title, sort_order FROM testimonials ORDER BY sort_order ASC`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Testimonial
	for rows.Next() {
		var t models.Testimonial
		if err := rows.Scan(&t.ID, &t.Quote, &t.AuthorName, &t.AuthorTitle, &t.SortOrder); err == nil {
			list = append(list, t)
		}
	}
	return list, nil
}

// ==================== ADMIN REPORTS ====================

type BranchReport struct {
	BranchID    int64   `json:"branch_id"`
	BranchName  string  `json:"branch_name"`
	TotalOrders int     `json:"total_orders"`
	TotalAmount float64 `json:"total_amount"`
	PaidOrders  int     `json:"paid_orders"`
}

func (r *Repository) GetBranchReports(ctx context.Context) ([]BranchReport, error) {
	query := `
		SELECT b.id, b.name, 
		       COUNT(o.id) AS total_orders, 
		       COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) AS total_amount,
		       COUNT(CASE WHEN o.payment_status = 'paid' THEN 1 END) AS paid_orders
		FROM branches b
		LEFT JOIN orders o ON b.id = o.branch_id
		GROUP BY b.id, b.name
		ORDER BY b.id ASC
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []BranchReport
	for rows.Next() {
		var br BranchReport
		if err := rows.Scan(&br.BranchID, &br.BranchName, &br.TotalOrders, &br.TotalAmount, &br.PaidOrders); err == nil {
			list = append(list, br)
		}
	}
	return list, nil
}
