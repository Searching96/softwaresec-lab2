package service

import (
	"crypto-backend/internal/crypto"
	"errors"
)

type CryptoService struct{}

func NewCryptoService() *CryptoService {
	return &CryptoService{}
}

func (s *CryptoService) Encrypt(text string, algo string) (string, error) {
	switch algo {
	case "RSA":
		return crypto.EncryptRSA(text)
	case "AES":
		return crypto.EncryptAES(text)
	case "DES":
		return crypto.EncryptDES(text)
	default:
		return "", errors.New("unsupported algorithm")
	}
}

func (s *CryptoService) Decrypt(cryptoText string, algo string) (string, error) {
	switch algo {
	case "RSA":
		return crypto.DecryptRSA(cryptoText)
	case "AES":
		return crypto.DecryptAES(cryptoText)
	case "DES":
		return crypto.DecryptDES(cryptoText)
	default:
		return "", errors.New("unsupported algorithm")
	}
}
