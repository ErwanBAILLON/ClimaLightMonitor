package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func GetData(client *mongo.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Collection des données
		collection := client.Database(os.Getenv("MONGO_DB")).Collection("sensor_data")

		// Lire les paramètres de requête
		userId := r.URL.Query().Get("userId")
		deviceId := r.URL.Query().Get("deviceId")

		// Construire le filtre
		filter := bson.M{}
		if userId != "" {
			filter["userId"] = userId
		}
		if deviceId != "" {
			filter["deviceId"] = deviceId
		}

		// Exécuter la requête avec le filtre
		cursor, err := collection.Find(context.TODO(), filter)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer cursor.Close(context.TODO())

		// Lire les résultats dans un tableau
		var data []bson.M
		if err := cursor.All(context.TODO(), &data); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Retourner les données en JSON
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data)
	}
}
