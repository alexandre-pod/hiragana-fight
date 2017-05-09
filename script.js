window.addEventListener('load', function() {
	Game.init();
	Score.init();
	// Game.start();
});


Game = {};

/*
 * Initialize the Game object by loading DOM elements
 */
Game.init = function () {
	this.viewNames = ['menu', 'levels', 'alphabet', 'quizz', 'scoreView']; //'scores',

	this.menu = {};
	this.menu.$view = document.querySelector('#menu');
	this.menu.$levelsButton = this.menu.$view.querySelector('#levelsButton');
	this.menu.$alphabetButton = this.menu.$view.querySelector('#alphabetButton');
	// this.menu.$bestScoresButton = this.menu.$view.querySelector('#bestScoresButton');

	this.levels = {};
	this.levels.$view = document.querySelector('#levelsList');
	this.levels.$menuButton = this.levels.$view.querySelector('.back_menu_btn');
	this.levels.$levelButtons = this.levels.$view.querySelectorAll('.level_btn');

	this.alphabet = {};
	this.alphabet.$view = document.querySelector('#alphabet');
	this.alphabet.$menuButton = this.alphabet.$view.querySelector('.back_menu_btn');

	this.scoreView = {};
	this.scoreView.$view = document.querySelector('#scoreView');
	this.scoreView.$levelNumber = this.scoreView.$view.querySelector('#levelNumber');
	this.scoreView.$scoreNumber = this.scoreView.$view.querySelector('#scoreNumber');
	this.scoreView.$retryButton = this.scoreView.$view.querySelector('#retryButton');
	this.scoreView.$menuButton = this.scoreView.$view.querySelector('#menuButton');
	this.scoreView.$nextButton = this.scoreView.$view.querySelector('#nextButton');


	this.quizz = {};
	this.quizz.$view = document.querySelector('#quizz');
	this.quizz.$levelNumber = this.quizz.$view.querySelector('#levelNumber');
	this.quizz.$caractereGame = this.quizz.$view.querySelector('#caractereGame');
	this.quizz.$solutionGame = this.quizz.$view.querySelector('#solutionGame');
	this.quizz.$pointNumber = this.quizz.$view.querySelector('#pointNumber');
	this.quizz.$responses = this.quizz.$view.querySelector('#responses');
	this.quizz.$menuButton = this.quizz.$view.querySelector('.back_menu_btn');

	this.level = 0;

	this.bindEvents();
};

/*
 * bind events to DOM elements
 */
Game.bindEvents = function() {
	this.menu.$levelsButton.addEventListener('click', Game.showLevels.bind(this));
	this.menu.$alphabetButton.addEventListener('click', Game.showAlphabet.bind(this));

	this.levels.$menuButton.addEventListener('click', Game.showMenu.bind(this));
	this.alphabet.$menuButton.addEventListener('click', Game.showMenu.bind(this));
	// this.scores.$menuButton.addEventListener('click', Game.showMenu.bind(this));
	this.quizz.$menuButton.addEventListener('click', Game.showMenu.bind(this));

	this.scoreView.$retryButton.addEventListener('click', Game.restartLevel.bind(this));
	this.scoreView.$menuButton.addEventListener('click', Game.showMenu.bind(this));
	this.scoreView.$nextButton.addEventListener('click', Game.nextLevel.bind(this));

	var li_elements = this.levels.$levelButtons;

	function startLevel(level) {
		return function() {
			Game.startLevel(level);
		};
	}

	for (var i=0 ; i<li_elements.length ; i++) {
		var niv_btn = li_elements[i];
		var level = niv_btn.dataset.level;
		level = parseInt(level, 10);
		niv_btn.addEventListener('click', startLevel(level));
	}

	this.quizz.$responses.addEventListener('click', function(e) {
		var target = e.target;
		while (target.nodeName != "BUTTON") {
			if (target == Game.quizz.$responses) {
				// click next to the button -> cancel
				return;
			}
			target = target.parentElement;
		}
		var response = e.target.dataset.response;
		if (response === '') {
			return;
		}
		Game.responseChoosen(response, e.target);
	});
};

