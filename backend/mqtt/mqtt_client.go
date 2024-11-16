package mqtt

import (
	"context"
	"encoding/json"
	"log"
	"time"
	"fmt"
	"os"

	MQTT "github.com/eclipse/paho.mqtt.golang"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// Structure des données MQTT
type SensorData struct {
	DeviceID    string  `json:"deviceId"`
	Temperature float64 `json:"temperature"`
	Humidity    float64 `json:"humidity"`
	Luminosity  int     `json:"luminosity"`
	Timestamp   string  `json:"timestamp"`
}

// Fonction pour gérer les messages MQTT
func handleMQTTMessage(client MQTT.Client, msg MQTT.Message, mongoClient *mongo.Client) {
	// Décodage du message MQTT
	var sensorData SensorData
	err := json.Unmarshal(msg.Payload(), &sensorData)
	if err != nil {
		log.Printf("Failed to unmarshal MQTT message payload: %v", err)
		return
	}

	// Vérifier si l'appareil est enregistré dans la collection "devices"
	devicesCollection := mongoClient.Database("iot_db").Collection("devices")
	var device bson.M
	err = devicesCollection.FindOne(context.TODO(), bson.M{"deviceId": sensorData.DeviceID}).Decode(&device)
	if err == mongo.ErrNoDocuments {
		// Si l'appareil n'est pas enregistré, l'ajouter à la collection "devices"
		log.Printf("Device not registered: %s. Registering automatically.", sensorData.DeviceID)
		newDevice := bson.M{
			"deviceId":  sensorData.DeviceID,
			"registered": false,
			"createdAt": time.Now(),
		}
		_, err := devicesCollection.InsertOne(context.TODO(), newDevice)
		if err != nil {
			log.Printf("Failed to register device: %v", err)
			return
		}
	} else if err != nil {
		// Gestion des erreurs lors de la recherche dans la collection "devices"
		log.Printf("Error checking device registration: %v", err)
		return
	}

	// Ajouter un timestamp si non présent dans les données
	if sensorData.Timestamp == "" {
		sensorData.Timestamp = time.Now().Format(time.RFC3339)
	}

	// Insérer les données dans la collection "sensor_data"
	sensorDataCollection := mongoClient.Database("iot_db").Collection("sensor_data")
	_, err = sensorDataCollection.InsertOne(context.TODO(), bson.M{
		"deviceId":    sensorData.DeviceID,
		"temperature": sensorData.Temperature,
		"humidity":    sensorData.Humidity,
		"luminosity":  sensorData.Luminosity,
		"timestamp":   sensorData.Timestamp,
	})
	if err != nil {
		log.Printf("Failed to insert sensor data: %v", err)
		return
	}

	log.Printf("Successfully inserted data for device %s", sensorData.DeviceID)
}

var messagePubHandler MQTT.MessageHandler

func InitMQTT(mongoClient *mongo.Client) {
	messagePubHandler = func(client MQTT.Client, msg MQTT.Message) {
		handleMQTTMessage(client, msg, mongoClient)
	}

	// Configurer les options du client MQTT
	brokerAddress := os.Getenv("MQTT_BROKER_ADDRESS")
	opts := MQTT.NewClientOptions().
		AddBroker(fmt.Sprintf("tcp://%s:1883", brokerAddress)).
		SetClientID("go_mqtt_client").
		SetDefaultPublishHandler(messagePubHandler)

	client := MQTT.NewClient(opts)
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		log.Fatalf("Failed to connect to MQTT Broker: %v", token.Error())
	}
	fmt.Println("Connected to MQTT Broker!")

	// S'abonner au topic MQTT
	if token := client.Subscribe("sensor/data", 0, nil); token.Wait() && token.Error() != nil {
		log.Fatalf("Failed to subscribe to topic: %v", token.Error())
	}
	fmt.Println("Subscribed to topic: sensor/data")
}
