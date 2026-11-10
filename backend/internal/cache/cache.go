package cache

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

type Cache interface {
	Get(ctx context.Context, key string, dest interface{}) error
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
	Delete(ctx context.Context, keys ...string) error
	DeletePrefix(ctx context.Context, prefix string) error
	Increment(ctx context.Context, key string) (int64, error)
	IsConnected() bool
	ProviderName() string
}

type memoryEntry struct {
	data      []byte
	expiresAt time.Time
	isCounter bool
	counter   int64
}

type memoryCache struct {
	mu    sync.RWMutex
	items map[string]memoryEntry
}

func newMemoryCache() *memoryCache {
	mc := &memoryCache{
		items: make(map[string]memoryEntry),
	}
	// Background cleanup of expired keys
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		for range ticker.C {
			mc.mu.Lock()
			now := time.Now()
			for k, v := range mc.items {
				if !v.expiresAt.IsZero() && now.After(v.expiresAt) {
					delete(mc.items, k)
				}
			}
			mc.mu.Unlock()
		}
	}()
	return mc
}

func (m *memoryCache) Get(ctx context.Context, key string, dest interface{}) error {
	m.mu.RLock()
	defer m.mu.RUnlock()
	entry, found := m.items[key]
	if !found {
		return redis.Nil
	}
	if !entry.expiresAt.IsZero() && time.Now().After(entry.expiresAt) {
		return redis.Nil
	}
	return json.Unmarshal(entry.data, dest)
}

func (m *memoryCache) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	var exp time.Time
	if expiration > 0 {
		exp = time.Now().Add(expiration)
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	m.items[key] = memoryEntry{
		data:      data,
		expiresAt: exp,
	}
	return nil
}

func (m *memoryCache) Delete(ctx context.Context, keys ...string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, k := range keys {
		delete(m.items, k)
	}
	return nil
}

func (m *memoryCache) DeletePrefix(ctx context.Context, prefix string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for k := range m.items {
		if len(k) >= len(prefix) && k[:len(prefix)] == prefix {
			delete(m.items, k)
		}
	}
	return nil
}

func (m *memoryCache) Increment(ctx context.Context, key string) (int64, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	entry, found := m.items[key]
	if !found || (!entry.expiresAt.IsZero() && time.Now().After(entry.expiresAt)) {
		entry = memoryEntry{
			isCounter: true,
			counter:   1,
			expiresAt: time.Now().Add(10 * time.Minute),
		}
		m.items[key] = entry
		return 1, nil
	}
	entry.counter++
	m.items[key] = entry
	return entry.counter, nil
}

func (m *memoryCache) IsConnected() bool {
	return true
}

func (m *memoryCache) ProviderName() string {
	return "in-memory-fallback"
}

// Redis wrapper
type redisCache struct {
	client *redis.Client
}

func (r *redisCache) Get(ctx context.Context, key string, dest interface{}) error {
	val, err := r.client.Get(ctx, key).Result()
	if err != nil {
		return err
	}
	return json.Unmarshal([]byte(val), dest)
}

func (r *redisCache) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return r.client.Set(ctx, key, data, expiration).Err()
}

func (r *redisCache) Delete(ctx context.Context, keys ...string) error {
	return r.client.Del(ctx, keys...).Err()
}

func (r *redisCache) DeletePrefix(ctx context.Context, prefix string) error {
	iter := r.client.Scan(ctx, 0, prefix+"*", 0).Iterator()
	for iter.Next(ctx) {
		r.client.Del(ctx, iter.Val())
	}
	return iter.Err()
}

func (r *redisCache) Increment(ctx context.Context, key string) (int64, error) {
	return r.client.Incr(ctx, key).Result()
}

func (r *redisCache) IsConnected() bool {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()
	return r.client.Ping(ctx).Err() == nil
}

func (r *redisCache) ProviderName() string {
	return "redis"
}

func New(addr, password string, db int) Cache {
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		_ = rdb.Close()
		log.Printf("[CACHE] Redis connection to %s failed: %v. Gracefully falling back to threadsafe In-Memory Cache.", addr, err)
		return newMemoryCache()
	}

	log.Printf("[CACHE] Connected successfully to Redis at %s!", addr)
	return &redisCache{client: rdb}
}
