from game_base.models import TournamentBaseModel
from django.contrib.auth import get_user_model # type: ignore
from .core_base_handler import SendFunc, CoreHandlerBase

Player = get_user_model()

class TournamentHandlerBase(CoreHandlerBase):
	class Meta:
		abstract = True

	_handler_type: str	= 'Tournament'
	_subtype: str		= 'Unknown'
	_MIN_PLAYERS		= 3
	_MAX_PLAYERS		= 8

	def __init__(self, tournament_id: str):
		super().__init__(tournament_id)
		self._model: type[TournamentBaseModel] | None	= None
		self._id										= tournament_id
		self._required_players: int						= self._MIN_PLAYERS
		self._state										= {
			'pending_matches': [],
			'finished_matches': [],
			'match_results': {},
			'current_match': None,
			'leaderboard': {},
			'is_ready_to_start': {}
		}

	def set_tournament_size(self, size: int):
		if size < self._MIN_PLAYERS or size > self._MAX_PLAYERS:
			raise ValueError(f'Tournament size must be between ' +
					f'{self._MIN_PLAYERS} and {self._MAX_PLAYERS}.')
		self._required_players = size

	def join_tournament(self, player: Player, send_func: SendFunc) -> int | None: # type: ignore
		player_index = super()._join(player, send_func)
		if player_index:
			self._state['is_ready_to_start'].update({player.__str__(): False})
		return player_index

	def leave_tournament(self, player: Player): # type: ignore
		super()._leave(player)
		if player.__str__() in self._state['is_ready_to_start']:
			del self._state['is_ready_to_start'][player.__str__()]

	def __ready_to_start(self)-> bool:
		return (all(self._state['is_ready_to_start'].values())
			and len(self.players) == self._required_players)

	def set_as_ready(self, player_index: int):
		if player_index not in self._indexes:
			raise ValueError(f'Player #{player_index} not found.')
		player_str = self._indexes[player_index].__str__()
		self._state['is_ready_to_start'][player_str] = True
		if self.__ready_to_start():
			self._start_tournament()

	def _start_tournament(self, player_index: int):
		super()._start(player_index, self._start_matches)

	def _set_matches(self):
		raise NotImplementedError