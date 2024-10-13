package main

import (
	"backend/handlers" // tes propres handlers
	"backend/mqtt"
	"context"
	"fmt"
	"log"
	"net/http"

	gorillaHandlers "github.com/gorilla/handlers" // Assure-toi que cet import est présent
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var client *mongo.Client

func main() {
    // Connexion à MongoDB
    clientOptions := options.Client().ApplyURI("mongodb://mongo:27017")
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
    r.HandleFunc("/register", handlers.Register(client)).Methods("POST")
    r.HandleFunc("/login", handlers.Login(client)).Methods("POST")
    r.HandleFunc("/data", handlers.GetData(client)).Methods("GET")

    // Configuration des en-têtes CORS
    headersOk := gorillaHandlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type", "Authorization"})
    originsOk := gorillaHandlers.AllowedOrigins([]string{"*"}) // Ici, "*" permet toutes les origines, tu peux le restreindre si nécessaire
    methodsOk := gorillaHandlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"})

    // Démarrer le serveur avec le middleware CORS
    fmt.Println("Starting server on :8080...")
    log.Fatal(http.ListenAndServe(":8080", gorillaHandlers.CORS(originsOk, headersOk, methodsOk)(r)))
}
