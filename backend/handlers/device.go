package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"fmt"
	"os"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"log"
)

type RegisterDeviceRequest struct {
	UserID     string `json:"userId"`
	DeviceID   string `json:"deviceId"`
	DeviceName string `json:"deviceName"`
}

func RegisterDevice(client *mongo.Client) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var req struct {
            DeviceID string `json:"deviceId"`
            UserID   string `json:"userId"`
        }

		fmt.Println("RegisterDevice")

        // Décoder la requête JSON
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, "Invalid request payload", http.StatusBadRequest)
            return
        }

        // Vérifier que le `deviceId` et le `userId` sont fournis
        if req.DeviceID == "" || req.UserID == "" {
            http.Error(w, "Missing deviceId or userId", http.StatusBadRequest)
            return
        }

        // Vérifier que le `userId` est un ObjectID valide
        userId, err := primitive.ObjectIDFromHex(req.UserID)
        if err != nil {
            http.Error(w, "Invalid userId format", http.StatusBadRequest)
            return
        }

        // Rechercher et mettre à jour l'appareil dans MongoDB
        collection := client.Database("iot_db").Collection("devices")
        filter := bson.M{"deviceId": req.DeviceID}
        update := bson.M{"$set": bson.M{"userId": userId, "registered": true}}

        result, err := collection.UpdateOne(context.TODO(), filter, update)
        if err != nil {
            log.Printf("Failed to update device: %v", err)
            http.Error(w, "Failed to register device", http.StatusInternalServerError)
            return
        }

        // Vérifier si un document a été modifié
        if result.MatchedCount == 0 {
            http.Error(w, "Device not found", http.StatusNotFound)
            return
        }

        w.WriteHeader(http.StatusOK)
        w.Write([]byte("Device registered successfully"))
    }
}

func ListDevices(client *mongo.Client) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Récupération du userId à partir des paramètres de la requête
        userId := r.URL.Query().Get("userId")
        var filter bson.M

        if userId != "" {
            // Filtrer les appareils appartenant à cet utilisateur ou non enregistrés
            objectId, err := primitive.ObjectIDFromHex(userId)
            if err != nil {
                http.Error(w, "Invalid userId format", http.StatusBadRequest)
                return
            }
            filter = bson.M{
                "$or": []bson.M{
                    {"userId": objectId},        // Appareils appartenant à cet utilisateur
                    {"registered": false},      // Appareils non enregistrés
                },
            }
        } else {
            // Si aucun userId n'est fourni, retourner uniquement les appareils non enregistrés
            filter = bson.M{"registered": false}
        }

        // Requête MongoDB
        collection := client.Database(os.Getenv("MONGO_DB")).Collection("devices")
        cursor, err := collection.Find(context.TODO(), filter)
        if err != nil {
            log.Printf("Database query error: %v", err)
            http.Error(w, "Failed to query devices", http.StatusInternalServerError)
            return
        }
        defer cursor.Close(context.TODO())

        // Collecter tous les résultats
        var devices []bson.M
        if err := cursor.All(context.TODO(), &devices); err != nil {
            log.Printf("Cursor processing error: %v", err)
            http.Error(w, "Failed to process devices", http.StatusInternalServerError)
            return
        }

        // Réponse JSON
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(devices)
    }
}


func DeregisterDevice(client *mongo.Client) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var req struct {
            DeviceID string `json:"deviceId"`
        }

        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, "Invalid request payload", http.StatusBadRequest)
            return
        }

        collection := client.Database("iot_db").Collection("devices")
        filter := bson.M{"deviceId": req.DeviceID}
        update := bson.M{
            "$set": bson.M{
                "registered": false, // Marquer comme non enregistré
            },
            "$unset": bson.M{
                "userId": "", // Supprimer l'utilisateur associé
            },
        }

        result, err := collection.UpdateOne(context.TODO(), filter, update)
        if err != nil {
            log.Printf("Error deregistering device: %v", err)
            http.Error(w, "Failed to deregister device", http.StatusInternalServerError)
            return
        }

        if result.MatchedCount == 0 {
            http.Error(w, "Device not found", http.StatusNotFound)
            return
        }

        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]string{"message": "Device deregistered successfully"})
    }
}
