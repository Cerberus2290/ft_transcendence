from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from api_accounts.consumers import PongGameConsumer

application = ProtocolTypeRouter({
    "websocket": URLRouter([
        path("ws/pong/", PongGameConsumer.as_asgi()),
    ]),
})