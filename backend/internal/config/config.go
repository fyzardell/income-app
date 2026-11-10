package config

import (
	"bufio"
	"os"
	"strings"
)

type Config struct {
	Port        string
	DBDriver    string
	DBSource    string
	RedisHost   string
	RedisPass   string
	RedisDB     int
	JWTSecret   string
	Env         string
	FrontendURL string
}

func loadDotEnv() {
	paths := []string{".env", "../.env", "backend/.env"}
	for _, p := range paths {
		f, err := os.Open(p)
		if err == nil {
			scanner := bufio.NewScanner(f)
			for scanner.Scan() {
				line := strings.TrimSpace(scanner.Text())
				if line == "" || strings.HasPrefix(line, "#") {
					continue
				}
				parts := strings.SplitN(line, "=", 2)
				if len(parts) == 2 {
					key := strings.TrimSpace(parts[0])
					val := strings.Trim(strings.TrimSpace(parts[1]), `"'`)
					if os.Getenv(key) == "" {
						_ = os.Setenv(key, val)
					}
				}
			}
			_ = f.Close()
			break
		}
	}
}

func Load() *Config {
	loadDotEnv()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbDriver := os.Getenv("DB_DRIVER")
	if dbDriver == "" {
		dbDriver = "mysql"
	}

	dbSource := os.Getenv("DB_SOURCE")
	if dbSource == "" {
		// Default Laragon MySQL: root without password on localhost:3306
		dbSource = "root:@tcp(127.0.0.1:3306)/income_db?charset=utf8mb4&parseTime=True&loc=Local"
	}

	redisHost := os.Getenv("REDIS_HOST")
	if redisHost == "" {
		redisHost = "127.0.0.1:6379"
	}

	redisPass := os.Getenv("REDIS_PASSWORD")

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "income_coffee_bakery_super_secret_jwt_key_2026"
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "development"
	}

	return &Config{
		Port:        port,
		DBDriver:    dbDriver,
		DBSource:    dbSource,
		RedisHost:   redisHost,
		RedisPass:   redisPass,
		RedisDB:     0,
		JWTSecret:   jwtSecret,
		Env:         env,
		FrontendURL: frontendURL,
	}
}
