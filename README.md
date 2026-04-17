# Crypto App

A simple cryptography learning project with a Go backend API and a React + Vite frontend.

## Project Structure

```text
crypto-app/
├── backend/                        # Go API for encryption/decryption operations
│   ├── go.mod                      # Go module definition and dependencies
│   ├── cmd/
│   │   └── api/
│   │       └── main.go             # Backend entry point (starts the API server)
│   └── internal/
│       ├── crypto/
│       │   ├── aes.go              # AES encryption/decryption implementation
│       │   ├── des.go              # DES encryption/decryption implementation
│       │   └── rsa.go              # RSA key generation, encryption, decryption
│       ├── handler/
│       │   └── crypto.go           # HTTP handlers for crypto endpoints
│       ├── model/
│       │   └── payload.go          # Request/response payload structures
│       └── service/
│           └── encryption.go       # Business logic orchestration for algorithms
└── frontend/                       # React client UI for using crypto features
    ├── package.json                # Frontend scripts and npm dependencies
    ├── vite.config.ts              # Vite development/build configuration
    ├── index.html                  # HTML template used by Vite
    ├── eslint.config.js            # ESLint rules for code quality
    ├── tsconfig.json               # Base TypeScript configuration
    ├── tsconfig.app.json           # TypeScript config for app source
    ├── tsconfig.node.json          # TypeScript config for Node/Vite tooling
    ├── README.md                   # Frontend-specific setup notes
    ├── public/                     # Static assets served as-is
    └── src/                        # Frontend source code
        ├── main.tsx                # React app bootstrap
        ├── App.tsx                 # Main app component
        ├── App.css                 # App-level styles
        ├── index.css               # Global styles
        └── assets/                 # Frontend assets (images/icons/etc.)
```
