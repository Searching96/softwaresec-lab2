package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	// CORS config to allow the React frontend
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Placeholder routes (will be linked later)
	router.POST("api/encrypt", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "encrypt endpoint ready"})
	})

	router.POST("api/decrypt", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "decrypt endpoint ready"})
	})

	log.Println("Server running on http://localhost:8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatal("Failed to start server: ", err)
	}
}
