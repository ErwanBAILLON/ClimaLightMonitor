package handlers

import (
	"backend/utils"
	"context"
	"encoding/json"
	"net/http"
    "os"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type User struct {
    Username string `json:"username"`
    Password string `json:"password"`
}

func Register(client *mongo.Client) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var user User
        _ = json.NewDecoder(r.Body).Decode(&user)
        collection := client.Database(os.Getenv("MONGO_DB")).Collection("users")
        _, err := collection.InsertOne(context.TODO(), user)
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        w.WriteHeader(http.StatusCreated)
    }
}

func Login(client *mongo.Client) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var user User
        _ = json.NewDecoder(r.Body).Decode(&user)
        collection := client.Database(os.Getenv("MONGO_DB")).Collection("users")
        var result User
        err := collection.FindOne(context.TODO(), bson.M{"username": user.Username}).Decode(&result)
        if err != nil {
            http.Error(w, "Invalid credentials", http.StatusUnauthorized)
            return
        }
        token, err := utils.GenerateJWT(user.Username)
        if err != nil {
            http.Error(w, "Error generating token", http.StatusInternalServerError)
            return
        }
        json.NewEncoder(w).Encode(map[string]string{"token": token})
    }
}