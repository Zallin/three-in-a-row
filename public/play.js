var playState = {
	create : function(){

		this.setIconSize(game.global);

		var icons = this.initIcons(game);

		this.board = this.initBoard(game, icons);

		this.sequence = this.initSequence(game);

		this.bonusLoader = this.initLoader(game);

		var self = this;

		this.board.onTurnFinished(function (res) {
			self.bonusLoader.add(res.points * res.combo);
		});

		this.board.makeTurn();

		this.tapped = false;
	},

	update : function () {
		if(game.input.activePointer.isDown){
			if(game.time.now - this.tapped < game.global.tapDelay) return;
			this.board.makeTurn();

			var relX = game.input.activePointer.x - game.global.offsetX,
				relY = game.input.activePointer.y - game.global.offsetY,
				index = Math.floor(relY / game.global.iconSize) * game.global.cols + Math.floor(relX / game.global.iconSize);

			this.insertIcon(index);
			this.tapped = game.time.now;
		}
	},

	insertIcon : function(index){
		var txt = this.sequence.getFirstKey();
		this.board.insertIcon(index, txt);
		this.sequence.shift();

		this.board.makeTurn();
	},

	setIconSize : function(global){
		var size = Math.floor((global.height - global.offsetY * 2) / global.rows); 
		while(size * global.cols > global.width - global.offsetX * 2){
			size--;
		}
		global.offsetX = (global.width - size * global.cols) / 2;
		global.offsetY = (global.height - size * global.rows) / 2;
		global.iconSize = size;
	}
}

playState.initIcons = function (game) {
	var iconScale = (game.global.iconSize / game.global.imageSize).toFixed(3),
		rows = game.global.rows, 
		cols = game.global.cols,
		icons = [];

	for(var i = 0, q = rows * cols; i < q; i++){
		var rnd = Math.floor(Math.random() * game.global.iconNames.length),
			x = Math.floor(game.global.offsetX + game.global.iconSize * (i % cols)),
			y = Math.floor(game.global.offsetY + game.global.iconSize * Math.floor(i / cols)),
			col = i % cols,
			row = Math.floor(i / cols);

		if(i > cols - 1){
			if(icons[i - cols].key === game.global.iconNames[rnd]) rnd = getRandomName(rnd);
		}
		if(i % cols > 0){
			if(icons[i - 1].key === game.global.iconNames[rnd]) rnd = getRandomName(rnd);
		}

		icons[i] = game.add.sprite(x, y, game.global.iconNames[rnd], 3);
		icons[i].scale.x = icons[i].scale.y = iconScale;
		game.physics.arcade.enable(icons[i]);

		icons[i].inH = false;
		icons[i].inV = false;
		icons[i].processed = false;

		icons[i].animations.add('create', [0, 1, 2, 3], 12);
	}

	function getRandomName (prev){
		var rnd = Math.floor(Math.random() * game.global.iconNames.length);
		if(rnd === prev) return getRandomName(rnd);
		return rnd;
	}

	return icons;
}

playState.initLoader = function () {
	var sprite = game.add.sprite(game.global.offsetX, game.global.offsetY / 3, game.global.loaderName),
		maxWidth = game.global.width - game.global.offsetX * 2,
		pointsMax = game.global.initialCapacity,
		points = 0,
		pointSize;

		setFraction();

		function setFraction(){
			pointSize = (maxWidth / pointsMax) / sprite.width;
		}

		return {
			add : function (ps) {
				sprite.scale.x += pointSize * ps;
				points += ps;
				if(points > pointsMax){
					sprite.scale.x = 1;
					pointsMax += 10;
					points = 0;
					setFraction();
				}
			}
		}
}


