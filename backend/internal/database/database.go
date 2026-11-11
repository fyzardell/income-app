package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

func Connect(dbSource string) (*sql.DB, error) {
	// First connect without database to ensure database exists if necessary
	// e.g. "root:@tcp(127.0.0.1:3306)/income_db?..."
	db, err := sql.Open("mysql", dbSource)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		// Try creating database if error is unknown database
		if strings.Contains(err.Error(), "Unknown database") {
			log.Println("[DATABASE] Database does not exist yet. Attempting to create income_db...")
			rootSource := strings.Replace(dbSource, "/income_db?", "/?", 1)
			rootDB, rootErr := sql.Open("mysql", rootSource)
			if rootErr == nil {
				_, _ = rootDB.Exec("CREATE DATABASE IF NOT EXISTS `income_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
				rootDB.Close()
			}
			// Ping again
			if pingErr := db.Ping(); pingErr != nil {
				return nil, fmt.Errorf("failed to connect to MySQL: %w", pingErr)
			}
		} else {
			return nil, fmt.Errorf("failed to ping MySQL at %s: %w", dbSource, err)
		}
	}

	log.Println("[DATABASE] Successfully connected to MySQL database!")

	// Check if users table exists. If not, auto-seed with schema.sql
	var tableName string
	err = db.QueryRow("SHOW TABLES LIKE 'orders'").Scan(&tableName)
	if err != nil || tableName == "" {
		log.Println("[DATABASE] Orders table not found. Automatically applying database schema & initial seeds...")
		if migrateErr := applySchema(db); migrateErr != nil {
			log.Printf("[DATABASE] Warning applying schema: %v", migrateErr)
		} else {
			log.Println("[DATABASE] Database schema and initial seeds applied successfully!")
		}
	}

	return db, nil
}

func applySchema(db *sql.DB) error {
	// Try finding schema.sql in known locations
	paths := []string{
		"schema.sql",
		"./schema.sql",
		"database/schema.sql",
		"../database/schema.sql",
		"../../database/schema.sql",
		"c:/laragon/www/web_income/database/schema.sql",
	}

	var content []byte
	var err error
	for _, p := range paths {
		abs, _ := filepath.Abs(p)
		content, err = os.ReadFile(abs)
		if err == nil {
			log.Printf("[DATABASE] Found schema file at %s", abs)
			break
		}
	}

	if err != nil || len(content) == 0 {
		return fmt.Errorf("could not locate schema.sql: %w", err)
	}

	// Split by semicolon statements
	queries := strings.Split(string(content), ";")
	for _, q := range queries {
		trimmed := strings.TrimSpace(q)
		if trimmed == "" || strings.HasPrefix(trimmed, "--") {
			continue
		}
		if _, execErr := db.Exec(trimmed); execErr != nil {
			// Ignore database create / use if already connected
			if !strings.Contains(trimmed, "CREATE DATABASE") && !strings.Contains(trimmed, "USE ") {
				log.Printf("[DATABASE] Warning running query: %v | Query: %s", execErr, trimmed[:min(60, len(trimmed))])
			}
		}
	}
	return nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

