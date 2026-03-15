package crypto

import (
	"errors"
	"math/big"
)

// Hardcoded keys for demonstration
var (
	p = big.NewInt(61)
	q = big.NewInt(53)
	n = new(big.Int).Mul(p, q)
	e = big.NewInt(17)
	d = big.NewInt(2753)
)

func EncryptRSA(plaintext string) (string, error) {
	// Convert text string to a big integer
	m := new(big.Int).SetBytes([]byte(plaintext))
	if m.Cmp(n) >= 0 {
		return "", errors.New("message too long for encryption")
	}

	// c = m^e mod n
	c := new(big.Int).Exp(m, e, n)
	return c.String(), nil
}

func DecryptRSA(cipthertext string) (string, error) {
	// Parse the ciphertext string back into a big integer
	c := new(big.Int)
	c.SetString(cipthertext, 10)

	// m = c^d mod n
	m := new(big.Int).Exp(c, d, n)
	return string(m.Bytes()), nil
}
