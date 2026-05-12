import { useEffect } from "react";
import { Client } from "@stomp/stompjs";
import { WS_ENDPOINT } from "../api/client";

export function useCDSocket(onNewCD) {

    useEffect(() => {

        const client = new Client({
            brokerURL: WS_ENDPOINT,
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