Game.hideViews = function() {
	for(var i=0 ; i<this.viewNames.length ; i++) {
		this[this.viewNames[i]].$view.classList.add('hidden');
	}
};

/*
 * Show the menu view
*/
Game.showMenu = function() {
	this.hideViews();
	this.menu.$view.classList.remove('hidden');
};

/*
 * Show the levels view
*/
Game.showLevels = function() {
	this.hideViews();
	this.levels.$view.classList.remove('hidden');
	this.updateScoresOnLevels();
};

/*
 * Show the alphabet view
*/
Game.showAlphabet = function() {
	this.hideViews();
	this.alphabet.$view.classList.remove('hidden');
};

Game.startLevel = function(level) {
	Game.score = 0;
	Game.quizz.$pointNumber.innerHTML = Game.score;
	this.hideViews();
	this.quizz.$view.classList.remove('hidden');
	if (level == Game.levelsMap.length) {
		Game.end();
		return;
	}

	Game.lastCaractere = '-1';
	Game.totalBadResponseCount = 0;
	Game.correctCount = 0;
	Game.questionCount = 0;

	Game.quizz.$levelNumber.innerHTML = level;
	Game.responses = Game.levelsMap[level];
	Game.level = level;

	for(var i=0, j=Game.responses.length ; i<j ; i++) {
		var btn = Game.quizz.$responses.children[i].firstChild;
		btn.innerHTML = Game.responses[i];
		btn.dataset.response = Game.responses[i];
	}

	Game.nextQuestion();
};

Game.levelEnd = function(levelNumber, score) {
	var lastBest = Score.get(levelNumber);
	var newHighScore = false;
	this.scoreView.$scoreNumber.classList.remove('high');
	if (score > lastBest) {
		Score.setLevelScore(levelNumber, score);
		newHighScore = true;
		this.scoreView.$scoreNumber.classList.add('high');
	}
	Game.hideViews();
	this.scoreView.$view.classList.remove('hidden');
	this.scoreView.$levelNumber.innerHTML = levelNumber;
	this.scoreView.$scoreNumber.innerHTML = score;

	this.level = levelNumber;
};

Game.restartLevel = function() {
	Game.startLevel(Game.level);
};

Game.nextLevel = function() {
	Game.startLevel(Game.level+1);
};


Game.nextQuestion = function() {
	Game.badResponseCount = 0;
	Game.quizz.$solutionGame.classList.remove('visible');

	if (Game.questionCount == 5) {
		if (Game.totalBadResponseCount === 0) {
			Game.addScore(100);
		}
		// Game.startLevel(Game.level + 1);
		Game.levelEnd(Game.level, Game.score);
	}

	for(var i=0, j=Game.responses.length ; i<j ; i++) {
		var btn = Game.quizz.$responses.children[i].firstChild;
		btn.disabled = false;
	}

	Game.questionCount++;
	var nextCaractere;
	var try_car = 0;
	do {
		var pos = randInt(0, Game.responses.length-1);
		nextCaractere = Game.responses[pos];
		if (try_car > 10) {
			alert('ERROR');
			return;
		}
		try_car++;
	} while(nextCaractere === '' || nextCaractere == Game.lastCaractere);

	Game.lastCaractere = nextCaractere;
	// Response.setCorrectResponse(nextCaractere);
	Game.quizz.$caractereGame.innerHTML = alphabet[nextCaractere];
};

/*
 * manage the response input
 * @param {string} response - the response selected
 */
Game.responseChoosen = function(response, buttonElement) {
	if (Game.wait) {
		return;
	}
	if (response == Game.lastCaractere) {
		Game.correctResponse();
	}else {
		buttonElement.disabled = true;
		Game.badResponse();
	}
};

