package handlers

import (
	"backend/models"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type RegisterDeviceRequest struct {
	UserID     string `json:"userId"`
	DeviceID   string `json:"deviceId"`
	DeviceName string `json:"deviceName"`
}

func RegisterDevice(client *mongo.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Décoder le JSON reçu
		var req RegisterDeviceRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		// Vérifier les champs obligatoires
		if req.UserID == "" || req.DeviceID == "" || req.DeviceName == "" {
			http.Error(w, "Missing required fields", http.StatusBadRequest)
			return
		}

		// Convertir l'ID utilisateur en ObjectID
		userID, err := primitive.ObjectIDFromHex(req.UserID)
		if err != nil {
			http.Error(w, "Invalid user ID", http.StatusBadRequest)
			return
		}

		// Vérifier si l'appareil est déjà enregistré
		collection := client.Database("iotdb").Collection("devices")
		var existingDevice models.Device
		err = collection.FindOne(context.TODO(), bson.M{"deviceId": req.DeviceID}).Decode(&existingDevice)
		if err == nil {
			http.Error(w, "Device already registered", http.StatusConflict)
			return
		}

		// Créer un nouvel appareil
		newDevice := models.Device{
			UserID:     userID,
			DeviceID:   req.DeviceID,
			DeviceName: req.DeviceName,
			Registered: true,
			CreatedAt:  time.Now().Unix(),
		}

		// Insérer l'appareil dans la base de données
		_, err = collection.InsertOne(context.TODO(), newDevice)
		if err != nil {
			http.Error(w, "Failed to register device", http.StatusInternalServerError)
			return
		}

		// Répondre au client
		w.WriteHeader(http.StatusCreated)
		fmt.Fprintf(w, "Device registered successfully")
	}
}
