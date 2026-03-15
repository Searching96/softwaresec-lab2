package model

type CryptoRequest struct {
	Text      string `json:"text" binding:"required"`
	Algorithm string `json:"algorithm" binding:"required,oneof=AES DES RSA"`
	Key       string `json:"key"`
}

type CryptoResponse struct {
	Result string `json:"result"`
	Error  string `json:"error,omitempty"`
}
