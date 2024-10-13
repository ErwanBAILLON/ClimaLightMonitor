package mqtt

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	MQTT "github.com/eclipse/paho.mqtt.golang"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

var messagePubHandler MQTT.MessageHandler

func handleMQTTMessage(client MQTT.Client, msg MQTT.Message, mongoClient *mongo.Client) {
	fmt.Printf("Received message: %s from topic: %s\n", msg.Payload(), msg.Topic())

	// Convertir le message en format JSON
	var sensorData bson.M
	err := bson.UnmarshalExtJSON(msg.Payload(), true, &sensorData)
	if err != nil {
		log.Printf("Failed to unmarshal MQTT message payload: %v", err)
		return
	}

	// Ajouter un timestamp au document
	sensorData["timestamp"] = time.Now()

	// Insertion dans MongoDB
	collection := mongoClient.Database("iot_db").Collection("sensor_data")
	_, err = collection.InsertOne(context.TODO(), sensorData)
	if err != nil {
		log.Printf("Failed to insert MQTT message into MongoDB: %v", err)
	}
}

func InitMQTT(mongoClient *mongo.Client) {
	messagePubHandler = func(client MQTT.Client, msg MQTT.Message) {
		handleMQTTMessage(client, msg, mongoClient)
	}
	opts := MQTT.NewClientOptions().AddBroker("tcp://" + os.Getenv("MQTT_BROKER_ADDRESS") + ":1883").SetClientID("go_mqtt_client")
	opts.SetDefaultPublishHandler(messagePubHandler)

	client := MQTT.NewClient(opts)
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		log.Fatal(token.Error())
	}
	fmt.Println("Connected to MQTT Broker!")

	if token := client.Subscribe("sensor/data", 0, nil); token.Wait() && token.Error() != nil {
		log.Fatal(token.Error())
	}
	fmt.Println("Subscribed to topic: sensor/data")
}