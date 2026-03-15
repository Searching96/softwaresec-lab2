package service

import (
	"crypto-backend/internal/crypto"
	"errors"
)

type CryptoService struct{}

func NewCryptoService() *CryptoService {
	return &CryptoService{}
}

func (s *CryptoService) Encrypt(plaintext string, algo string) (string, error) {
	switch algo {
	case "RSA":
		return crypto.EncryptRSA(plaintext)
	case "AES":
		return "", errors.New("AES not implemented yet")
	case "DES":
		return "", errors.New("DES not implemented yet")
	default:
		return "", errors.New("unsupported algorithm")
	}
}

func (s *CryptoService) Decrypt(ciphertext string, algo string) (string, error) {
	switch algo {
	case "RSA":
		return crypto.DecryptRSA(ciphertext)
	case "AES":
		return "", errors.New("AES not implemented yet")
	case "DES":
		return "", errors.New("DES not implemented yet")
	default:
		return "", errors.New("unsupported algorithm")
	}
}
