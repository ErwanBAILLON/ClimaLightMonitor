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

    // Vérifier si l'appareil est enregistré
    devicesCollection := mongoClient.Database("iot_db").Collection("devices")
    var device bson.M
    err = devicesCollection.FindOne(context.TODO(), bson.M{"deviceId": sensorData.DeviceID}).Decode(&device)
    if err == mongo.ErrNoDocuments {
        // Enregistrer automatiquement un nouvel appareil
        log.Printf("Unregistered device: %s. Registering it automatically.", sensorData.DeviceID)
        newDevice := bson.M{
            "deviceId":  sensorData.DeviceID,
            "registered": false, // Marqueur pour une association ultérieure avec un utilisateur
            "createdAt": time.Now(),
        }

        _, err = devicesCollection.InsertOne(context.TODO(), newDevice)
        if err != nil {
            log.Printf("Failed to register new device: %v", err)
            return
        }

        log.Printf("Device %s registered successfully", sensorData.DeviceID)
    } else if err != nil {
        log.Printf("Failed to query devices: %v", err)
        return
    }

    // Ajouter un timestamp si absent
    if sensorData.Timestamp.IsZero() {
        sensorData.Timestamp = time.Now()
    }

    // Insérer les données dans MongoDB
    sensorCollection := mongoClient.Database("iot_db").Collection("sensor_data")
    _, err = sensorCollection.InsertOne(context.TODO(), sensorData)
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