playState.initBoard = function (game, icons) {
	var	cols = game.global.cols,
		rows = game.global.rows,
		combs = [],
		toMove = [],
		combo = 0,
		points = 0,
		map = {};

		(function createMap () {
			for(var i = 0, l = icons.length; i < l; i++){
				var row = Math.floor(i / cols),
				col = i % cols,
				down = i + cols,
				right = i + 1;

				if(down > rows * cols) down = false;

				if(Math.floor(right / cols) > row) right = false;

				map[i] = {
					right : right,
					down : down
				}
			}
		}());

		function findThreesomes (){
			for(var i = 0, l = icons.length; i < l; i++){
				if (l - i > cols * 2){
					checkComb(i, 'inV', 'down');
				}
				if (i % cols < cols - 2){
					checkComb(i, 'inH', 'right');
				}
			}

			if(combs.length < 1) return;

			for(var i = 0, l = combs.length; i < l; i++){
				for(var k = 0, j = combs[i].length; k < j; k++){
					var index = combs[i][k];
					icons[index].visible = false;
					points += k + 1;
				}
			}
		}

		function checkComb (i, prop, dir){
			if (icons[i][prop]) return false;
			var current = [],
				hasComb = true;

			current.push(i);

			while(hasComb){
				var prev = icons[i],
				index = map[i][dir],
				icon = icons[index];

				if (icon.key == prev.key){
					current.push(index);
					if(!map[index][dir]) hasComb = false;
				}	
				else {
					hasComb = false;
				}
				i = index;
			}

			if(current.length > 2){
				for(var i = 0, l = current.length; i < l; i++){
					var index = current[i];
					icons[index][prop] = true;
				}
				combs.push(current);
			}
		}

		function computeMovements (){
			for(var i = 0, l = combs.length; i < l; i++){
				for(var k = 0, j = combs[i].length; k < j; k++){
					var index = combs[i][k],
					icon = icons[index];
					if ((icon.inV || icon.inH) && !icon.processed){
						shiftUpper(index);
						icon.processed = true;
					}
				}
			}
		}

		function shiftUpper (index) {
			for(var i = index - cols, l = index % cols; i >= l; i = i - cols){
				var icon = icons[i];
				if(!icon.visible) continue;
				if(i in toMove){
					toMove[i].y += icon.width;
					toMove[i].index += cols;	
				}
				else{
					toMove[i] = {
						y : icon.y + icon.width,
						index : i + cols
					};
				}
			}
		}

		function changeIndexes (){
			var keys = Object.keys(toMove);
			if(keys.length == 0) return;

			for(var i = keys.length - 1; i >= 0; i--){
				var n = keys[i],
					temp = icons[n],
					index = toMove[n].index;

				icons[n] = icons[index];
				icons[index]  = temp;
			}
			toMove = {};
		}

		function addIcons (func){
			var callback = {
				signals : 0,
				fn : (function () {
					var invoked = 0;
					return function(){
						if(++invoked == this.signals) func();
					}
				}())
			}

			for(var i = 0, l = icons.length; i < l; i++){
				if(!icons[i].visible){
					var rnd = Math.floor(Math.random() * game.global.iconNames.length),
					txt = game.global.iconNames[rnd],
					x = game.global.offsetX + (i % cols) * icons[i].width,
					y = game.global.offsetY + Math.floor(i / cols) * icons[i].width;

					icons[i].loadTexture(txt);
					icons[i].reset(x, y); 

					var anim = icons[i].animations.getAnimation('create');
					anim.onComplete.add(callback.fn, callback);
					callback.signals++;
					anim.play();
				}
			}
		}

		function moveIcons (fn){
			if(Object.keys(toMove).length == 0) return fn();

			var tweenCallback = (function () {
				var completed = 0,
				l = Object.keys(toMove).length;

				return function () {
					completed++;
					if(completed == l){
						fn();
					}
				}
			}());

			for(var i in toMove){
				var t = game.add.tween(icons[i]).to({ y : toMove[i].y}, 1000);
				t.onComplete.add(tweenCallback);
				t.start();
			}
		}

		function defaultValues (){
			for(var i = 0, l = icons.length; i < l; i++){
				icons[i].inV = false;
				icons[i].inH = false;
				icons[i].processed = false;
			}

			combs = []; 
		}

		return {
			makeTurn : function () {
				findThreesomes();
				if (combs.length === 0) return;

				combo += 1;
				computeMovements();

				var self = this;

				moveIcons(function () {
					changeIndexes();
					addIcons(function(){
						defaultValues();

						self.onTurnFinished({
							points : points, 
							combo : combo
						});

						combo = 0;
						points = 0;

						self.makeTurn(); 
					});
				});

			},

			onTurnFinished : (function(){
				var callback;
				return function(arg){
					if(!callback) callback = arg;
					else{
						callback(arg);
					}
				}
			}()),

			insertIcon : function (index, txt) {
				icons[index].loadTexture(txt, 3);
			}
		}
}

playState.initSequence = function (game) {
	var elements = [];
	for(var i = 0, l = game.global.sequenceLength; i < l; i++){
		var x = game.global.width / 2 - game.global.iconSize * 3 + i * game.global.iconSize,
			y = game.global.height - game.global.offsetY / 2 - game.global.iconSize / 2,
			name = game.global.iconNames[Math.floor(Math.random() * game.global.iconNames.length)];

		elements[i] = game.add.image(x, y, name, 3);
		elements[i].scale.x = elements[i].scale.y = (game.global.iconSize / game.global.imageSize).toFixed(3);
	}

	return {
		shift : function (){
			for(var i = 1, l = elements.length; i < l; i++){
				var txt = elements[i].key;
				elements[i - 1].loadTexture(txt, 3);
			}

			var name = game.global.iconNames[Math.floor(Math.random() * game.global.iconNames.length)];
			elements[elements.length - 1].loadTexture(name, 3);
		},

		getFirstKey : function () {
			return elements[0].key;
		}
	}
}