Game.correctResponse = function() {
	if(Game.badResponseCount) {
		Game.addScore(1);
	} else {
		Game.addScore(5);
	}
	this.nextQuestion();
};

Game.badResponse = function() {
	Game.badResponseCount += 1;
	if (Game.badResponseCount >= 3) {
		Game.showSolution();
		return;
	}
	Game.totalBadResponseCount += 1;
};

Game.showSolution = function() {
	Game.quizz.$solutionGame.innerHTML = Game.lastCaractere;
	Game.quizz.$solutionGame.classList.add('visible');
	Game.wait = true;
	setTimeout(function() {
		Game.wait = false;
		Game.nextQuestion();
	}, 3000);
};

Game.end = function() {
	alert('fini !');
};

Game.addScore = function(amount) {
	Game.score += amount;
	Game.quizz.$pointNumber.innerHTML = Game.score;
};

Game.updateScoresOnLevels = function() {
	var li_elements = this.levels.$levelButtons;

	for (var i=0 ; i<li_elements.length ; i++) {
		var elm = li_elements[i];
		var highScoreSpan = elm.querySelector('.highscore');
		highScoreSpan.innerHTML = Score.get(i);
	}
};


Game.levelsMap = [
	['a', 'i', 'u', 'e', 'o'],
	['ka', 'ki', 'ku', 'ke', 'ko'],
	['sa', 'shi', 'su', 'se', 'so'],
	['ta', 'chi', 'tsu', 'te', 'to'],
	['na', 'ni', 'nu', 'ne', 'no'],
	['ha', 'hi', 'fu', 'he', 'ho'],
	['ma', 'mi', 'mu', 'me', 'mo'],
	['ya', '', 'yu', '', 'yo'],
	['ra', 'ri', 'ru', 're', 'ro'],
	['wa', '', '', 'wo', 'n']
];


function randInt(min, max) {
	return Math.floor(Math.random()*(1+max-min) + min);
}

var alphabet = {
	'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
	'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
	'sa': 'さ', 'shi': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
	'ta': 'た', 'chi': 'ち', 'tsu': 'つ', 'te': 'て', 'to': 'と',
	'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
	'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'he': 'へ', 'ho': 'ほ',
	'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
	'ya': 'や', 'yu': 'ゆ', 'yo': 'よ	',
	'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
	'wa': 'わ', 'wo': 'を', 'n': 'ん'

};
// https://fr.wikiversity.org/wiki/Japonais/Grammaire/Alphabet/Système_graphique


var Score = {
	levelScore: {},
	/*
	 * Load score from Local storage or set it if absent
	*/
	init: function() {
		for(var i=0 ; i<Game.levelsMap.length ; i++) {
			var score = localStorage.getItem('level' + i);
			if (score === null) {
				Score.setLevelScore(i, 0);
				score = 0;
			}
			Score.levelScore[i] = parseInt(score, 10);
		}
	},
	setLevelScore: function(levelNumber, score) {
		localStorage.setItem('level' + levelNumber, score);
		Score.levelScore[levelNumber] = score;
	},
	reset: function() {
		localStorage.clear();
	},
	get: function(levelNumber) {
		return Score.levelScore[levelNumber];
	}
};

// window.addEventListener('load', function() {
// 	var list = [];
// 	for (var i in alphabet) {
// 		console.log(i);
// 		list.push(alphabet[i]);
// 	}

// 	index = 0;
// 	setInterval(function() {
// 		Game.quizz.$caractereGame.innerHTML = list[index];
// 		index = (index+1) % list.length;
// 	}, 50);
// });

// window.addEventListener('load', function() {
// 	index = 0;
// 	function nextLevel() {
// 		index = (index+1);
// 		index = index % Game.levels.length;
// 		console.log(index);
// 		Game.startLevel(index);

// 		setTimeout(nextLevel, 500);
// 	}
// 	setTimeout(nextLevel, 500);
// });