package main

import (
	"crypto-backend/internal/crypto"
	"crypto-backend/internal/handler"
	"crypto-backend/internal/service"
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize the real RSA keys on startup
	if err := crypto.InitRSA(); err != nil {
		log.Fatal("Failed to initialize RSA keys:", err)
	}

	router := gin.Default()

	// CORS config to allow the React frontend
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Dependency Injection: Wire the service to the handler
	cryptoService := service.NewCryptoService()
	cryptoHandler := handler.NewCryptoHandler(cryptoService)

	// Route mapping
	router.POST("api/encrypt", cryptoHandler.Encrypt)
	router.POST("api/decrypt", cryptoHandler.Decrypt)

	log.Println("Server running on http://localhost:8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatal("Failed to start server: ", err)
	}
}
