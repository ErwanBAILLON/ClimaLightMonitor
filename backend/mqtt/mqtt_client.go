package mqtt

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	MQTT "github.com/eclipse/paho.mqtt.golang"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

var messagePubHandler MQTT.MessageHandler

// Structure des données du capteur
type SensorData struct {
	DeviceID    string  `bson:"deviceId" json:"deviceId"`
	Temperature float64 `bson:"temperature" json:"temperature"`
	Humidity    float64 `bson:"humidity" json:"humidity"`
	Luminosity  int     `bson:"luminosity" json:"luminosity"`
	Timestamp   time.Time `bson:"timestamp" json:"timestamp"`
}

// Valider les données du capteur
func validateSensorData(data SensorData) error {
	if data.DeviceID == "" {
		return fmt.Errorf("deviceId is missing")
	}
	if data.Temperature < -50 || data.Temperature > 100 {
		return fmt.Errorf("temperature value is out of range")
	}
	if data.Humidity < 0 || data.Humidity > 100 {
		return fmt.Errorf("humidity value is out of range")
	}
	if data.Luminosity < 0 {
		return fmt.Errorf("luminosity value is negative")
	}
	return nil
}

// Vérifier si le deviceId est enregistré pour un utilisateur
func isDeviceRegistered(mongoClient *mongo.Client, deviceId string) (bool, error) {
	collection := mongoClient.Database(os.Getenv("MONGO_DB")).Collection("devices")
	var device bson.M
	err := collection.FindOne(context.TODO(), bson.M{"deviceId": deviceId}).Decode(&device)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

// Gérer les messages MQTT reçus
func handleMQTTMessage(client MQTT.Client, msg MQTT.Message, mongoClient *mongo.Client) {
	fmt.Printf("Received message: %s from topic: %s\n", msg.Payload(), msg.Topic())

	// Décoder le message JSON
	var sensorData SensorData
	err := json.Unmarshal(msg.Payload(), &sensorData)
	if err != nil {
		log.Printf("Failed to unmarshal MQTT message payload: %v", err)
		return
	}

	// Valider les données du capteur
	err = validateSensorData(sensorData)
	if err != nil {
		log.Printf("Invalid sensor data: %v", err)
		return
	}

	// Vérifier si l'appareil est enregistré
	isRegistered, err := isDeviceRegistered(mongoClient, sensorData.DeviceID)
	if err != nil {
		log.Printf("Failed to verify device registration: %v", err)
		return
	}
	if !isRegistered {
		log.Printf("Unregistered device: %s", sensorData.DeviceID)
		return
	}

	// Ajouter un timestamp si absent
	if sensorData.Timestamp.IsZero() {
		sensorData.Timestamp = time.Now()
	}

	// Insérer les données dans MongoDB
	collection := mongoClient.Database(os.Getenv("MONGO_DB")).Collection("sensor_data")
	_, err = collection.InsertOne(context.TODO(), sensorData)
	if err != nil {
		log.Printf("Failed to insert MQTT message into MongoDB: %v", err)
	}
}

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
