package main

import (
	"backend/handlers"
	"backend/mqtt"
	"context"
	"fmt"
	"log"
	"net/http"
    "net/url"
    "os"

	gorillaHandlers "github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var client *mongo.Client

func encodePassword(password string) string {
	return url.QueryEscape(password)
}

func main() {
    // Connexion à MongoDB
    mongoHost := os.Getenv("MONGO_HOST")
    mongoPort := os.Getenv("MONGO_PORT")
    mongoUser := os.Getenv("MONGO_USER")
    mongoPassword := os.Getenv("MONGO_PASSWORD")
    mongoAuthSource := os.Getenv("MONGO_AUTH_SOURCE")

    clientOptions := options.Client().SetAuth(options.Credential{
		Username:      mongoUser,
		Password:      mongoPassword,
		AuthSource:    mongoAuthSource,
		AuthMechanism: "SCRAM-SHA-256",
	}).SetHosts([]string{fmt.Sprintf("%s:%s", mongoHost, mongoPort)})
    var err error
    client, err = mongo.Connect(context.TODO(), clientOptions)
    if err != nil {
        log.Fatal(err)
    }
    err = client.Ping(context.TODO(), nil)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println("Connected to MongoDB!")

    // Initialiser MQTT
    mqtt.InitMQTT(client)

    // Configurer le routeur
    r := mux.NewRouter()
    r.HandleFunc("/api/register", handlers.Register(client)).Methods("POST")
    r.HandleFunc("/api/login", handlers.Login(client)).Methods("POST")
    r.HandleFunc("/api/data", handlers.GetData(client)).Methods("GET")
    r.HandleFunc("/api/devices/register", handlers.RegisterDevice(client)).Methods("POST")

    // Configuration des en-têtes CORS
    headersOk := gorillaHandlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type", "Authorization"})
    originsOk := gorillaHandlers.AllowedOrigins([]string{"*"})
    methodsOk := gorillaHandlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"})

    // Démarrer le serveur avec le middleware CORS
    fmt.Println("Starting server on :8080...")
    log.Fatal(http.ListenAndServe(":8080", gorillaHandlers.CORS(originsOk, headersOk, methodsOk)(r)))
}
