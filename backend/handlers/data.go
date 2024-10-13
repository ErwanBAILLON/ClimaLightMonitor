package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func GetData(client *mongo.Client) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        collection := client.Database("iot_db").Collection("sensor_data")
        cursor, err := collection.Find(context.TODO(), bson.M{})
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        defer cursor.Close(context.TODO())
        var data []bson.M
        if err = cursor.All(context.TODO(), &data); err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        json.NewEncoder(w).Encode(data)
    }
}