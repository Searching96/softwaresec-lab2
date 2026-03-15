package crypto

import (
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
)

// Hardcoded keys for demonstration
var (
	n *big.Int
	e *big.Int
	d *big.Int
)

// Generate a 2048-bit RSA keypair
// It creates two 1024-bit primes to form a 2048-bit modulus
func InitRSA() error {
	fmt.Println("Generating 2048-bit RSA keys. This might take a second...")

	// 1. Generate two large random primes, p and q
	p, err := rand.Prime(rand.Reader, 1024)
	if err != nil {
		return err
	}
	q, err := rand.Prime(rand.Reader, 1024)
	if err != nil {
		return err
	}

	// 2. Calculate modulus: n = p * q
	n = new(big.Int).Mul(p, q)

	// 3. Calculate totient: phi = (p-1) * (q-1)
	pMinus1 := new(big.Int).Sub(p, big.NewInt(1))
	qMinus1 := new(big.Int).Sub(q, big.NewInt(1))
	phi := new(big.Int).Mul(pMinus1, qMinus1)

	// 4. Set public exponent e (65537 is the standard)
	e = big.NewInt(65537)

	// 5. Calculate private exponent d = e^-1 mod phi
	d = new(big.Int).ModInverse(e, phi)
	if d == nil {
		return errors.New("failed to calculate modular inverse for private key")
	}

	fmt.Println("RSA Keys successfully generated!")
	return nil
}

func EncryptRSA(plaintext string) (string, error) {
	if n == nil || e == nil {
		return "", errors.New("RSA keys not initialized")
	}

	// Convert text string to a big integer
	m := new(big.Int).SetBytes([]byte(plaintext))
	if m.Cmp(n) >= 0 {
		return "", errors.New("message too long for the 2048-bit key size")
	}

	// c = m^e mod n
	c := new(big.Int).Exp(m, e, n)

	// We return Base62/Base64 or just standard base-10 string. Base-10 is fine for learning.
	return c.String(), nil
}

func DecryptRSA(ciphertext string) (string, error) {
	if n == nil || d == nil {
		return "", errors.New("RSA keys not initialized")
	}

	// Parse the ciphertext string back into a big integer
	c := new(big.Int)
	if _, ok := c.SetString(ciphertext, 10); !ok {
		return "", errors.New("invalid ciphertext format")
	}

	// m = c^d mod n
	m := new(big.Int).Exp(c, d, n)
	return string(m.Bytes()), nil
}
