package handler

import (
	"crypto-backend/internal/model"
	"crypto-backend/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CryptoHandler struct {
	Service *service.CryptoService
}

func NewCryptoHandler(s *service.CryptoService) *CryptoHandler {
	return &CryptoHandler{Service: s}
}

func (h *CryptoHandler) Encrypt(c *gin.Context) {
	var req model.CryptoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.CryptoResponse{Error: err.Error()})
		return
	}

	result, err := h.Service.Encrypt(req.Text, req.Algorithm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.CryptoResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, model.CryptoResponse{Result: result})
}

func (h *CryptoHandler) Decrypt(c *gin.Context) {
	var req model.CryptoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, model.CryptoResponse{Error: err.Error()})
		return
	}

	result, err := h.Service.Decrypt(req.Text, req.Algorithm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, model.CryptoResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, model.CryptoResponse{Result: result})
}
