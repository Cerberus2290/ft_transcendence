import json
import uuid

from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync
from .views import matchmaking_queue, initialize_game_state, game_sessions

class PongGameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        # parse received json data
        data = json.loads(text_data)

        # check the action type from received data
        action = data.get('action', '')

        if action == 'ready_for_matchmaking':
            # handle the player's request to join the matchmaking
            await self.join_matchmaking()
    
    async def join_matchmaking(self):
        # get user associated with the websocket
        user = self.scope['user']

        # check if the user is authenticated
        if user.is_authenticated:
            #check if user is already in queue
            if user in matchmaking_queue:
                await self.send(text_data=json.dumps({
                    'status': 'already in queue'
                }))
            else:
                matchmaking_queue.append(user)
            
            if len(matchmaking_queue) >= 2:
                game_session_id = self.create_game_session(matchmaking_queue.popleft(), matchmaking_queue.popleft())

                await self.send(text_data=json.dumps({
                    'status': 'game found',
                    'game_session_id': game_session_id
                }))
            else:
                await self.send(text_data=json.dumps({
                    'status': 'waiting for opponent'
                }))
        else:
            await self.send(text_data=json.dumps({
                'status': 'authentication required'
            }))
    
    def create_game_session(self, player1, player2):
        # generate a game session id
        game_session_id = str(uuid.uuid4())

        # initialize game state
        game_state = initialize_game_state()

        # assign players to game session
        game_state['players'] = [player1, player2]

        # store game state in the database
        game_sessions[game_session_id] = game_state

        return game_session_id
            