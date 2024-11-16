package handlers

import (
	"backend/utils"
	"context"
	"encoding/json"
	"net/http"
    "os"

    "go.mongodb.org/mongo-driver/bson/primitive"
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

        // Vérifier si un utilisateur avec le même Username existe déjà
        collection := client.Database(os.Getenv("MONGO_DB")).Collection("users")
        var existingUser User
        err := collection.FindOne(context.TODO(), bson.M{"username": user.Username}).Decode(&existingUser)
        if err == nil {
            // Si un utilisateur est trouvé, renvoyer une erreur
            http.Error(w, "User already exists", http.StatusConflict) // HTTP 409 Conflict
            return
        } else if err != mongo.ErrNoDocuments {
            // Si une erreur autre que "document non trouvé" survient
            http.Error(w, "Error checking existing user", http.StatusInternalServerError)
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
        result, err := collection.InsertOne(context.TODO(), user)
        if err != nil {
            http.Error(w, "Error creating user", http.StatusInternalServerError)
            return
        }

        // Récupérer l'ID inséré et le convertir en chaîne
        insertedID := result.InsertedID.(primitive.ObjectID).Hex()

        // Générer un token JWT avec l'ID utilisateur
        token, err := utils.GenerateJWT(insertedID)
        if err != nil {
            http.Error(w, "Error generating token", http.StatusInternalServerError)
            return
        }

        // Répondre avec le statut HTTP 201 Created
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusCreated) // Spécifie le statut 201
        json.NewEncoder(w).Encode(map[string]string{"token": token, "userId": insertedID})
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
        var storedUser struct {
            ID       primitive.ObjectID `bson:"_id"` // Récupère le champ `_id` correctement
            Username string             `bson:"username"`
            Password string             `bson:"password"`
        }
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

        // Générer un token JWT avec l'ObjectID utilisateur
        token, err := utils.GenerateJWT(storedUser.ID.Hex()) // Utiliser l'ObjectID
        if err != nil {
            http.Error(w, "Error generating token", http.StatusInternalServerError)
            return
        }

        // Récupérer les appareils associés à l'utilisateur
        devicesCollection := client.Database(os.Getenv("MONGO_DB")).Collection("devices")
        var devices []bson.M

        // Convertir `storedUser.ID` en `ObjectID` pour la recherche
        cursor, err := devicesCollection.Find(context.TODO(), bson.M{"userId": storedUser.ID})
        if err != nil {
            http.Error(w, "Failed to retrieve devices", http.StatusInternalServerError)
            return
        }
        defer cursor.Close(context.TODO())

        if err := cursor.All(context.TODO(), &devices); err != nil {
            http.Error(w, "Failed to process devices", http.StatusInternalServerError)
            return
        }

        // Construire la réponse avec le token et les appareils
        response := map[string]interface{}{
            "token":   token,
            "userId":  storedUser.ID.Hex(), // Retourner l'ObjectID
            "devices": devices,
        }

        // Répondre avec le token et les appareils associés
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(response)
    }
}
