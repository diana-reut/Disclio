import { useEffect } from "react";
import { Client } from "@stomp/stompjs";

export function useCDSocket(onNewCD) {

    useEffect(() => {

        const client = new Client({
            brokerURL: "ws://localhost:8080/ws",
            reconnectDelay: 3000,
            debug: (msg) => console.log("STOMP:", msg),
        });

        client.onConnect = () => {
            console.log("WebSocket connected");

            client.subscribe("/topic/cds", (message) => {
                const cd = JSON.parse(message.body);
                console.log("MESSAGE:", cd);

                onNewCD(cd);
            });
        };

        client.onStompError = (frame) => {
            console.error("STOMP ERROR:", frame);
        };

        client.activate();

        return () => {
            client.deactivate();
        };

    }, [onNewCD]);
}