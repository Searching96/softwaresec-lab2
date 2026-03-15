package crypto

import (
	"bytes"
	"encoding/base64"
	"errors"
)

// 1. Core AES Data Structures
// The standard AES Substitution Box (S-Box)
var sbox = [256]byte{
	0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
	0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
	0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
	0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
	0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
	0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
	0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
	0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
	0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
	0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
	0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
	0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
	0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
	0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
	0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
	0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16,
}

// Instead of hardcoding the Inverse S-Box, we generate it dynamically to save code
var invSbox [256]byte

func init() {
	for i := 0; i < 256; i++ {
		invSbox[sbox[i]] = byte(i)
	}
}

// Round Constants for Key Expansion
var rcon = []byte{0x8d, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36}

// 2. AES Core Operations
func addRoundKey(state []byte, roundKey []byte) {
	for i := 0; i < 16; i++ {
		state[i] ^= roundKey[i]
	}
}

func subBytes(state []byte) {
	for i := 0; i < 16; i++ {
		state[i] = sbox[state[i]]
	}
}

func invSubBytes(state []byte) {
	for i := 0; i < 16; i++ {
		state[i] = invSbox[state[i]]
	}
}

func shiftRows(state []byte) {
	temp := make([]byte, 16)
	copy(temp, state)
	state[1], state[5], state[9], state[13] = temp[5], temp[9], temp[13], temp[1]
	state[2], state[6], state[10], state[14] = temp[10], temp[14], temp[2], temp[6]
	state[3], state[7], state[11], state[15] = temp[15], temp[3], temp[7], temp[11]
}

func invShiftRows(state []byte) {
	temp := make([]byte, 16)
	copy(temp, state)
	state[1], state[5], state[9], state[13] = temp[13], temp[1], temp[5], temp[9]
	state[2], state[6], state[10], state[14] = temp[10], temp[14], temp[2], temp[6]
	state[3], state[7], state[11], state[15] = temp[7], temp[11], temp[15], temp[3]
}

// Galois Field Multiplication
func xtime(x byte) byte {
	if x&0x80 != 0 {
		return (x << 1) ^ 0x1b
	}
	return x << 1
}

func multiply(val, mul byte) byte {
	var res byte
	for i := 0; i < 8; i++ {
		if mul&1 != 0 {
			res ^= val
		}
		hi := val & 0x80
		val <<= 1
		if hi != 0 {
			val ^= 0x1b
		}
		mul >>= 1
	}
	return res
}

func mixColumns(state []byte) {
	for i := 0; i < 4; i++ {
		c := i * 4
		s0, s1, s2, s3 := state[c], state[c+1], state[c+2], state[c+3]
		state[c] = xtime(s0) ^ xtime(s1) ^ s1 ^ s2 ^ s3
		state[c+1] = s0 ^ xtime(s1) ^ xtime(s2) ^ s2 ^ s3
		state[c+2] = s0 ^ s1 ^ xtime(s2) ^ xtime(s3) ^ s3
		state[c+3] = xtime(s0) ^ s0 ^ s1 ^ s2 ^ xtime(s3)
	}
}

func invMixColumns(state []byte) {
	for i := 0; i < 4; i++ {
		c := i * 4
		s0, s1, s2, s3 := state[c], state[c+1], state[c+2], state[c+3]
		state[c] = multiply(s0, 14) ^ multiply(s1, 11) ^ multiply(s2, 13) ^ multiply(s3, 9)
		state[c+1] = multiply(s0, 9) ^ multiply(s1, 14) ^ multiply(s2, 11) ^ multiply(s3, 13)
		state[c+2] = multiply(s0, 13) ^ multiply(s1, 9) ^ multiply(s2, 14) ^ multiply(s3, 11)
		state[c+3] = multiply(s0, 11) ^ multiply(s1, 13) ^ multiply(s2, 9) ^ multiply(s3, 14)
	}
}

// 3. Key Expansion (Generating subkeys for 10 rounds)
func keyExpansion(key []byte) []byte {
	expKey := make([]byte, 176)
	copy(expKey, key)
	for i := 16; i < 176; i += 4 {
		temp := []byte{expKey[i-4], expKey[i-3], expKey[i-2], expKey[i-1]}
		if i%16 == 0 {
			temp = []byte{temp[1], temp[2], temp[3], temp[0]}
			for j := 0; j < 4; j++ {
				temp[j] = sbox[temp[j]]
			}
			temp[0] ^= rcon[i/16]
		}
		for j := 0; j < 4; j++ {
			expKey[i+j] = expKey[i-16+j] ^ temp[j]
		}
	}
	return expKey
}

// 4. Block Encrypt & Decrypt
func encryptBlock(block []byte, expKey []byte) {
	addRoundKey(block, expKey[0:16])
	for round := 1; round < 10; round++ {
		subBytes(block)
		shiftRows(block)
		mixColumns(block)
		addRoundKey(block, expKey[round*16:(round+1)*16])
	}
	subBytes(block)
	shiftRows(block)
	addRoundKey(block, expKey[160:176])
}

func decryptBlock(block []byte, expKey []byte) {
	addRoundKey(block, expKey[160:176])
	for round := 9; round > 0; round-- {
		invShiftRows(block)
		invSubBytes(block)
		addRoundKey(block, expKey[round*16:(round+1)*16])
		invMixColumns(block)
	}
	invShiftRows(block)
	invSubBytes(block)
	addRoundKey(block, expKey[0:16])
}

// 5. Public Handlers with PKCS7 Padding
func pad(data []byte, blockSize int) []byte {
	padding := blockSize - len(data)%blockSize
	padText := bytes.Repeat([]byte{byte(padding)}, padding)
	return append(data, padText...)
}

func unpad(data []byte) ([]byte, error) {
	length := len(data)
	if length == 0 {
		return nil, errors.New("empty data")
	}
	padding := int(data[length-1])
	if padding == 0 || padding > 16 {
		return nil, errors.New("invalid padding")
	}
	return data[:length-padding], nil
}

func EncryptAES(plaintext string) (string, error) {
	key := []byte("ThisIsA16ByteKey") // Educational hardcoded 16-byte key
	expKey := keyExpansion(key)

	data := pad([]byte(plaintext), 16)
	ciphertext := make([]byte, len(data))

	for i := 0; i < len(data); i += 16 {
		block := make([]byte, 16)
		copy(block, data[i:i+16])
		encryptBlock(block, expKey)
		copy(ciphertext[i:i+16], block)
	}

	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func DecryptAES(cryptoText string) (string, error) {
	key := []byte("ThisIsA16ByteKey")
	expKey := keyExpansion(key)

	ciphertext, err := base64.StdEncoding.DecodeString(cryptoText)
	if err != nil {
		return "", err
	}
	if len(ciphertext)%16 != 0 {
		return "", errors.New("invalid block size")
	}

	plaintext := make([]byte, len(ciphertext))
	for i := 0; i < len(ciphertext); i += 16 {
		block := make([]byte, 16)
		copy(block, ciphertext[i:i+16])
		decryptBlock(block, expKey)
		copy(plaintext[i:i+16], block)
	}

	unpadded, err := unpad(plaintext)
	if err != nil {
		return "", err
	}
	return string(unpadded), nil
}
