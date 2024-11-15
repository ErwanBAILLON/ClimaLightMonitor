package handlers

import (
	"backend/utils"
	"context"
	"encoding/json"
	"net/http"
    "os"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
    "golang.org/x/crypto/bcrypt"
)

type User struct {
    Username string `json:"username"`
    Password string `json:"password"`
}

func Register(client *mongo.Client) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var user User
        if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
            http.Error(w, "Invalid request payload", http.StatusBadRequest)
            return
        }

        // Hacher le mot de passe avant de l'enregistrer
        hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
        if err != nil {
            http.Error(w, "Error hashing password", http.StatusInternalServerError)
            return
        }
        user.Password = string(hashedPassword)

        // Ajouter l'utilisateur à la base de données
        collection := client.Database(os.Getenv("MONGO_DB")).Collection("users")
        result, err := collection.InsertOne(context.TODO(), user)
        if err != nil {
            http.Error(w, "Error creating user", http.StatusInternalServerError)
            return
        }

        // Générer un token JWT avec l'ID utilisateur
        userId := result.InsertedID.(string)
        token, err := utils.GenerateJWT(userId)
        if err != nil {
            http.Error(w, "Error generating token", http.StatusInternalServerError)
            return
        }

        // Répondre avec le token
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]string{"token": token, "userId": userId})
    }
}

func Login(client *mongo.Client) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var user User
        if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
            http.Error(w, "Invalid request payload", http.StatusBadRequest)
            return
        }

        // Rechercher l'utilisateur dans la base de données
        collection := client.Database(os.Getenv("MONGO_DB")).Collection("users")
        var storedUser User
        err := collection.FindOne(context.TODO(), bson.M{"username": user.Username}).Decode(&storedUser)
        if err != nil {
            http.Error(w, "Invalid credentials", http.StatusUnauthorized)
            return
        }

        // Vérifier le mot de passe
        if err := bcrypt.CompareHashAndPassword([]byte(storedUser.Password), []byte(user.Password)); err != nil {
            http.Error(w, "Invalid credentials", http.StatusUnauthorized)
            return
        }

        // Générer un token JWT avec l'ID utilisateur
        token, err := utils.GenerateJWT(storedUser.Username)
        if err != nil {
            http.Error(w, "Error generating token", http.StatusInternalServerError)
            return
        }

        // Répondre avec le token
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]string{"token": token, "userId": storedUser.Username})
    }
}
