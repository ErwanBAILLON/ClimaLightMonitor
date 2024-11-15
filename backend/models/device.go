package models

import "go.mongodb.org/mongo-driver/bson/primitive"

// Device représente un appareil IoT associé à un utilisateur
type Device struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"`
	UserID      primitive.ObjectID `bson:"userId"`
	DeviceID    string             `bson:"deviceId"`
	DeviceName  string             `bson:"deviceName"`
	Registered  bool               `bson:"registered"`
	CreatedAt   int64              `bson:"createdAt"`
}
