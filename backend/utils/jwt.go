package utils

import (
	"time"

	"github.com/dgrijalva/jwt-go"
)

var jwtKey = []byte("votre_cle_secrete") // Remplacez par une clé secrète sécurisée

func GenerateJWT(userId string) (string, error) {
	claims := &jwt.StandardClaims{
		Subject:   userId,
		ExpiresAt: time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}